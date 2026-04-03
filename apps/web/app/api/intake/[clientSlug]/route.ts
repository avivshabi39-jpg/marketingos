import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { triggerN8nWebhook } from "@/lib/webhooks";
import { rateLimit, getIp } from "@/lib/rateLimit";
import { sendAutoReply } from "@/lib/autoReply";
import { sanitizeText } from "@/lib/sanitize";

const schema = z.object({
  // Honeypot — bots fill this, humans leave it empty
  _hp: z.string().max(0, "bot").optional(),

  // Intake form fields
  fullName:           z.string().min(1),
  businessName:       z.string().min(1),
  email:              z.string().email(),
  phone:              z.string().optional(),
  preferredContact:   z.string().optional(),
  businessType:       z.string().optional(),
  targetAudience:     z.string().optional(),
  operatingAreas:     z.string().optional(),
  uniqueSellingPoint: z.string().optional(),
  projectType:        z.string().optional(),
  mainGoal:           z.string().optional(),
  description:        z.string().optional(),
  painPoints:         z.string().optional(),
  marketingChannels:  z.string().optional(),
  budgetRange:        z.string().optional(),
  goals:              z.string().optional(),
  notes:              z.string().optional(),

  // UTM tracking (from body — e.g. Facebook Lead Forms)
  utm_source:   z.string().optional(),
  utm_medium:   z.string().optional(),
  utm_campaign: z.string().optional(),
  utm_content:  z.string().optional(),
  utm_term:     z.string().optional(),
});

function detectSource(utmSource?: string): string {
  if (!utmSource) return "organic";
  const src = utmSource.toLowerCase();
  if (src.includes("facebook") || src.includes("fb")) return "facebook";
  if (src.includes("google")) return "google";
  return utmSource;
}

export async function POST(
  req: NextRequest,
  { params }: { params: { clientSlug: string } }
) {
  const limited = rateLimit(getIp(req), "intake");
  if (limited) {
    return NextResponse.json(
      { error: `יותר מדי בקשות. נסה שוב בעוד ${limited.retryAfter} שניות.` },
      { status: 429 }
    );
  }

  const client = await prisma.client.findUnique({
    where: { slug: params.clientSlug },
    select: {
      id: true, isActive: true, name: true,
      whatsappNumber: true, agentPhone: true,
      greenApiInstanceId: true, greenApiToken: true,
      autoReplyActive: true, whatsappTemplate: true,
    },
  });

  if (!client || !client.isActive) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  // Honeypot: if _hp is filled, silently accept but do nothing (bot trap)
  if (parsed.data._hp) {
    return NextResponse.json({ ok: true });
  }

  const {
    utm_source, utm_medium, utm_campaign, utm_content, utm_term,
    fullName: rawFullName, email: rawEmail, phone: rawPhone, ...intakeData
  } = parsed.data;

  // Sanitize user-supplied text inputs
  const fullName = sanitizeText(rawFullName, 200);
  const email    = rawEmail ? sanitizeText(rawEmail, 254) : rawEmail;
  const phone    = rawPhone ? sanitizeText(rawPhone, 30) : rawPhone;

  // Also read UTM from URL query params (from landing page links)
  const url = new URL(req.url);
  const utmSource   = utm_source   ?? url.searchParams.get("utm_source")   ?? undefined;
  const utmMedium   = utm_medium   ?? url.searchParams.get("utm_medium")   ?? undefined;
  const utmCampaign = utm_campaign ?? url.searchParams.get("utm_campaign") ?? undefined;
  const utmContent  = utm_content  ?? url.searchParams.get("utm_content")  ?? undefined;
  const utmTerm     = utm_term     ?? url.searchParams.get("utm_term")     ?? undefined;

  const detectedSource = detectSource(utmSource);

  const [firstName = "", ...rest] = fullName.trim().split(" ");
  const lastName = rest.join(" ") || "-";

  const { extraData: _extraData, businessName, ...restFields } = intakeData as Record<string, unknown> & {
    extraData?: unknown;
    businessName?: string;
  };

  // Create intake form record (businessName is required by schema)
  const intake = await prisma.intakeForm.create({
    data: {
      fullName,
      email,
      phone: phone ?? null,
      businessName: (businessName as string) ?? "",
      ...(restFields as Record<string, string | null | undefined>),
      extraData: _extraData ?? undefined,
      clientId: client.id,
    },
  });

  // Also create a Lead record for CRM tracking
  const lead = await prisma.lead.create({
    data: {
      firstName,
      lastName,
      email,
      phone,
      source: detectedSource,
      utmSource,
      utmMedium,
      utmCampaign,
      utmContent,
      utmTerm,
      clientId: client.id,
      metadata: {
        fromIntakeForm: true,
        intakeFormId: intake.id,
        businessName: intakeData.businessName,
      },
    },
  });

  // Fire n8n webhook asynchronously
  triggerN8nWebhook(client.id, "lead.created", {
    lead: {
      id: lead.id,
      name: `${firstName} ${lastName}`,
      email,
      phone,
      source: detectedSource,
      utmSource,
      utmCampaign,
    },
    intakeFormId: intake.id,
  }).catch(() => {/* fire and forget */});

  // Auto-reply: confirm to lead + alert agent
  sendAutoReply(
    { firstName, lastName, phone: phone ?? null, source: detectedSource, utmSource },
    client
  ).catch(() => {});

  return NextResponse.json({ intake, lead, clientName: client.name }, { status: 201 });
}
