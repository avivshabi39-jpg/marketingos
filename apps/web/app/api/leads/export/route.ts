import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import * as XLSX from "xlsx";

export const dynamic = "force-dynamic";

// GET /api/leads/export — הורדת לידים כ-CSV
// Query params: clientId, status, source, from, to
export async function GET(req: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "לא מורשה" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const clientId  = searchParams.get("clientId")  ?? undefined;
    const status    = searchParams.get("status")    ?? undefined;
    const source    = searchParams.get("source")    ?? undefined;
    const from      = searchParams.get("from")      ?? undefined;
    const to        = searchParams.get("to")        ?? undefined;
    const format    = searchParams.get("format")    ?? "csv";

    // סינון לפי הרשאות session
    const where: Record<string, unknown> = {};

    if (session.clientId) {
      // Scoped user — always filter to their assigned client
      where.clientId = session.clientId;
    } else if (session.role === "SUPER_ADMIN") {
      // Super-admin — can export any client
      if (clientId) where.clientId = clientId;
    } else {
      // Regular admin — restrict to owned clients
      if (clientId) {
        const owned = await prisma.client.findFirst({
          where: { id: clientId, ownerId: session.userId },
          select: { id: true },
        });
        if (!owned) {
          return NextResponse.json({ error: "אין הרשאה" }, { status: 403 });
        }
        where.clientId = clientId;
      } else {
        const ownedClients = await prisma.client.findMany({
          where: { ownerId: session.userId },
          select: { id: true },
        });
        where.clientId = { in: ownedClients.map((c: { id: string }) => c.id) };
      }
    }

    Object.assign(where, {
      ...(status  ? { status }  : {}),
      ...(source  ? { source }  : {}),
      ...(from || to
        ? {
            createdAt: {
              ...(from ? { gte: new Date(from) } : {}),
              ...(to   ? { lte: new Date(to)   } : {}),
            },
          }
        : {}),
    });

    const leads = await prisma.lead.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: 5000, // מקסימום 5,000 שורות לייצוא
      include: {
        client: { select: { name: true } },
      },
    });

    const COLUMNS = [
      "שם פרטי", "שם משפחה", "טלפון", "קישור להתקשרות", "אימייל",
      "מקור", "סטטוס", "ניקוד", "ערך עסקה",
      "UTM מקור", "UTM מדיה", "UTM קמפיין",
      "לקוח", "תאריך יצירה", "תאריך עדכון",
    ];

    const STATUS_HE: Record<string, string> = {
      NEW: "חדש", CONTACTED: "נוצר קשר", QUALIFIED: "מוסמך",
      PROPOSAL: "הצעה", WON: "נסגר", LOST: "אבוד",
    };

    const today = new Date().toISOString().split("T")[0];

    const dataRows = leads.map((lead) => [
      lead.firstName,
      lead.lastName,
      lead.phone ?? "",
      lead.phone ? `tel:${lead.phone.replace(/[^0-9+]/g, "")}` : "",
      lead.email ?? "",
      lead.source ?? "",
      STATUS_HE[lead.status] ?? lead.status,
      lead.leadScore,
      lead.value ?? "",
      lead.utmSource ?? "",
      lead.utmMedium ?? "",
      lead.utmCampaign ?? "",
      lead.client.name,
      new Date(lead.createdAt).toLocaleDateString("he-IL"),
      new Date(lead.updatedAt).toLocaleDateString("he-IL"),
    ]);

    if (format === "xlsx") {
      const ws = XLSX.utils.aoa_to_sheet([COLUMNS, ...dataRows]);
      // Auto-width columns
      ws["!cols"] = COLUMNS.map((h) => ({ wch: Math.max(h.length + 4, 12) }));
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "לידים");
      const buf = Buffer.from(XLSX.write(wb, { type: "array", bookType: "xlsx" }) as ArrayBuffer);
      const filename = `לידים-${today}.xlsx`;
      return new NextResponse(buf, {
        status: 200,
        headers: {
          "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          "Content-Disposition": `attachment; filename="${encodeURIComponent(filename)}"`,
          "Cache-Control": "no-store",
        },
      });
    }

    // CSV fallback with BOM for Hebrew Excel support
    function escapeCSV(val: unknown): string {
      const str = val == null ? "" : String(val);
      if (str.includes(",") || str.includes('"') || str.includes("\n")) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    }

    const BOM = "\uFEFF";
    const rows = dataRows.map((row) => row.map(escapeCSV).join(","));
    const csv = BOM + [COLUMNS.join(","), ...rows].join("\n");
    const filename = `leads-export-${today}.csv`;

    return new NextResponse(csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (err) {
    console.error("GET /api/leads/export error:", err);
    return NextResponse.json({ error: "שגיאת שרת" }, { status: 500 });
  }
}
