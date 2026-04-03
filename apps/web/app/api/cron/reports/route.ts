import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { triggerN8nWebhook } from "@/lib/webhooks";

// Vercel Cron: every Monday at 08:00 (set in vercel.json)
// Also callable manually with Authorization header

function getPeriodRange(period: "WEEKLY" | "MONTHLY"): {
  start: Date;
  end: Date;
  label: string;
} {
  const now = new Date();
  if (period === "WEEKLY") {
    const day = now.getDay();
    const start = new Date(now);
    start.setDate(now.getDate() - day - 7); // last week
    start.setHours(0, 0, 0, 0);
    const end = new Date(start);
    end.setDate(start.getDate() + 6);
    end.setHours(23, 59, 59, 999);
    const year = start.getFullYear();
    const week = Math.ceil(
      ((start.getTime() - new Date(year, 0, 1).getTime()) / 86400000 + 1) / 7
    );
    return { start, end, label: `${year}-W${String(week).padStart(2, "0")}` };
  } else {
    const start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const end = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
    const label = `${start.getFullYear()}-${String(start.getMonth() + 1).padStart(2, "0")}`;
    return { start, end, label };
  }
}

type LeadRow = {
  firstName: string; lastName: string;
  phone: string | null; source: string | null;
  status: string;
  createdAt: Date;
};

const SOURCE_HE: Record<string, string> = {
  facebook: "פייסבוק", google: "גוגל", organic: "אורגני", manual: "ידני", other: "אחר",
};
const STATUS_HE: Record<string, string> = {
  NEW: "חדש", CONTACTED: "נוצר קשר", QUALIFIED: "מוסמך", PROPOSAL: "הצעה", WON: "נסגר", LOST: "אבוד",
};

function srcKey(s: string | null) {
  const v = s?.toLowerCase() ?? "";
  if (v.includes("facebook") || v.includes("fb")) return "facebook";
  if (v.includes("google")) return "google";
  if (v === "organic") return "organic";
  if (v === "manual") return "manual";
  return "other";
}

