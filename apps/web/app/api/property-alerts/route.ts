import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getSession, isSuperAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const createSchema = z.object({
  clientId: z.string().min(1),
  name:     z.string().min(1).max(100),
  phone:    z.string().min(1).max(30),
  budget:   z.number().positive().optional(),
  rooms:    z.number().positive().optional(),
  city:     z.string().max(100).optional(),
});

async function assertClientOwner(session: { userId: string }, clientId: string) {
  if (isSuperAdmin(session as Parameters<typeof isSuperAdmin>[0])) return true;
  const c = await prisma.client.findUnique({ where: { id: clientId }, select: { ownerId: true } });
  return c?.ownerId === session.userId;
}

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const clientId = searchParams.get("clientId");
  if (!clientId) return NextResponse.json({ error: "clientId required" }, { status: 400 });

  if (!(await assertClientOwner(session, clientId))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const alerts = await prisma.propertyAlert.findMany({
    where: { clientId, isActive: true },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json({ alerts });
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  if (!(await assertClientOwner(session, parsed.data.clientId))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const alert = await prisma.propertyAlert.create({ data: parsed.data });
  return NextResponse.json({ alert }, { status: 201 });
}
