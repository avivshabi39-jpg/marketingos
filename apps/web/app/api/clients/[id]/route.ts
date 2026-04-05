import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { getSession, isSuperAdmin } from "@/lib/auth";
import { audit, auditInfo } from "@/lib/audit";
import { encrypt, decrypt, maskSensitive } from "@/lib/encrypt";
import { cacheDelete } from "@/lib/cache";

const updateSchema = z.object({
  name:            z.string().min(1).optional(),
  email:           z.string().email().optional(),
  phone:           z.string().optional(),
  primaryColor:    z.string().optional(),
  isActive:        z.boolean().optional(),
  industry:        z.enum(["ROOFING","ALUMINUM","COSMETICS","CLEANING","REAL_ESTATE","AVIATION","TOURISM","FINANCE","LEGAL","MEDICAL","FOOD","FITNESS","EDUCATION","GENERAL","OTHER"]).nullable().optional(),
  plan:            z.enum(["BASIC","PRO","AGENCY"]).optional(),
  monthlyBudget:   z.number().nullable().optional(),
  reportEmail:     z.string().email().optional().or(z.literal("")),
  reportFrequency: z.enum(["WEEKLY","MONTHLY","BOTH"]).optional(),
  whatsappNumber:  z.string().optional(),
  n8nWebhookUrl:   z.string().url().optional().or(z.literal("")),
  facebookPixelId:      z.string().optional(),
  facebookPageId:       z.string().optional(),
  facebookAccessToken:  z.string().optional(),
  googleAdsId:          z.string().optional(),
  googleAnalyticsId:    z.string().optional(),
  googleBusinessUrl:    z.string().optional(),
  greenApiInstanceId:   z.string().optional(),
  greenApiToken:        z.string().optional(),
  // סיסמת פורטל — כאשר נשלחת, תוצפן ב-bcrypt
  portalPassword:  z.string().min(6).optional().or(z.literal("")),
  // Landing page fields
  landingPageTitle:    z.string().nullable().optional(),
  landingPageSubtitle: z.string().nullable().optional(),
  landingPageCta:      z.string().nullable().optional(),
  landingPageColor:    z.string().nullable().optional(),
  landingPageLogo:     z.string().nullable().optional(),
  landingPageActive:   z.boolean().optional(),
  // WhatsApp auto-reply
  whatsappTemplate:    z.string().nullable().optional(),
  autoReplyActive:     z.boolean().optional(),
});

// Masked value sentinels — do not re-encrypt these
const isMasked = (v: string) => v.startsWith("••••••••");

/** Decrypt sensitive fields for API responses, then mask for display */
function decryptClientForResponse(client: Record<string, unknown>) {
  const c = { ...client };
  if (c.facebookAccessToken) {
    const plain = decrypt(c.facebookAccessToken as string);
    c.facebookAccessToken = maskSensitive(plain);
  }
  if (c.n8nWebhookUrl) {
    c.n8nWebhookUrl = decrypt(c.n8nWebhookUrl as string);
  }
  if (c.greenApiToken) {
    const plain = decrypt(c.greenApiToken as string);
    c.greenApiToken = maskSensitive(plain);
  }
  return c;
}

// GET /api/clients/:id
export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (session.clientId && session.clientId !== params.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const client = await prisma.client.findUnique({
    where: { id: params.id },
    include: { _count: { select: { leads: true, landingPages: true, reports: true } } },
  });

  if (!client) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (!session.clientId && !isSuperAdmin(session)) {
    if (client.ownerId !== session.userId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  }

  return NextResponse.json({ client: decryptClientForResponse(client as unknown as Record<string, unknown>) });
}

// PATCH /api/clients/:id — partial update
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!isSuperAdmin(session)) {
    const client = await prisma.client.findUnique({ where: { id: params.id }, select: { ownerId: true } });
    if (!client || client.ownerId !== session.userId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  }

  const body = await req.json().catch(() => null);
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { portalPassword, facebookAccessToken, n8nWebhookUrl, greenApiToken, ...rest } = parsed.data;
  const data: Record<string, unknown> = { ...rest };

  if (data.reportEmail === "") data.reportEmail = null;

  // Encrypt sensitive string fields
  const existing = await prisma.client.findUnique({
    where: { id: params.id },
    select: { facebookAccessToken: true, n8nWebhookUrl: true, greenApiToken: true },
  });

  if (facebookAccessToken !== undefined) {
    if (!facebookAccessToken) {
      data.facebookAccessToken = null;
    } else if (!isMasked(facebookAccessToken)) {
      data.facebookAccessToken = encrypt(facebookAccessToken);
    } else {
      data.facebookAccessToken = existing?.facebookAccessToken ?? null;
    }
  }

  if (n8nWebhookUrl !== undefined) {
    if (!n8nWebhookUrl) {
      data.n8nWebhookUrl = null;
    } else {
      data.n8nWebhookUrl = encrypt(n8nWebhookUrl);
    }
  }

  if (greenApiToken !== undefined) {
    if (!greenApiToken) {
      data.greenApiToken = null;
    } else if (!isMasked(greenApiToken)) {
      data.greenApiToken = encrypt(greenApiToken);
    } else {
      data.greenApiToken = existing?.greenApiToken ?? null;
    }
  }

  // הצפן סיסמת פורטל אם סופקה
  if (portalPassword && portalPassword.length >= 6) {
    data.portalPassword = await bcrypt.hash(portalPassword, 12);
  } else if (portalPassword === "") {
    data.portalPassword = null;
  }

  const client = await prisma.client.update({ where: { id: params.id }, data });
  cacheDelete(`clients:`); // invalidate list caches
  audit("client.update", { userId: session.userId, entityId: params.id, ...auditInfo(req) });
  return NextResponse.json({ client: decryptClientForResponse(client as unknown as Record<string, unknown>) });
}

// PUT /api/clients/:id — full update (same logic, accepts all fields)
export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  return PATCH(req, { params });
}

// DELETE /api/clients/:id
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!isSuperAdmin(session)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  await prisma.client.delete({ where: { id: params.id } });
  cacheDelete(`clients:`);
  audit("client.delete", { userId: session.userId, entityId: params.id, ...auditInfo(req) });
  return new NextResponse(null, { status: 204 });
}
