import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

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

const updateSchema = z.object({
  title:        z.string().min(1).optional(),
  price:        z.number().positive().optional(),
  city:         z.string().min(1).optional(),
  propertyType: propertyTypeEnum.optional(),
  clientId:     z.string().min(1).optional(),
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
  isExclusive:   z.boolean().optional(),
  isFeatured:    z.boolean().optional(),
  published:     z.boolean().optional(),
  privateNotes:  z.string().optional(),
});

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  const property = await prisma.property.findUnique({
    where: { id },
    include: {
      client: {
        select: {
          id: true,
          name: true,
          slug: true,
          primaryColor: true,
          whatsappNumber: true,
          phone: true,
          agentPhone: true,
          agentBio: true,
          agentPhoto: true,
          agentCity: true,
          agentExperience: true,
        },
      },
      _count: { select: { directLeads: true, propertyLeads: true } },
    },
  });

  if (!property) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (session.clientId && session.clientId !== property.clientId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  return NextResponse.json({ property });
}

async function handleUpdate(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  const existing = await prisma.property.findUnique({
    where: { id },
    select: { clientId: true },
  });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (session.clientId && session.clientId !== existing.clientId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json().catch(() => null);
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const data: Record<string, unknown> = { ...parsed.data };

  if (parsed.data.status === "SOLD") {
    data.soldAt = new Date();
  }

  const property = await prisma.property.update({ where: { id }, data });
  return NextResponse.json({ property });
}

export async function PUT(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  return handleUpdate(req, context);
}

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  return handleUpdate(req, context);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  const existing = await prisma.property.findUnique({
    where: { id },
    select: { clientId: true },
  });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (session.clientId && session.clientId !== existing.clientId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await prisma.property.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
