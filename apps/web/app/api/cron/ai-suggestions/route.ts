import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// POST /api/cron/ai-suggestions
// Called by cron every 24h. Generates proactive suggestions for each active client.
export async function POST(req: NextRequest) {
  // Validate cron secret to prevent unauthorized calls
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret) {
    const authHeader = req.headers.get("authorization");
    if (authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  const clients = await prisma.client.findMany({
    where: { isActive: true, aiAgentEnabled: true },
    select: {
      id: true,
      pagePublished: true,
      abTestEnabled: true,
      landingPageTitle: true,
      _count: { select: { leads: true } },
    },
  });

  let created = 0;

  for (const client of clients) {
    const suggestions: Array<{ suggestion: string; type: string }> = [];

    // No leads in 7 days → suggest CTA change
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const recentLeads = await prisma.lead.count({
      where: { clientId: client.id, createdAt: { gte: sevenDaysAgo } },
    });

    if (recentLeads === 0) {
      suggestions.push({
        suggestion: "לא התקבלו לידים ב-7 ימים האחרונים — כדאי לשנות את כפתור הקריאה לפעולה",
        type: "change_cta",
      });
    }

    // Low title length → suggest improvement
    if (client.landingPageTitle && client.landingPageTitle.length < 10) {
      suggestions.push({
        suggestion: "הכותרת שלך קצרה מדי — כותרת ממוקדת יותר תשפר המרות",
        type: "improve_title",
      });
    }

    // A/B test not active and page published → suggest A/B
    if (client.pagePublished && !client.abTestEnabled) {
      suggestions.push({
        suggestion: "הדף שלך פורסם — הפעל A/B test כדי לבדוק גרסה משופרת",
        type: "add_ab_test",
      });
    }

    // Low total leads → suggest page rebuild
    if (client._count.leads < 3 && client.pagePublished) {
      suggestions.push({
        suggestion: "מעט לידים עד כה — נסה לבנות את הדף מחדש עם AI לתוצאות טובות יותר",
        type: "general",
      });
    }

    // Don't flood — max 2 unread suggestions per client at a time
    const existingUnread = await prisma.aiSuggestion.count({
      where: { clientId: client.id, isRead: false },
    });

    const toCreate = suggestions.slice(0, Math.max(0, 2 - existingUnread));

    if (toCreate.length > 0) {
      await prisma.aiSuggestion.createMany({
        data: toCreate.map((s) => ({ clientId: client.id, ...s })),
      });
      created += toCreate.length;
    }
  }

  return NextResponse.json({ ok: true, created, clients: clients.length });
}
