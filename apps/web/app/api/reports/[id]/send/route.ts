import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const FROM_EMAIL = process.env.FROM_EMAIL ?? "reports@marketingos.io";

// POST /api/reports/[id]/send — שליחת דוח במייל ללקוח
export async function POST(
  _req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "לא מורשה" }, { status: 401 });
    }

    const report = await prisma.report.findUnique({
      where: { id: params.id },
      include: {
        client: {
          select: {
            id: true,
            name: true,
            reportEmail: true,
            email: true,
            primaryColor: true,
          },
        },
      },
    });

    if (!report) {
      return NextResponse.json({ error: "דוח לא נמצא" }, { status: 404 });
    }

    // בדיקת הרשאה
    if (session.clientId && session.clientId !== report.clientId) {
      return NextResponse.json({ error: "אין הרשאה" }, { status: 403 });
    }

    const toEmail = report.client.reportEmail ?? report.client.email;
    if (!toEmail) {
      return NextResponse.json({ error: "לא הוגדרה כתובת מייל לדוחות עבור לקוח זה" }, { status: 400 });
    }

    if (!RESEND_API_KEY) {
      return NextResponse.json({ error: "מפתח Resend לא מוגדר ב-.env" }, { status: 500 });
    }

    const periodLabel = report.type === "WEEKLY" ? "שבועי" : "חודשי";
    const convRate = report.conversionRate.toFixed(1);
    const color = report.client.primaryColor ?? "#4F46E5";

    // HTML מייל מעוצב
    const html = `
<!DOCTYPE html>
<html dir="rtl" lang="he">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>דוח ${periodLabel} — ${report.client.name}</title>
</head>
<body style="margin:0;padding:0;font-family:Arial,sans-serif;background:#f8fafc;direction:rtl;">
  <div style="max-width:600px;margin:40px auto;background:white;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">

    <!-- Header -->
    <div style="background:${color};padding:32px 40px;text-align:center;">
      <div style="width:56px;height:56px;background:rgba(255,255,255,0.2);border-radius:16px;display:inline-flex;align-items:center;justify-content:center;margin-bottom:16px;">
        <span style="color:white;font-size:22px;font-weight:bold;">${report.client.name[0]}</span>
      </div>
      <h1 style="margin:0;color:white;font-size:24px;font-weight:700;">${report.client.name}</h1>
      <p style="margin:8px 0 0;color:rgba(255,255,255,0.8);font-size:14px;">דוח ${periodLabel} | תקופה: ${report.period}</p>
    </div>

    <!-- Stats -->
    <div style="padding:32px 40px;">
      <h2 style="margin:0 0 20px;font-size:18px;color:#1e293b;">סיכום ביצועים</h2>

      <table style="width:100%;border-collapse:collapse;">
        <tr>
          <td style="padding:6px 0;font-size:14px;color:#64748b;">סה"כ לידים</td>
          <td style="padding:6px 0;font-size:18px;font-weight:700;color:#1e293b;text-align:left;">${report.totalLeads}</td>
        </tr>
        <tr>
          <td style="padding:6px 0;font-size:14px;color:#64748b;">עסקאות שנסגרו</td>
          <td style="padding:6px 0;font-size:18px;font-weight:700;color:#22c55e;text-align:left;">${report.wonLeads}</td>
        </tr>
        <tr>
          <td style="padding:6px 0;font-size:14px;color:#64748b;">לידים שאבדו</td>
          <td style="padding:6px 0;font-size:18px;font-weight:700;color:#ef4444;text-align:left;">${report.lostLeads}</td>
        </tr>
        <tr>
          <td style="padding:6px 0;font-size:14px;color:#64748b;">שיעור המרה</td>
          <td style="padding:6px 0;font-size:18px;font-weight:700;color:${color};text-align:left;">${convRate}%</td>
        </tr>
        ${report.revenue ? `
        <tr>
          <td style="padding:6px 0;font-size:14px;color:#64748b;">הכנסות</td>
          <td style="padding:6px 0;font-size:18px;font-weight:700;color:#1e293b;text-align:left;">₪${Number(report.revenue).toLocaleString("he-IL")}</td>
        </tr>
        ` : ""}
        ${report.topSource ? `
        <tr>
          <td style="padding:6px 0;font-size:14px;color:#64748b;">מקור מוביל</td>
          <td style="padding:6px 0;font-size:14px;font-weight:600;color:#1e293b;text-align:left;">${report.topSource}</td>
        </tr>
        ` : ""}
      </table>

      <!-- Visual bar -->
      <div style="margin-top:28px;padding:20px;background:#f8fafc;border-radius:12px;">
        <p style="margin:0 0 12px;font-size:13px;color:#64748b;font-weight:600;">שיעור המרה</p>
        <div style="background:#e2e8f0;height:10px;border-radius:999px;overflow:hidden;">
          <div style="width:${Math.min(100, Number(convRate))}%;background:${color};height:100%;border-radius:999px;"></div>
        </div>
        <p style="margin:6px 0 0;font-size:12px;color:#94a3b8;">${convRate}% מסה"כ ${report.totalLeads} לידים</p>
      </div>
    </div>

    <!-- Footer -->
    <div style="padding:20px 40px;background:#f8fafc;border-top:1px solid #e2e8f0;text-align:center;">
      <p style="margin:0;font-size:12px;color:#94a3b8;">
        דוח זה נוצר אוטומטית ע"י MarketingOS<br/>
        © ${new Date().getFullYear()} MarketingOS · כל הזכויות שמורות
      </p>
    </div>
  </div>
</body>
</html>`;

    // שליחה דרך Resend API
    const resendRes = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: FROM_EMAIL,
        to: [toEmail],
        subject: `📊 דוח ${periodLabel} — ${report.client.name} | ${report.period}`,
        html,
      }),
    });

    const resendData = await resendRes.json();

    if (!resendRes.ok) {
      console.error("Resend error:", resendData);
      return NextResponse.json(
        { error: "שגיאה בשליחת המייל", details: resendData },
        { status: 502 }
      );
    }

    return NextResponse.json({
      ok: true,
      messageId: resendData.id,
      sentTo: toEmail,
    });
  } catch (err) {
    console.error("POST /api/reports/[id]/send error:", err);
    return NextResponse.json({ error: "שגיאת שרת" }, { status: 500 });
  }
}
