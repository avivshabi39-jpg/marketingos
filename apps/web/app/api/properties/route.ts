import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSession, isSuperAdmin } from "@/lib/auth";
import { matchLeadToProperties } from "@/lib/propertyMatcher";
import { notifyPropertyAlertSubscribers } from "@/lib/propertyAlerts";
import { sanitizeText } from "@/lib/sanitize";

const propertyTypeEnum = z.enum([
  "APARTMENT",
  "HOUSE",
  "PENTHOUSE",
  "GARDEN_APARTMENT",
  "DUPLEX",
  "STUDIO",
  "COMMERCIAL",
  "LAND",
]);

const statusEnum = z.enum([
  "AVAILABLE",
  "UNDER_CONTRACT",
  "SOLD",
  "OFF_MARKET",
]);

const createSchema = z.object({
  title:        z.string().min(1),
  price:        z.number().positive(),
  city:         z.string().min(1),
  propertyType: propertyTypeEnum,
  clientId:     z.string().min(1),
  description:  z.string().optional(),
  rooms:        z.number().optional(),
  floor:        z.number().optional(),
  totalFloors:  z.number().optional(),
  area:         z.number().optional(),
  neighborhood: z.string().optional(),
  street:       z.string().optional(),
  status:       statusEnum.optional(),
  images:       z.array(z.string()).optional(),
  features:     z.array(z.string()).optional(),
  isExclusive:  z.boolean().optional(),
  isFeatured:   z.boolean().optional(),
});

function slugify(title: string): string {
  return (
    title
      .toLowerCase()
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9\u0590-\u05ff-]/g, "")
      .slice(0, 80) +
    `-${Date.now().toString(36)}`
  );
}

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const requestedClientId = searchParams.get("clientId") ?? undefined;

  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
  const perPage = 20;
  const skip = (page - 1) * perPage;

  const where: Record<string, unknown> = {};

  if (session.clientId) {
    // Scoped user (agent) — always filter to their assigned client
    where.clientId = session.clientId;
  } else if (isSuperAdmin(session)) {
    // Super-admin — can query any client or all
    if (requestedClientId) where.clientId = requestedClientId;
  } else {
    // Regular admin (agency owner) — restrict to clients they own
    if (requestedClientId) {
      // Verify the requested client is owned by this user
      const owned = await prisma.client.findFirst({
        where: { id: requestedClientId, ownerId: session.userId },
        select: { id: true },
      });
      if (!owned) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
      where.clientId = requestedClientId;
    } else {
      // No clientId filter — scope to all owned clients
      const ownedClients = await prisma.client.findMany({
        where: { ownerId: session.userId },
        select: { id: true },
      });
      where.clientId = { in: ownedClients.map((c) => c.id) };
    }
  }

  if (searchParams.get("status")) where.status = searchParams.get("status");
  if (searchParams.get("propertyType")) where.propertyType = searchParams.get("propertyType");

  const [properties, total] = await Promise.all([
    prisma.property.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take: perPage,
      include: {
        client: { select: { name: true, primaryColor: true } },
        _count: { select: { directLeads: true, propertyLeads: true } },
      },
    }),
    prisma.property.count({ where }),
  ]);

  return NextResponse.json({ properties, total, page, perPage });
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  if (session.clientId) {
    // Scoped user must use their own clientId
    if (session.clientId !== parsed.data.clientId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  } else if (!isSuperAdmin(session)) {
    // Non-super-admin must own the target client
    const owned = await prisma.client.findFirst({
      where: { id: parsed.data.clientId, ownerId: session.userId },
      select: { id: true },
    });
    if (!owned) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  }

  // Sanitize text inputs
  const sanitizedData = {
    ...parsed.data,
    title:       sanitizeText(parsed.data.title, 300),
    description: parsed.data.description ? sanitizeText(parsed.data.description, 3000) : undefined,
    city:        sanitizeText(parsed.data.city, 100),
  };

  const slug = slugify(sanitizedData.title);

  const property = await prisma.property.create({
    data: { ...sanitizedData, slug },
  });

  const existingLeads = await prisma.lead.findMany({
    where: {
      clientId: parsed.data.clientId,
      status: { in: ["NEW", "CONTACTED", "QUALIFIED"] },
    },
    select: { id: true },
    take: 50,
  });

  for (const lead of existingLeads) {
    matchLeadToProperties(lead.id).catch(() => {});
  }

  // Notify property alert subscribers via WhatsApp
  notifyPropertyAlertSubscribers(property).catch(() => {});

  return NextResponse.json({ property }, { status: 201 });
}