function buildEmailHtml(params: {
  clientName: string;
  clientSlug: string;
  type: string;
  period: string;
  totalLeads: number;
  wonLeads: number;
  conversionRate: number;
  revenue: number | null;
  topSource: string | null;
  sourceCount: Record<string, number>;
  leads: LeadRow[];
}): string {
  const typeHe = params.type === "WEEKLY" ? "שבועי" : "חודשי";
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "";
  const portalUrl = `${appUrl}/client/${params.clientSlug}`;

  const sourceRows = Object.entries(params.sourceCount)
    .sort((a, b) => b[1] - a[1])
    .map(([src, cnt]) => {
      const pct = params.totalLeads > 0 ? Math.round((cnt / params.totalLeads) * 100) : 0;
      const label = SOURCE_HE[srcKey(src)] ?? src;
      return `<tr>
        <td style="padding:8px 12px;font-size:13px;color:#374151">${label}</td>
        <td style="padding:8px 12px;font-size:13px;color:#374151;text-align:center">${cnt}</td>
        <td style="padding:8px 12px;font-size:13px;color:#374151;text-align:center">${pct}%</td>
      </tr>`;
    }).join("");

  const leadRows = params.leads.slice(0, 10).map(l => {
    const status = STATUS_HE[l.status] ?? l.status;
    const statusColor = l.status === "WON" ? "#059669" : l.status === "LOST" ? "#dc2626" : "#6b7280";
    return `<tr>
      <td style="padding:8px 12px;font-size:13px;color:#111827">${l.firstName} ${l.lastName}</td>
      <td style="padding:8px 12px;font-size:13px;color:#374151" dir="ltr">${l.phone ?? "—"}</td>
      <td style="padding:8px 12px;font-size:13px;color:#374151">${SOURCE_HE[srcKey(l.source)] ?? l.source ?? "—"}</td>
      <td style="padding:8px 12px;font-size:13px;font-weight:600;color:${statusColor}">${status}</td>
      <td style="padding:8px 12px;font-size:12px;color:#9ca3af">${new Date(l.createdAt).toLocaleDateString("he-IL")}</td>
    </tr>`;
  }).join("");

  return `<!DOCTYPE html>
<html dir="rtl" lang="he">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>דוח ${typeHe}</title></head>
<body style="font-family:Arial,Helvetica,sans-serif;background:#f3f4f6;margin:0;padding:24px 16px;direction:rtl">
  <div style="max-width:600px;margin:0 auto">

    <!-- Header -->
    <div style="background:#6366f1;border-radius:12px 12px 0 0;padding:28px 28px 24px">
      <div style="display:flex;align-items:center;gap:12px;margin-bottom:8px">
        <div style="width:40px;height:40px;background:rgba(255,255,255,.2);border-radius:10px;display:inline-flex;align-items:center;justify-content:center">
          <span style="color:#fff;font-weight:700;font-size:18px">${params.clientName[0]}</span>
        </div>
        <div>
          <h1 style="margin:0;font-size:18px;color:#fff;font-weight:700">דוח ${typeHe} — ${params.clientName}</h1>
          <p style="margin:2px 0 0;font-size:13px;color:rgba(255,255,255,.75)">תקופה: ${params.period}</p>
        </div>
      </div>
    </div>

    <!-- Body -->
    <div style="background:#fff;padding:28px;border-radius:0 0 12px 12px;box-shadow:0 2px 8px rgba(0,0,0,.08)">

      <p style="font-size:15px;color:#374151;margin:0 0 24px">שלום,<br>הנה סיכום הפעילות ${params.type === "WEEKLY" ? "השבוע" : "החודש"} עבור <strong>${params.clientName}</strong>:</p>

      <!-- Stats grid -->
      <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px">
        <tr>
          <td width="25%" style="padding:4px">
            <div style="background:#eff6ff;border-radius:10px;padding:16px;text-align:center">
              <p style="font-size:28px;font-weight:700;margin:0;color:#1e40af">${params.totalLeads}</p>
              <p style="font-size:12px;color:#6b7280;margin:4px 0 0">לידים חדשים</p>
            </div>
          </td>
          <td width="25%" style="padding:4px">
            <div style="background:#ecfdf5;border-radius:10px;padding:16px;text-align:center">
              <p style="font-size:28px;font-weight:700;margin:0;color:#059669">${params.wonLeads}</p>
              <p style="font-size:12px;color:#6b7280;margin:4px 0 0">נסגרו</p>
            </div>
          </td>
          <td width="25%" style="padding:4px">
            <div style="background:#f5f3ff;border-radius:10px;padding:16px;text-align:center">
              <p style="font-size:28px;font-weight:700;margin:0;color:#6366f1">${params.conversionRate.toFixed(1)}%</p>
              <p style="font-size:12px;color:#6b7280;margin:4px 0 0">המרה</p>
            </div>
          </td>
          <td width="25%" style="padding:4px">
            <div style="background:#fffbeb;border-radius:10px;padding:16px;text-align:center">
              <p style="font-size:28px;font-weight:700;margin:0;color:#d97706">${params.revenue ? `₪${Math.round(params.revenue).toLocaleString("he-IL")}` : "—"}</p>
              <p style="font-size:12px;color:#6b7280;margin:4px 0 0">הכנסה</p>
            </div>
          </td>
        </tr>
      </table>

      ${sourceRows ? `
      <!-- Source breakdown -->
      <h3 style="font-size:14px;font-weight:700;color:#111827;margin:0 0 12px">מקורות לידים</h3>
      <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e5e7eb;border-radius:8px;overflow:hidden;margin-bottom:28px">
        <thead>
          <tr style="background:#f9fafb">
            <th style="padding:10px 12px;font-size:12px;color:#6b7280;font-weight:600;text-align:right">מקור</th>
            <th style="padding:10px 12px;font-size:12px;color:#6b7280;font-weight:600;text-align:center">לידים</th>
            <th style="padding:10px 12px;font-size:12px;color:#6b7280;font-weight:600;text-align:center">אחוז</th>
          </tr>
        </thead>
        <tbody>${sourceRows}</tbody>
      </table>` : ""}

      ${leadRows ? `
      <!-- Leads table -->
      <h3 style="font-size:14px;font-weight:700;color:#111827;margin:0 0 12px">לידים אחרונים</h3>
      <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e5e7eb;border-radius:8px;overflow:hidden;margin-bottom:28px">
        <thead>
          <tr style="background:#f9fafb">
            <th style="padding:10px 12px;font-size:12px;color:#6b7280;font-weight:600;text-align:right">שם</th>
            <th style="padding:10px 12px;font-size:12px;color:#6b7280;font-weight:600;text-align:right">טלפון</th>
            <th style="padding:10px 12px;font-size:12px;color:#6b7280;font-weight:600;text-align:right">מקור</th>
            <th style="padding:10px 12px;font-size:12px;color:#6b7280;font-weight:600;text-align:right">סטטוס</th>
            <th style="padding:10px 12px;font-size:12px;color:#6b7280;font-weight:600;text-align:right">תאריך</th>
          </tr>
        </thead>
        <tbody>${leadRows}</tbody>
      </table>` : ""}

      <!-- Portal CTA -->
      <div style="background:#f0f0ff;border-radius:10px;padding:20px;text-align:center">
        <p style="font-size:14px;color:#374151;margin:0 0 12px">לצפייה בכל הנתונים בדשבורד המלא:</p>
        <a href="${portalUrl}" style="display:inline-block;background:#6366f1;color:#fff;font-weight:600;font-size:14px;padding:12px 28px;border-radius:8px;text-decoration:none">
          כניסה לדשבורד
        </a>
      </div>
    </div>

    <!-- Footer -->
    <div style="text-align:center;padding:20px;font-size:12px;color:#9ca3af">
      נוצר אוטומטית על ידי <strong>MarketingOS</strong> · לביטול קבלת דוחות השב לאימייל זה
    </div>
  </div>
</body>
</html>`;
}

