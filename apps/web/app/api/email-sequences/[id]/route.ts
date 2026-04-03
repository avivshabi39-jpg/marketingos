import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

async function canAccess(session: Awaited<ReturnType<typeof getSession>>, sequenceId: string) {
  if (!session) return null;
  const sequence = await prisma.emailSequence.findUnique({
    where: { id: sequenceId },
    include: { client: { select: { ownerId: true } } },
  });
  if (!sequence) return null;
  if (session.role === "SUPER_ADMIN") return sequence;
  const allowed =
    sequence.client.ownerId === session.userId ||
    session.clientId === sequence.clientId;
  if (!allowed) return null;
  return sequence;
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const sequence = await canAccess(session, id);
  if (!sequence) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json({ sequence });
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const existing = await canAccess(session, id);
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
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const existing = await canAccess(session, id);
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await prisma.emailSequence.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
