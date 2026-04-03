import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

const createSchema = z.object({
  name: z.string().min(1).max(100),
});

// GET /api/offices
export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const offices = await prisma.office.findMany({
    where: { ownerId: session.userId },
    include: {
      agents: {
        select: {
          id: true,
          name: true,
          isActive: true,
          _count: { select: { leads: true, properties: true } },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  // Enrich each office with monthly lead count — single groupBy query (no N+1)
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const allAgentIds = offices.flatMap((o) => o.agents.map((a) => a.id));

  const monthlyGroups = allAgentIds.length
    ? await prisma.lead.groupBy({
        by: ["clientId"],
        where: { clientId: { in: allAgentIds }, createdAt: { gte: startOfMonth } },
        _count: { id: true },
      })
    : [];

  const countByAgent: Record<string, number> = {};
  for (const r of monthlyGroups) countByAgent[r.clientId] = r._count.id;

  const enriched = offices.map((o) => ({
    ...o,
    monthlyLeads: o.agents.reduce((sum, a) => sum + (countByAgent[a.id] ?? 0), 0),
  }));

  return NextResponse.json({ offices: enriched });
}

// POST /api/offices
export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const office = await prisma.office.create({
    data: { name: parsed.data.name, ownerId: session.userId },
  });

  return NextResponse.json({ office }, { status: 201 });
}
