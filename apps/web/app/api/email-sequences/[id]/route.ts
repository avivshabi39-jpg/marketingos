import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getClientSession } from "@/lib/clientAuth";
import { prisma } from "@/lib/prisma";

async function canAccess(sequenceId: string) {
  const session = await getSession();
  const clientSession = !session ? await getClientSession() : null;
  if (!session && !clientSession) return null;

  const sequence = await prisma.emailSequence.findUnique({
    where: { id: sequenceId },
    include: { client: { select: { ownerId: true } } },
  });
  if (!sequence) return null;

  if (clientSession) {
    return clientSession.clientId === sequence.clientId ? sequence : null;
  }

  if (session!.role === "SUPER_ADMIN") return sequence;
  const allowed =
    sequence.client.ownerId === session!.userId ||
    session!.clientId === sequence.clientId;
  return allowed ? sequence : null;
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const sequence = await canAccess(id);
  if (!sequence) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json({ sequence });
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const existing = await canAccess(id);
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Invalid body" }, { status: 400 });

  const { name, isActive, steps } = body as {
    name?: string;
    isActive?: boolean;
    steps?: unknown[];
  };

  const sequence = await prisma.emailSequence.update({
    where: { id },
    data: {
      ...(name !== undefined && { name }),
      ...(isActive !== undefined && { isActive }),
      ...(steps !== undefined && { steps: steps as object[] }),
    },
  });

  return NextResponse.json({ sequence });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const existing = await canAccess(id);
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await prisma.emailSequence.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
