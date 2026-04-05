import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { getSession, isSuperAdmin } from "@/lib/auth";
import { slugify } from "@/lib/utils";
import { audit, auditInfo } from "@/lib/audit";
import { cacheGet, cacheSet, cacheDelete } from "@/lib/cache";
import { sanitizeText } from "@/lib/sanitize";
import { autoSetupNewClient } from "@/lib/clientAutoSetup";
import { sendWelcomeEmail } from "@/lib/email";

const PLAN_LIMITS: Record<string, number> = {
  BASIC: 40,
  PRO: 15,
  AGENCY: Infinity,
};

const createSchema = z.object({
  name:               z.string().min(1, "שם העסק הוא שדה חובה"),
  email:              z.string().email("כתובת אימייל לא תקינה").optional().or(z.literal("")),
  phone:              z.string().optional(),
  slug:               z.string().optional(),
  primaryColor:       z.string().optional(),
  industry:           z.enum(["ROOFING","ALUMINUM","COSMETICS","CLEANING","REAL_ESTATE","AVIATION","TOURISM","FINANCE","LEGAL","MEDICAL","FOOD","FITNESS","EDUCATION","GENERAL","OTHER"]).optional(),
  plan:               z.enum(["BASIC","PRO","AGENCY"]).optional(),
  monthlyBudget:      z.number().optional(),
  reportEmail:        z.string().email().optional().or(z.literal("")),
  reportFrequency:    z.enum(["WEEKLY","MONTHLY","BOTH"]).optional(),
  whatsappNumber:     z.string().optional(),
  n8nWebhookUrl:      z.string().url().optional().or(z.literal("")),
  facebookPixelId:    z.string().optional(),
  googleAdsId:        z.string().optional(),
  portalPassword:     z.string().min(6).optional(),
  // Landing page fields
  landingPageTitle:    z.string().optional(),
  landingPageSubtitle: z.string().optional(),
  landingPageCta:      z.string().optional(),
  landingPageColor:    z.string().optional(),
});

// GET /api/clients
export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const page    = Number(searchParams.get("page") ?? "1");
  const perPage = 20;

  // SUPER_ADMIN sees all; regular admins see only clients they own
  const where = isSuperAdmin(session)
    ? {}
    : { ownerId: session.userId };

  const cacheKey = `clients:${session.userId}:p${page}`;
  const cached = await cacheGet<{ clients: unknown[]; total: number; page: number; perPage: number }>(cacheKey);
  if (cached) return NextResponse.json(cached);

  const [clients, total] = await Promise.all([
    prisma.client.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * perPage,
      take: perPage,
      include: { _count: { select: { leads: true } } },
    }),
    prisma.client.count({ where }),
  ]);

  const payload = { clients, total, page, perPage };
  cacheSet(cacheKey, payload, 30); // 30s TTL
  return NextResponse.json(payload);
}

// POST /api/clients
export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  // בדיקת מגבלת תכנית — SUPER_ADMIN פטור
  if (!isSuperAdmin(session)) {
    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      select: { agencyPlan: true },
    });
    const plan  = user?.agencyPlan ?? "BASIC";
    const limit = PLAN_LIMITS[plan] ?? 40;
    const count = await prisma.client.count({ where: { ownerId: session.userId } });
    if (count >= limit) {
      const planNames: Record<string, string> = { BASIC: "Basic", PRO: "Pro", AGENCY: "Agency" };
      return NextResponse.json(
        { error: `הגעת למגבלת ${limit} לקוחות בתוכנית ${planNames[plan]}. שדרג ל-Pro להוסיף יותר לקוחות.` },
        { status: 403 }
      );
    }
  }

  const { name: rawName, email, phone, primaryColor, slug, industry, plan, monthlyBudget,
          reportEmail, reportFrequency, whatsappNumber, n8nWebhookUrl,
          facebookPixelId, googleAdsId, portalPassword,
          landingPageTitle, landingPageSubtitle, landingPageCta, landingPageColor } = parsed.data;

  const name = sanitizeText(rawName, 200);
  const finalSlug = slug ? sanitizeText(slug, 60).trim() : slugify(name);

  const existing = await prisma.client.findUnique({ where: { slug: finalSlug } });
  if (existing) {
    return NextResponse.json({ error: "Slug כבר קיים — בחר שם אחר" }, { status: 409 });
  }

  // Use provided password or generate a default one
  const rawPortalPassword = portalPassword || "portal123";
  const hashedPortalPassword = await bcrypt.hash(rawPortalPassword, 12);

  const client = await prisma.client.create({
    data: {
      name,
      email:           email || `${finalSlug}@placeholder.local`,
      phone:           phone || null,
      primaryColor:    primaryColor || "#6366f1",
      slug:            finalSlug,
      subdomain:       finalSlug,
      industry:        industry || null,
      plan:            plan || "BASIC",
      monthlyBudget:   monthlyBudget || null,
      reportEmail:     reportEmail || null,
      reportFrequency: reportFrequency || "WEEKLY",
      whatsappNumber:  whatsappNumber || null,
      n8nWebhookUrl:   n8nWebhookUrl || null,
      facebookPixelId: facebookPixelId || null,
      googleAdsId:     googleAdsId || null,
      portalPassword:  hashedPortalPassword,
      landingPageTitle:    landingPageTitle || null,
      landingPageSubtitle: landingPageSubtitle || null,
      landingPageCta:      landingPageCta || null,
      landingPageColor:    landingPageColor || null,
      ownerId:         isSuperAdmin(session) ? null : session.userId,
    },
  });

  audit("client.create", { userId: session.userId, entityId: client.id, meta: { name, slug: finalSlug }, ...auditInfo(req) });
  cacheDelete(`clients:${session.userId}`); // invalidate list cache

  // Auto-setup: apply industry snapshot, WhatsApp template, inbox notification
  const setupActions = await autoSetupNewClient({
    id: client.id,
    name: client.name,
    industry: client.industry,
    ownerId: session.userId,
  });

  // Send welcome email to client
  if (client.email && !client.email.endsWith("@placeholder.local")) {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "";
    sendWelcomeEmail(client.email, {
      clientName: client.name,
      portalUrl: `${appUrl}/client/${client.slug}`,
      portalPassword: rawPortalPassword,
    }).catch(() => {});
  }

  return NextResponse.json({ client, setupActions }, { status: 201 });
}
