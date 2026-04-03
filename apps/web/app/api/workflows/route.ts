import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

const createSchema = z.object({
  name:        z.string().min(1),
  type:        z.enum(["EMAIL", "SMS", "WEBHOOK", "NOTIFICATION", "OTHER"]),
  status:      z.enum(["DRAFT", "ACTIVE", "PAUSED", "ERROR"]).default("DRAFT"),
  trigger:     z.string().optional(),
  destination: z.string().optional(),
  webhookUrl:  z.string().url().optional(),
  notes:       z.string().optional(),
  clientId:    z.string().min(1),
});

// GET /api/workflows?clientId=xxx
export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const requestedClientId = session.clientId ?? searchParams.get("clientId") ?? undefined;

  const where: Record<string, unknown> = {};

  if (session.clientId) {
    where.clientId = session.clientId;
  } else if (session.role === "SUPER_ADMIN") {
    if (requestedClientId) where.clientId = requestedClientId;
  } else {
    // Regular admin — restrict to owned clients
    if (requestedClientId) {
      const owned = await prisma.client.findFirst({
        where: { id: requestedClientId, ownerId: session.userId },
        select: { id: true },
      });
      if (!owned) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      where.clientId = requestedClientId;
    } else {
      const ownedClients = await prisma.client.findMany({
        where: { ownerId: session.userId },
        select: { id: true },
      });
      where.clientId = { in: ownedClients.map((c: { id: string }) => c.id) };
    }
  }

  const workflows = await prisma.workflow.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: { client: { select: { name: true } } },
  });

  return NextResponse.json({ workflows });
}

// POST /api/workflows
export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  // Scoped users can only create workflows for their own client
  if (session.clientId && session.clientId !== parsed.data.clientId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const workflow = await prisma.workflow.create({ data: parsed.data });
  return NextResponse.json({ workflow }, { status: 201 });
}