export async function GET(req: NextRequest) {
  // Protect with cron secret
  const authHeader = req.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();
  const isMonday = now.getDay() === 1;
  const isFirstOfMonth = now.getDate() === 1;

  const clients = await prisma.client.findMany({
    where: { isActive: true },
    select: {
      id: true,
      name: true,
      slug: true,
      reportEmail: true,
      reportFrequency: true,
    },
  });

  const results: { clientId: string; type: string; success: boolean }[] = [];

  for (const client of clients) {
    const types: Array<"WEEKLY" | "MONTHLY"> = [];
    if (
      client.reportFrequency === "WEEKLY" ||
      client.reportFrequency === "BOTH"
    ) {
      if (isMonday) types.push("WEEKLY");
    }
    if (
      client.reportFrequency === "MONTHLY" ||
      client.reportFrequency === "BOTH"
    ) {
      if (isFirstOfMonth) types.push("MONTHLY");
    }

    for (const type of types) {
      try {
        const { start, end, label } = getPeriodRange(type);

        const leads = await prisma.lead.findMany({
          where: { clientId: client.id, createdAt: { gte: start, lte: end } },
          select: { status: true, source: true, value: true, firstName: true, lastName: true, phone: true, createdAt: true },
          orderBy: { createdAt: "desc" },
        });

        const totalLeads = leads.length;
        const wonLeads = leads.filter((l) => l.status === "WON").length;
        const lostLeads = leads.filter((l) => l.status === "LOST").length;
        const conversionRate = totalLeads > 0 ? (wonLeads / totalLeads) * 100 : 0;
        const revenue = leads
          .filter((l) => l.status === "WON")
          .reduce((sum, l) => sum + (l.value ?? 0), 0);
        const sourceCount: Record<string, number> = {};
        for (const l of leads) {
          const src = l.source ?? "other";
          sourceCount[src] = (sourceCount[src] ?? 0) + 1;
        }
        const topSource =
          Object.entries(sourceCount).sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;

        const report = await prisma.report.create({
          data: {
            clientId: client.id,
            type,
            period: label,
            totalLeads,
            wonLeads,
            lostLeads,
            conversionRate,
            topSource,
            revenue: revenue > 0 ? revenue : null,
          },
        });

        // Send email via Resend if configured
        if (client.reportEmail && process.env.RESEND_API_KEY) {
          const html = buildEmailHtml({
            clientName:    client.name,
            clientSlug:    client.slug,
            type,
            period:        label,
            totalLeads,
            wonLeads,
            conversionRate,
            revenue:       revenue > 0 ? revenue : null,
            topSource,
            sourceCount,
            leads,
          });

          await fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: {
              Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              from: process.env.RESEND_FROM ?? "reports@marketingos.co.il",
              to: client.reportEmail,
              subject: `דוח ${type === "WEEKLY" ? "שבועי" : "חודשי"} — ${client.name} (${label})`,
              html,
            }),
          });
        }

        // Trigger n8n webhook
        triggerN8nWebhook(client.id, "report.generated", {
          report: {
            id: report.id,
            type,
            period: label,
            totalLeads,
            wonLeads,
            conversionRate: conversionRate.toFixed(1),
            revenue,
          },
        }).catch(() => {});

        results.push({ clientId: client.id, type, success: true });
      } catch (err) {
        console.error(`[cron/reports] Failed for client ${client.id}:`, err);
        results.push({ clientId: client.id, type, success: false });
      }
    }
  }

  return NextResponse.json({
    processed: results.length,
    results,
    ran: { weekly: isMonday, monthly: isFirstOfMonth },
  });
}
