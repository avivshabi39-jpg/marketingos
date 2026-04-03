import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { callClaude } from "@/lib/ai";

export async function POST(req: NextRequest) {
  // Verify cron secret
  const secret = req.headers.get("x-cron-secret") ?? req.nextUrl.searchParams.get("secret");
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();
  const weekStart = new Date(now.getTime() - 7 * 86400000);
  const prevWeekStart = new Date(weekStart.getTime() - 7 * 86400000);

  // Get all active clients with AI enabled and a whatsapp number
  const clients = await prisma.client.findMany({
    where: { isActive: true },
    select: {
      id: true,
      name: true,
      slug: true,
      whatsappNumber: true,
      aiAgentEnabled: true,
      industry: true,
    },
  });

  const results: { clientId: string; status: string; report?: string }[] = [];
  const aiKey = process.env.ANTHROPIC_API_KEY;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  for (const client of clients) {
    try {
      const [leadsWeek, leadsPrevWeek, wonLeads, totalLeads, topSourceRows] = await Promise.all([
        prisma.lead.count({ where: { clientId: client.id, createdAt: { gte: weekStart } } }),
        prisma.lead.count({ where: { clientId: client.id, createdAt: { gte: prevWeekStart, lt: weekStart } } }),
        prisma.lead.count({ where: { clientId: client.id, status: "WON", createdAt: { gte: weekStart } } }),
        prisma.lead.count({ where: { clientId: client.id } }),
        prisma.lead.groupBy({
          by: ["source"],
          where: { clientId: client.id, createdAt: { gte: weekStart }, source: { not: null } },
          _count: { id: true },
          orderBy: { _count: { id: "desc" } },
          take: 1,
        }).catch(() => []),
      ]);

      const conversionRate = totalLeads > 0 ? Math.round((wonLeads / totalLeads) * 100) : 0;
      const change = leadsPrevWeek > 0
        ? Math.round(((leadsWeek - leadsPrevWeek) / leadsPrevWeek) * 100)
        : 0;
      const topSource = (topSourceRows[0] as { source?: string } | undefined)?.source ?? "ישיר";

      let reportText: string;

      if (aiKey && !aiKey.startsWith("sk-ant-placeholder")) {
        const prompt = `כתוב דוח שיווקי שבועי קצר בעברית ל${client.name}:
- לידים השבוע: ${leadsWeek} (${change > 0 ? "+" : ""}${change}% לעומת שבוע שעבר)
- לידים שנסגרו: ${wonLeads}
- שיעור המרה: ${conversionRate}%
- מקור עיקרי: ${topSource}

תן 2 המלצות ספציפיות לשיפור. סגנון: ידידותי, קצר, עד 5 שורות.`;

        try {
          const result = await callClaude(prompt, 400);
          reportText = result.text;
        } catch {
          reportText = `סיכום שבועי — ${client.name}:\n${leadsWeek} לידים השבוע (${change > 0 ? "+" : ""}${change}%), ${conversionRate}% המרה. מקור: ${topSource}.`;
        }
      } else {
        reportText = `סיכום שבועי — ${client.name}:\n${leadsWeek} לידים השבוע (${change > 0 ? "+" : ""}${change}%), ${conversionRate}% המרה. מקור: ${topSource}.`;
      }

      // Save to reports DB
      await prisma.report.create({
        data: {
          clientId: client.id,
          type: "WEEKLY",
          period: `${now.getFullYear()}-W${String(Math.ceil((now.getTime() - new Date(now.getFullYear(), 0, 1).getTime()) / 604800000)).padStart(2, "0")}`,
          totalLeads: leadsWeek,
          wonLeads,
          lostLeads: 0,
          conversionRate,
          topSource,
          revenue: null,
        },
      });

      results.push({ clientId: client.id, status: "ok", report: reportText.slice(0, 200) });
    } catch (err) {
      results.push({ clientId: client.id, status: "error" });
    }
  }

  return NextResponse.json({
    processed: results.length,
    ok: results.filter((r) => r.status === "ok").length,
    results,
  });
}
