import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getClientSession } from "@/lib/clientAuth";
import { prisma } from "@/lib/prisma";

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getSession();
  const clientSession = !session ? await getClientSession() : null;
  if (!session && !clientSession) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (clientSession && clientSession.clientId !== params.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const client = await prisma.client.findUnique({
    where: { id: params.id },
    select: {
      dripEnabled: true,
      dripDay1Message: true,
      dripDay1Delay: true,
      dripDay3Message: true,
      dripDay3Delay: true,
    },
  });

  if (!client) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({ drip: client });
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getSession();
  const clientSession = !session ? await getClientSession() : null;
  if (!session && !clientSession) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (clientSession && clientSession.clientId !== params.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json().catch(() => null);
  if (!body) {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const allowedFields = [
    "dripEnabled",
    "dripDay1Message",
    "dripDay1Delay",
    "dripDay3Message",
    "dripDay3Delay",
  ] as const;

  const data: Record<string, unknown> = {};
  for (const field of allowedFields) {
    if (body[field] !== undefined) data[field] = body[field];
  }

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: "No valid fields" }, { status: 400 });
  }

  await prisma.client.update({
    where: { id: params.id },
    data,
  });

  return NextResponse.json({ ok: true });
}
