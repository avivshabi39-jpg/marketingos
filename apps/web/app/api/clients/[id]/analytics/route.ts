import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession, isSuperAdmin } from "@/lib/auth";
import { getClientSession } from "@/lib/clientAuth";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getSession();
  const clientSession = session ? null : await getClientSession();
  if (!session && !clientSession) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (session && !isSuperAdmin(session)) {
    const client = await prisma.client.findUnique({ where: { id: params.id }, select: { ownerId: true } });
    if (!client || client.ownerId !== session.userId) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const days = Math.min(parseInt(searchParams.get("days") ?? "30"), 90);

  const since = new Date();
  since.setDate(since.getDate() - days);

  const [pageViews, leadCount, leadsBySource] = await Promise.all([
    prisma.pageView.findMany({
      where: { clientId: params.id, createdAt: { gte: since } },
      orderBy: { createdAt: "asc" },
      select: { createdAt: true, page: true, source: true },
    }),
    prisma.lead.count({ where: { clientId: params.id, createdAt: { gte: since } } }),
    prisma.lead.groupBy({
      by: ["utmSource"],
      where: { clientId: params.id, createdAt: { gte: since } },
      _count: { _all: true },
    }),
  ]);

  // Group page views by day
  const byDay: Record<string, number> = {};
  for (const pv of pageViews) {
    const day = pv.createdAt.toISOString().slice(0, 10);
    byDay[day] = (byDay[day] ?? 0) + 1;
  }

  // Group by source
  const bySource: Record<string, number> = {};
  for (const pv of pageViews) {
    const src = pv.source ?? "direct";
    bySource[src] = (bySource[src] ?? 0) + 1;
  }

  const totalViews = pageViews.length;
  const conversionRate = totalViews > 0 ? Math.round((leadCount / totalViews) * 100 * 10) / 10 : 0;

  // Extra counts for overview
  const today = new Date(new Date().setHours(0, 0, 0, 0));
  const sevenDaysAgo = new Date(Date.now() - 7 * 86400000);
  const [viewsToday, viewsWeek, totalLeadsAll] = await Promise.all([
    prisma.pageView.count({ where: { clientId: params.id, createdAt: { gte: today } } }),
    prisma.pageView.count({ where: { clientId: params.id, createdAt: { gte: sevenDaysAgo } } }),
    prisma.lead.count({ where: { clientId: params.id } }),
  ]);

  // Daily chart (7 days)
  const DAYS = ["א", "ב", "ג", "ד", "ה", "ו", "ש"];
  const dailyViews = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(); d.setDate(d.getDate() - i);
    const s = new Date(d.getFullYear(), d.getMonth(), d.getDate());
    const e = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59);
    const [dv, dl] = await Promise.all([
      prisma.pageView.count({ where: { clientId: params.id, createdAt: { gte: s, lte: e } } }),
      prisma.lead.count({ where: { clientId: params.id, createdAt: { gte: s, lte: e } } }),
    ]);
    dailyViews.push({ day: DAYS[s.getDay()], date: s.toLocaleDateString("he-IL", { day: "numeric", month: "numeric" }), views: dv, leads: dl });
  }

  return NextResponse.json({
    totalViews, leadCount, conversionRate, byDay, bySource,
    leadsBySource: leadsBySource.map((r) => ({ source: r.utmSource ?? "direct", count: r._count._all })),
    overview: { totalViews, viewsThisMonth: totalViews, viewsThisWeek: viewsWeek, viewsToday, totalLeads: totalLeadsAll, leadsThisMonth: leadCount, conversionRate, monthConversionRate: conversionRate },
    dailyViews,
  });
}
