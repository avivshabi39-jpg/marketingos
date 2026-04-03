import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSession, isSuperAdmin } from "@/lib/auth";
import { getClientSession } from "@/lib/clientAuth";

const createSchema = z.object({
  clientId:    z.string().min(1),
  leadId:      z.string().optional(),
  propertyId:  z.string().optional(),
  name:        z.string().min(1).max(200),
  phone:       z.string().max(30).optional(),
  email:       z.string().email().optional().or(z.literal("")),
  notes:       z.string().max(2000).optional(),
  scheduledAt: z.string().datetime(),
});

// GET /api/appointments
export async function GET(req: NextRequest) {
  const clientPortal = await getClientSession();
  const session      = clientPortal ? null : await getSession();
  if (!session && !clientPortal) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const requestedClientId = searchParams.get("clientId") ?? undefined;

  let clientIdFilter: string | { in: string[] } | undefined;

  if (clientPortal) {
    clientIdFilter = clientPortal.clientId;
  } else if (session!.clientId) {
    clientIdFilter = session!.clientId;
  } else if (isSuperAdmin(session!)) {
    clientIdFilter = requestedClientId;
  } else {
    if (requestedClientId) {
      const owned = await prisma.client.findFirst({
        where: { id: requestedClientId, ownerId: session!.userId },
        select: { id: true },
      });
      if (!owned) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      clientIdFilter = requestedClientId;
    } else {
      const ownedClients = await prisma.client.findMany({
        where: { ownerId: session!.userId },
        select: { id: true },
      });
      clientIdFilter = { in: ownedClients.map((c) => c.id) };
    }
  }

  const where = clientIdFilter ? { clientId: clientIdFilter } : {};

  const appointments = await prisma.appointment.findMany({
    where,
    orderBy: { scheduledAt: "asc" },
    include: {
      client:   { select: { name: true, slug: true } },
      lead:     { select: { firstName: true, lastName: true } },
      property: { select: { title: true, slug: true } },
    },
  });

  return NextResponse.json({ appointments });
}

// POST /api/appointments
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const clientPortal = await getClientSession();
  const session      = clientPortal ? null : await getSession();
  if (!session && !clientPortal) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { clientId, scheduledAt, ...rest } = parsed.data;

  const appointment = await prisma.appointment.create({
    data: {
      clientId,
      scheduledAt: new Date(scheduledAt),
      ...rest,
    },
  });

  return NextResponse.json({ appointment }, { status: 201 });
}
