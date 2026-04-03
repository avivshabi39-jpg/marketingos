import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { notifyPropertyAlertSubscribers } from "@/lib/propertyAlerts";

const schema = z.object({
  clientId: z.string().min(1),
  propertyId: z.string().min(1),
});

// POST /api/property-alerts/broadcast — manually trigger alert for a property to all matching subscribers
export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const { clientId, propertyId } = parsed.data;

  // Ownership check
  const client = await prisma.client.findFirst({
    where: { id: clientId, ownerId: session.userId },
    select: { id: true },
  });
  if (!client) return NextResponse.json({ error: "לקוח לא נמצא" }, { status: 404 });

  const property = await prisma.property.findFirst({
    where: { id: propertyId, clientId },
    select: { id: true, title: true, price: true, rooms: true, city: true, slug: true, clientId: true },
  });
  if (!property) return NextResponse.json({ error: "נכס לא נמצא" }, { status: 404 });

  // Count matching subscribers before sending (for response)
  const matchingCount = await prisma.propertyAlert.count({
    where: {
      clientId,
      isActive: true,
      ...(property.city ? { OR: [{ city: null }, { city: property.city }] } : {}),
      ...(property.rooms != null ? {
        OR: [{ rooms: null }, { rooms: { lte: property.rooms + 0.5, gte: property.rooms - 0.5 } }],
      } : {}),
      ...(property.price ? {
        OR: [{ budget: null }, { budget: { gte: property.price / 1.2 } }],
      } : {}),
    },
  });

  // Trigger notifications asynchronously
  notifyPropertyAlertSubscribers({
    id: property.id,
    clientId: property.clientId,
    title: property.title,
    price: property.price,
    rooms: property.rooms,
    city: property.city ?? "",
    slug: property.slug,
  }).catch(() => {});

  return NextResponse.json({ ok: true, sent: matchingCount });
}
