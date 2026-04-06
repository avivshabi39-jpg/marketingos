import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getClientSession } from "@/lib/clientAuth";
import { getSession } from "@/lib/auth";
import { sanitizeText } from "@/lib/sanitize";
import { cacheDelete, CacheKeys } from "@/lib/cache";

const schema = z.object({
  name:               z.string().min(1).max(200).optional(),
  phone:              z.string().max(20).optional(),
  email:              z.string().email().optional(),
  primaryColor:       z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
  landingPageTitle:   z.string().max(200).optional(),
  landingPageCta:     z.string().max(100).optional(),
  whatsappNumber:     z.string().max(20).optional(),
  autoReplyActive:    z.boolean().optional(),
  whatsappTemplate:   z.string().max(500).optional(),
  googleReviewLink:   z.string().max(500).optional(),
  facebookReviewLink: z.string().max(500).optional(),
  facebookPageId:     z.string().max(100).optional(),
  facebookLeadsEnabled: z.boolean().optional(),
  pagePublished:      z.boolean().optional(),
  seoDescription:     z.string().max(300).optional(),
  seoKeywords:        z.string().max(300).optional(),
  greenApiInstanceId: z.string().max(100).optional(),
  greenApiToken:      z.string().max(200).optional(),
});

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const adminSession = await getSession();
  const clientPortal = adminSession ? null : await getClientSession();
  if (!adminSession && !clientPortal) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const client = await prisma.client.findUnique({
    where: { id: params.id },
    select: { id: true, slug: true },
  });
  if (!client) {
    return NextResponse.json({ error: "לא נמצא" }, { status: 404 });
  }
  if (clientPortal && clientPortal.clientId !== client.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const data: Record<string, unknown> = {};
  const d = parsed.data;
  if (d.name !== undefined)               data.name               = sanitizeText(d.name, 200);
  if (d.phone !== undefined)              data.phone              = d.phone;
  if (d.email !== undefined)              data.email              = d.email;
  if (d.primaryColor)                     data.primaryColor       = d.primaryColor;
  if (d.landingPageTitle !== undefined)    data.landingPageTitle   = sanitizeText(d.landingPageTitle, 200);
  if (d.landingPageCta !== undefined)      data.landingPageCta     = sanitizeText(d.landingPageCta, 100);
  if (d.whatsappNumber !== undefined)      data.whatsappNumber     = d.whatsappNumber;
  if (d.autoReplyActive !== undefined)     data.autoReplyActive    = d.autoReplyActive;
  if (d.whatsappTemplate !== undefined)    data.whatsappTemplate   = sanitizeText(d.whatsappTemplate, 500);
  if (d.googleReviewLink !== undefined)    data.googleReviewLink   = d.googleReviewLink;
  if (d.facebookReviewLink !== undefined)  data.facebookReviewLink = d.facebookReviewLink;
  if (d.facebookPageId !== undefined)      data.facebookPageId     = d.facebookPageId;
  if (d.facebookLeadsEnabled !== undefined) data.facebookLeadsEnabled = d.facebookLeadsEnabled;
  if (d.pagePublished !== undefined)       data.pagePublished      = d.pagePublished;
  if (d.seoDescription !== undefined)      data.seoDescription     = sanitizeText(d.seoDescription, 300);
  if (d.seoKeywords !== undefined)         data.seoKeywords        = sanitizeText(d.seoKeywords, 300);
  if (d.greenApiInstanceId !== undefined)  data.greenApiInstanceId = d.greenApiInstanceId;
  if (d.greenApiToken !== undefined)       data.greenApiToken      = d.greenApiToken;

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: "No valid fields" }, { status: 400 });
  }

  const updated = await prisma.client.update({
    where: { id: params.id },
    data,
  });

  // Invalidate caches
  cacheDelete(CacheKeys.seoScore(params.id));
  cacheDelete(CacheKeys.landingPage(updated.slug ?? params.id));

  return NextResponse.json({ ok: true, client: updated });
}
