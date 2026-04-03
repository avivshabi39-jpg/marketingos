import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

// GET /api/offices/:id — office + agents + stats
export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const office = await prisma.office.findUnique({
    where: { id: params.id },
    include: {
      agents: {
        select: {
          id: true, name: true, slug: true, agentPhoto: true,
          agentCity: true, agentPhone: true, updatedAt: true,
          _count: { select: { leads: true, properties: true } },
        },
      },
    },
  });

  if (!office) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (office.ownerId !== session.userId) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const agentIds = office.agents.map((a) => a.id);

  // Two bulk groupBy queries instead of 2N individual COUNT queries
  const [monthlyGroups, wonGroups] = agentIds.length
    ? await Promise.all([
        prisma.lead.groupBy({
          by: ["clientId"],
          where: { clientId: { in: agentIds }, createdAt: { gte: startOfMonth } },
          _count: { id: true },
        }),
        prisma.lead.groupBy({
          by: ["clientId"],
          where: { clientId: { in: agentIds }, status: "WON" },
          _count: { id: true },
        }),
      ])
    : [[], []];

  const monthlyByAgent: Record<string, number> = {};
  for (const r of monthlyGroups) monthlyByAgent[r.clientId] = r._count.id;
  const wonByAgent: Record<string, number> = {};
  for (const r of wonGroups) wonByAgent[r.clientId] = r._count.id;

  const agentStats = office.agents.map((agent) => {
    const monthlyLeads = monthlyByAgent[agent.id] ?? 0;
    const wonLeads = wonByAgent[agent.id] ?? 0;
    const totalLeads = agent._count.leads;
    const conversionRate = totalLeads > 0 ? Math.round((wonLeads / totalLeads) * 100) : 0;
    const lastActiveDays = Math.floor((now.getTime() - new Date(agent.updatedAt).getTime()) / 86400000);
    return { ...agent, monthlyLeads, wonLeads, conversionRate, lastActiveDays };
  });

  return NextResponse.json({ office: { ...office, agents: agentStats } });
}

// DELETE /api/offices/:id
export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const office = await prisma.office.findUnique({ where: { id: params.id }, select: { ownerId: true } });
  if (!office || office.ownerId !== session.userId) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  await prisma.office.delete({ where: { id: params.id } });
  return new NextResponse(null, { status: 204 });
}
