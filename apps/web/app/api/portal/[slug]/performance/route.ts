import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getClientSession } from "@/lib/clientAuth";
import { getSession, isSuperAdmin } from "@/lib/auth";

export async function GET(
  _req: NextRequest,
  { params }: { params: { slug: string } }
) {
  // Support both admin and client portal auth
  const adminSession = await getSession();
  const clientPortal = adminSession ? null : await getClientSession();
  if (!adminSession && !clientPortal) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const client = await prisma.client.findUnique({
    where: { slug: params.slug },
    select: { id: true, isActive: true, ownerId: true },
  });
  if (!client || !client.isActive) {
    return NextResponse.json({ error: "לא נמצא" }, { status: 404 });
  }
  // Admin must own the client (super-admin exempt)
  if (adminSession && !isSuperAdmin(adminSession) && client.ownerId !== adminSession.userId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  // Client portal can only see their own data
  if (clientPortal && clientPortal.clientId !== client.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const now = new Date();
  const todayStart  = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const weekStart   = new Date(now.getTime() - 7  * 86400000);
  const monthStart  = new Date(now.getFullYear(), now.getMonth(), 1);

  const [leadsToday, leadsWeek, leadsMonth, totalLeads, wonLeads, pageViewsToday, pageViewsWeek, pageViewsMonth, topSourceRow] = await Promise.all([
    prisma.lead.count({ where: { clientId: client.id, createdAt: { gte: todayStart } } }),
    prisma.lead.count({ where: { clientId: client.id, createdAt: { gte: weekStart } } }),
    prisma.lead.count({ where: { clientId: client.id, createdAt: { gte: monthStart } } }),
    prisma.lead.count({ where: { clientId: client.id } }),
    prisma.lead.count({ where: { clientId: client.id, status: "WON" } }),
    prisma.pageView.count({ where: { clientId: client.id, createdAt: { gte: todayStart } } }).catch(() => 0),
    prisma.pageView.count({ where: { clientId: client.id, createdAt: { gte: weekStart } } }).catch(() => 0),
    prisma.pageView.count({ where: { clientId: client.id, createdAt: { gte: monthStart } } }).catch(() => 0),
    prisma.lead.groupBy({
      by: ["source"],
      where: { clientId: client.id, source: { not: null } },
      _count: { id: true },
      orderBy: { _count: { id: "desc" } },
      take: 1,
    }).catch(() => []),
  ]);

  const conversionRate = totalLeads > 0 ? Math.round((wonLeads / totalLeads) * 100) : 0;

  // Determine trend: compare this week vs prev week
  const prevWeekStart = new Date(weekStart.getTime() - 7 * 86400000);
  const leadsLastWeek = await prisma.lead.count({
    where: { clientId: client.id, createdAt: { gte: prevWeekStart, lt: weekStart } },
  });
  const trend: "up" | "down" | "stable" =
    leadsWeek > leadsLastWeek + 1 ? "up" :
    leadsWeek < leadsLastWeek - 1 ? "down" : "stable";

  // Sparkline: leads per day for last 7 days
  const sparkline: number[] = [];
  for (let i = 6; i >= 0; i--) {
    const dayStart = new Date(now.getTime() - i * 86400000);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(dayStart.getTime() + 86400000);
    const count = await prisma.lead.count({
      where: { clientId: client.id, createdAt: { gte: dayStart, lt: dayEnd } },
    });
    sparkline.push(count);
  }

  return NextResponse.json({
    pageViews: { today: pageViewsToday, week: pageViewsWeek, month: pageViewsMonth },
    leads:     { today: leadsToday,     week: leadsWeek,     month: leadsMonth },
    conversionRate,
    topSource: (topSourceRow[0] as { source?: string } | undefined)?.source ?? "ישיר",
    trend,
    sparkline,
    leadsLastWeek,
  });
}
