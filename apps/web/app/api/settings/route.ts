import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { encrypt, decrypt, maskSensitive } from "@/lib/encrypt";

const settingsSchema = z.object({
  resendKey:     z.string().optional(),
  twilioSid:     z.string().optional(),
  twilioToken:   z.string().optional(),
  twilioFrom:    z.string().optional(),
  n8nDefaultUrl: z.string().url().optional().or(z.literal("")),
});

const templateSchema = z.object({
  type:    z.string().min(1),
  content: z.string().min(1),
  subject: z.string().optional(),
});

// Sentinel prefix used in masked values — never encrypt these
const MASKED_PREFIX = ["sk_...", "****"];
const isMasked = (v: string) => MASKED_PREFIX.some((p) => v.startsWith(p));

// GET /api/settings
export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const [settings, templates] = await Promise.all([
    prisma.systemSettings.findUnique({ where: { userId: session.userId } }),
    prisma.messageTemplate.findMany({ where: { userId: session.userId } }),
  ]);

  // Decrypt then mask for display
  const maskedSettings = settings ? {
    ...settings,
    resendKey:   settings.resendKey   ? maskSensitive(decrypt(settings.resendKey))   : null,
    twilioToken: settings.twilioToken ? maskSensitive(decrypt(settings.twilioToken)) : null,
  } : null;

  return NextResponse.json({ settings: maskedSettings, templates });
}

// PUT /api/settings — update system settings
export async function PUT(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const parsed = settingsSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const data = parsed.data;

  // אל תדרוס ערכים מוסתרים שלא שונו
  const existing = await prisma.systemSettings.findUnique({ where: { userId: session.userId } });

  const resolveSecret = (
    newVal: string | undefined,
    existingEncrypted: string | null | undefined
  ): string | null => {
    if (!newVal || isMasked(newVal)) return existingEncrypted ?? null;
    return encrypt(newVal);
  };

  const updateData = {
    n8nDefaultUrl: data.n8nDefaultUrl || null,
    resendKey:     resolveSecret(data.resendKey,   existing?.resendKey),
    twilioSid:     data.twilioSid || (existing?.twilioSid ?? null),
    twilioToken:   resolveSecret(data.twilioToken, existing?.twilioToken),
    twilioFrom:    data.twilioFrom || (existing?.twilioFrom ?? null),
  };

  const settings = await prisma.systemSettings.upsert({
    where:  { userId: session.userId },
    create: { userId: session.userId, ...updateData },
    update: updateData,
  });

  return NextResponse.json({ settings });
}

// POST /api/settings/templates — save message template
export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const parsed = templateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const template = await prisma.messageTemplate.upsert({
    where:  { userId_type: { userId: session.userId, type: parsed.data.type } },
    create: { userId: session.userId, ...parsed.data },
    update: parsed.data,
  });

  return NextResponse.json({ template });
}
