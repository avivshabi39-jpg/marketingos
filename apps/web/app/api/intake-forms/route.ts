import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSession, isSuperAdmin } from "@/lib/auth";
import { slugify } from "@/lib/utils";

const createSchema = z.object({
  name:           z.string().min(1, "שם הטופס הוא שדה חובה"),
  clientId:       z.string().min(1, "לקוח הוא שדה חובה"),
  formType:       z.enum(["CLIENT_ONBOARDING", "LANDING_PAGE"]).default("LANDING_PAGE"),
  thankYouMessage: z.string().optional(),
  redirectUrl:    z.string().url().optional().or(z.literal("")),
  slug:           z.string().optional(),
});

// GET /api/intake-forms
export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const clientId = searchParams.get("clientId") ?? undefined;

  // סינון לפי בעלות
  const ownerFilter = isSuperAdmin(session)
    ? {}
    : { client: { ownerId: session.userId } };

  const forms = await prisma.leadForm.findMany({
    where: {
      ...(clientId ? { clientId } : {}),
      ...ownerFilter,
      isActive: true,
    },
    orderBy: { createdAt: "desc" },
    take: 100,
    include: {
      client: { select: { id: true, name: true, slug: true, primaryColor: true } },
    },
  });

  return NextResponse.json({ forms });
}

// POST /api/intake-forms
export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { name, clientId, formType, thankYouMessage, redirectUrl, slug } = parsed.data;

  // בדוק שהלקוח שייך לאדמין
  const client = await prisma.client.findUnique({
    where: { id: clientId },
    select: { id: true, slug: true, ownerId: true },
  });
  if (!client) return NextResponse.json({ error: "לקוח לא נמצא" }, { status: 404 });
  if (!isSuperAdmin(session) && client.ownerId !== session.userId) {
    return NextResponse.json({ error: "אין הרשאה" }, { status: 403 });
  }

  const formSlug = slug?.trim() || slugify(name);

  // בדיקת ייחודיות slug בתוך הלקוח
  const existing = await prisma.leadForm.findUnique({
    where: { clientId_slug: { clientId, slug: formSlug } },
  });
  if (existing) {
    return NextResponse.json({ error: "כתובת הטופס כבר קיימת — בחר שם אחר" }, { status: 409 });
  }

  const form = await prisma.leadForm.create({
    data: {
      name,
      slug:            formSlug,
      formType,
      thankYouMessage: thankYouMessage || "תודה! ניצור איתך קשר בהקדם.",
      redirectUrl:     redirectUrl || null,
      clientId,
    },
    include: { client: { select: { name: true, slug: true } } },
  });

  return NextResponse.json({ form }, { status: 201 });
}
