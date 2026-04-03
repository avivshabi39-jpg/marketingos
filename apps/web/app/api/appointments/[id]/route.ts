import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { getClientSession } from "@/lib/clientAuth";

const patchSchema = z.object({
  status:      z.enum(["PENDING", "CONFIRMED", "DONE", "CANCELLED"]).optional(),
  notes:       z.string().max(2000).optional(),
  scheduledAt: z.string().datetime().optional(),
});

// PATCH /api/appointments/[id]
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const clientPortal = await getClientSession();
  const session      = clientPortal ? null : await getSession();
  if (!session && !clientPortal) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const appt = await prisma.appointment.findUnique({
    where: { id: params.id },
    select: { clientId: true, client: { select: { ownerId: true } } },
  });
  if (!appt) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Ownership check
  if (session && appt.client.ownerId !== session.userId && session.role !== "SUPER_ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  if (clientPortal && appt.clientId !== clientPortal.clientId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { scheduledAt, ...rest } = parsed.data;
  const updated = await prisma.appointment.update({
    where: { id: params.id },
    data: {
      ...rest,
      ...(scheduledAt ? { scheduledAt: new Date(scheduledAt) } : {}),
    },
  });

  return NextResponse.json({ appointment: updated });
}

// DELETE /api/appointments/[id]
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const clientPortal = await getClientSession();
  const session      = clientPortal ? null : await getSession();
  if (!session && !clientPortal) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const apptDel = await prisma.appointment.findUnique({
    where: { id: params.id },
    select: { clientId: true, client: { select: { ownerId: true } } },
  });
  if (!apptDel) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (session && apptDel.client.ownerId !== session.userId && session.role !== "SUPER_ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  if (clientPortal && apptDel.clientId !== clientPortal.clientId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await prisma.appointment.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
