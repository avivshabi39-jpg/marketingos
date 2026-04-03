import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

// GET /api/leads/stats — returns lead counts by status for the session user
export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const clientScope = session.clientId
    ? [session.clientId]
    : session.role === "SUPER_ADMIN"
    ? null
    : await prisma.client
        .findMany({ where: { ownerId: session.userId }, select: { id: true } })
        .then((cs) => cs.map((c) => c.id));

  const where = clientScope ? { clientId: { in: clientScope } } : {};

  const counts = await prisma.lead.groupBy({
    by: ["status"],
    where,
    _count: true,
  });

  const stats: Record<string, number> = {};
  for (const row of counts) {
    stats[row.status] = row._count;
  }

  return NextResponse.json({ stats });
}
