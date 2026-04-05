import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getClientSession } from "@/lib/clientAuth";
import { getSession } from "@/lib/auth";
import { sanitizeText } from "@/lib/sanitize";

const schema = z.object({
  primaryColor:       z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
  landingPageTitle:   z.string().max(200).optional(),
  landingPageCta:     z.string().max(100).optional(),
  whatsappNumber:     z.string().max(20).optional(),
  autoReplyActive:    z.boolean().optional(),
  whatsappTemplate:   z.string().max(500).optional(),
  googleReviewLink:   z.string().max(500).optional(),
  facebookReviewLink: z.string().max(500).optional(),
  pagePublished:      z.boolean().optional(),
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
  if (parsed.data.primaryColor)                      data.primaryColor      = parsed.data.primaryColor;
  if (parsed.data.landingPageTitle !== undefined)     data.landingPageTitle  = sanitizeText(parsed.data.landingPageTitle, 200);
  if (parsed.data.landingPageCta   !== undefined)     data.landingPageCta    = sanitizeText(parsed.data.landingPageCta, 100);
  if (parsed.data.whatsappNumber   !== undefined)     data.whatsappNumber    = parsed.data.whatsappNumber;
  if (parsed.data.autoReplyActive  !== undefined)     data.autoReplyActive   = parsed.data.autoReplyActive;
  if (parsed.data.whatsappTemplate !== undefined)     data.whatsappTemplate  = sanitizeText(parsed.data.whatsappTemplate, 500);
  if (parsed.data.googleReviewLink !== undefined)     data.googleReviewLink  = parsed.data.googleReviewLink;
  if (parsed.data.facebookReviewLink !== undefined)   data.facebookReviewLink = parsed.data.facebookReviewLink;
  if (parsed.data.pagePublished    !== undefined)     data.pagePublished     = parsed.data.pagePublished;

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: "No valid fields" }, { status: 400 });
  }

  const updated = await prisma.client.update({
    where: { id: params.id },
    data,
  });

  return NextResponse.json({ ok: true, client: updated });
}
