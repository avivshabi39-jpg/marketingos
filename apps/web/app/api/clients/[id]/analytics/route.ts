import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession, isSuperAdmin } from "@/lib/auth";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Ownership check
  if (!isSuperAdmin(session)) {
    const client = await prisma.client.findUnique({ where: { id: params.id }, select: { ownerId: true } });
    if (!client || client.ownerId !== session.userId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
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

  return NextResponse.json({
    totalViews,
    leadCount,
    conversionRate,
    byDay,
    bySource,
    leadsBySource: leadsBySource.map((r) => ({ source: r.utmSource ?? "direct", count: r._count._all })),
  });
}
