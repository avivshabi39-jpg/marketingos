import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getClientSession } from "@/lib/clientAuth";
import { getSession, isSuperAdmin } from "@/lib/auth";

export async function GET(
  _req: NextRequest,
  { params }: { params: { slug: string } }
) {
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
  if (clientPortal && clientPortal.clientId !== client.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const now = new Date();
  const firstOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const [pipelineAgg, wonAgg, leadsNew, leadsOpen, leadsWon] = await Promise.all([
    prisma.lead.aggregate({
      where: { clientId: client.id, status: { notIn: ["WON", "LOST"] } },
      _sum: { value: true },
      _count: { id: true },
    }),
    prisma.lead.aggregate({
      where: { clientId: client.id, status: "WON", createdAt: { gte: firstOfMonth } },
      _sum: { value: true },
    }),
    prisma.lead.count({ where: { clientId: client.id, status: "NEW" } }),
    prisma.lead.count({ where: { clientId: client.id, status: { notIn: ["WON", "LOST"] } } }),
    prisma.lead.count({ where: { clientId: client.id, status: "WON" } }),
  ]);

  return NextResponse.json({
    total: pipelineAgg._sum.value ?? 0,
    won: wonAgg._sum.value ?? 0,
    leadsCount: {
      new: leadsNew,
      open: leadsOpen,
      won: leadsWon,
    },
  });
}
