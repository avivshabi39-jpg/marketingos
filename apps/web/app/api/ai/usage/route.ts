import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const now = new Date();
  const firstOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  const [totalThisMonth, todayCount, byType] = await Promise.all([
    prisma.aiUsage.count({
      where: { userId: session.userId, createdAt: { gte: firstOfMonth } },
    }),
    prisma.aiUsage.count({
      where: { userId: session.userId, createdAt: { gte: today } },
    }),
    prisma.aiUsage.groupBy({
      by: ["type"],
      where: { userId: session.userId, createdAt: { gte: firstOfMonth } },
      _count: { type: true },
      _sum: { tokens: true },
      orderBy: { _count: { type: "desc" } },
    }),
  ]);

  const tokensThisMonth = await prisma.aiUsage.aggregate({
    where: { userId: session.userId, createdAt: { gte: firstOfMonth } },
    _sum: { tokens: true },
  });

  return NextResponse.json({
    totalThisMonth,
    todayCount,
    tokensThisMonth: tokensThisMonth._sum.tokens ?? 0,
    byType: byType.map((b) => ({
      type: b.type,
      count: b._count.type,
      tokens: b._sum.tokens ?? 0,
    })),
  });
}
