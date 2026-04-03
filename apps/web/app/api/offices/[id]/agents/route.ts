import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

const addSchema = z.object({ agentId: z.string().min(1) });

// POST /api/offices/:id/agents — add agent to office
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const office = await prisma.office.findUnique({ where: { id: params.id }, select: { ownerId: true } });
  if (!office || office.ownerId !== session.userId) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json().catch(() => null);
  const parsed = addSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  // Verify the agent client belongs to this user
  const client = await prisma.client.findFirst({
    where: { id: parsed.data.agentId, ownerId: session.userId },
    select: { id: true },
  });
  if (!client) return NextResponse.json({ error: "לקוח לא נמצא" }, { status: 404 });

  await prisma.client.update({
    where: { id: parsed.data.agentId },
    data: { officeId: params.id },
  });

  return NextResponse.json({ ok: true });
}
