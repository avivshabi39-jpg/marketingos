import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getClientSession } from "@/lib/clientAuth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await getSession();
  const clientSession = !session ? await getClientSession() : null;
  if (!session && !clientSession) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const clientId = searchParams.get("clientId");

  const where: Record<string, unknown> = {};

  if (clientSession) {
    where.clientId = clientSession.clientId;
  } else if (session && session.role !== "SUPER_ADMIN") {
    if (session.clientId) {
      where.clientId = session.clientId;
    } else {
      const clients = await prisma.client.findMany({
        where: { ownerId: session.userId },
        select: { id: true },
      });
      where.clientId = { in: clients.map((c) => c.id) };
    }
  }

  if (clientId) {
    where.clientId = clientId;
  }

  const sequences = await prisma.emailSequence.findMany({
    where,
    include: { client: { select: { name: true, primaryColor: true } } },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return NextResponse.json({ sequences });
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  const clientSession = !session ? await getClientSession() : null;
  if (!session && !clientSession) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Invalid body" }, { status: 400 });

  const { clientId, name, trigger, steps } = body as {
    clientId?: string;
    name?: string;
    trigger?: string;
    steps?: unknown[];
  };

  if (!clientId || !name || !trigger) {
    return NextResponse.json({ error: "clientId, name and trigger are required" }, { status: 400 });
  }

  const validTriggers = ["new_lead", "won_lead", "no_reply_3days"];
  if (!validTriggers.includes(trigger)) {
    return NextResponse.json({ error: "Invalid trigger" }, { status: 400 });
  }

  const client = await prisma.client.findUnique({ where: { id: clientId } });
  if (!client) return NextResponse.json({ error: "Client not found" }, { status: 404 });

  if (clientSession) {
    if (clientSession.clientId !== clientId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  } else if (session && session.role !== "SUPER_ADMIN") {
    const allowed =
      client.ownerId === session.userId ||
      session.clientId === clientId;
    if (!allowed) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const sequence = await prisma.emailSequence.create({
    data: {
      clientId,
      name,
      trigger,
      steps: (steps ?? []) as object[],
      isActive: false,
    },
  });

  return NextResponse.json({ sequence }, { status: 201 });
}
