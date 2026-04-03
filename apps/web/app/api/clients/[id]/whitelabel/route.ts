import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSession, isSuperAdmin } from "@/lib/auth";

const whitelabelSchema = z.object({
  brandName:           z.string().nullable().optional(),
  brandLogo:           z.string().nullable().optional(),
  brandPrimaryColor:   z.string().nullable().optional(),
  brandSecondaryColor: z.string().nullable().optional(),
  customDomain:        z.string().nullable().optional(),
  whitelabelEnabled:   z.boolean().optional(),
  portalTitle:         z.string().nullable().optional(),
  portalWelcome:       z.string().nullable().optional(),
  portalFooter:        z.string().nullable().optional(),
});

// GET /api/clients/:id/whitelabel
export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const client = await prisma.client.findUnique({
    where: { id: params.id },
    select: {
      id: true,
      ownerId: true,
      brandName: true,
      brandLogo: true,
      brandPrimaryColor: true,
      brandSecondaryColor: true,
      customDomain: true,
      whitelabelEnabled: true,
      portalTitle: true,
      portalWelcome: true,
      portalFooter: true,
    },
  });

  if (!client) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (!isSuperAdmin(session) && client.ownerId !== session.userId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { ownerId: _ownerId, id: _id, ...whitelabel } = client;
  return NextResponse.json({ whitelabel });
}

// PUT /api/clients/:id/whitelabel
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const existing = await prisma.client.findUnique({
    where: { id: params.id },
    select: { ownerId: true },
  });

  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (!isSuperAdmin(session) && existing.ownerId !== session.userId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json().catch(() => null);
  const parsed = whitelabelSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const updated = await prisma.client.update({
    where: { id: params.id },
    data: parsed.data,
    select: {
      brandName: true,
      brandLogo: true,
      brandPrimaryColor: true,
      brandSecondaryColor: true,
      customDomain: true,
      whitelabelEnabled: true,
      portalTitle: true,
      portalWelcome: true,
      portalFooter: true,
    },
  });

  return NextResponse.json({ whitelabel: updated });
}
