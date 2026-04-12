import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { triggerN8nWebhook } from "@/lib/webhooks";
import { rateLimit, getIp } from "@/lib/rateLimit";
import { sendPushNotification } from "@/lib/push";
import { sendAutoReply } from "@/lib/autoReply";
import { sendNewLeadEmail } from "@/lib/email";
import { sanitizeText } from "@/lib/sanitize";
import { computeLeadScore } from "@/lib/leadScoring";
import { createNotification } from "@/lib/notifications";

const schema = z.object({
  // Honeypot — bots fill this, humans leave it empty
  _hp: z.string().max(0, "bot").optional(),

  // Intake form fields
  fullName:           z.string().min(1),
  businessName:       z.string().optional(),
  email:              z.string().email().optional().or(z.literal("")),
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

  // Demographics (optional, from landing page form)
  gender:     z.enum(["male", "female", "other"]).optional(),
  ageRange:   z.string().max(20).optional(),
  city:       z.string().max(100).optional(),

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
      id: true, isActive: true, name: true, ownerId: true,
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

  // Sanitize user-supplied text inputs (ensure required fields are never undefined)
  const fullName = sanitizeText(rawFullName, 200);
  const email    = rawEmail ? sanitizeText(rawEmail, 254) : "";
  const phone    = rawPhone ? sanitizeText(rawPhone, 30) : undefined;

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

  // Create intake form record
  const intake = await prisma.intakeForm.create({
    data: {
      fullName,
      email: email || "",
      phone: phone ?? null,
      businessName: businessName ?? fullName,
      ...(restFields as Record<string, string | null | undefined>),
      extraData: _extraData ?? undefined,
      clientId: client.id,
    },
  });

  // Compute lead score from available data
  const leadScore = computeLeadScore({
    phone,
    email,
    utmMedium,
    utmSource,
    metadata: { fromIntakeForm: true, businessName: intakeData.businessName },
  });

  // Create Lead record with explicit status and score
  const lead = await prisma.lead.create({
    data: {
      firstName,
      lastName,
      email,
      phone,
      source: detectedSource,
      status: "NEW",
      leadScore,
      utmSource,
      utmMedium,
      utmCampaign,
      utmContent,
      utmTerm,
      gender: intakeData.gender ?? null,
      ageRange: intakeData.ageRange ?? null,
      city: intakeData.city ?? null,
      clientId: client.id,
      metadata: {
        fromIntakeForm: true,
        intakeFormId: intake.id,
        businessName: intakeData.businessName,
      },
    },
  });

  // --- Side effects: non-blocking, failures logged ---

  // Lead activity record (audit trail)
  prisma.leadActivity.create({
    data: {
      leadId: lead.id,
      type: "created",
      content: `ליד נוצר מטופס קבלה (${detectedSource})`,
    },
  }).catch((err) => console.error("[intake-lead-activity]", err));

  // Inbox event for admin dashboard
  if (client.ownerId) {
    prisma.inboxEvent.create({
      data: {
        userId: client.ownerId,
        type: "lead",
        title: `${firstName} ${lastName}`,
        description: `ליד חדש מטופס קבלה — ${detectedSource}`,
        clientId: client.id,
        phone: phone ?? undefined,
      },
    }).catch((err) => console.error("[intake-inbox-event]", err));
  }

  // In-app notification
  createNotification({
    clientId: client.id,
    type: "lead_new",
    title: "ליד חדש התקבל",
    body: `${firstName} ${lastName} — ${detectedSource}`,
  }).catch((err) => console.error("[intake-notification]", err));

  // n8n webhook
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
  }).catch((err) => console.error("[intake-n8n-webhook]", err));

  // Auto-reply to lead — awaited so we can mark autoReplied flag
  try {
    const { leadReplied } = await sendAutoReply(
      { firstName, lastName, phone: phone ?? null, source: detectedSource, utmSource },
      client
    );
    if (leadReplied) {
      prisma.lead.update({
        where: { id: lead.id },
        data: { autoReplied: true },
      }).catch((err) => console.error("[intake-auto-replied-flag]", err));
    }
  } catch (err) {
    console.error("[intake-auto-reply]", err);
  }

  // Push + email notification to admin
  if (client.ownerId) {
    sendPushNotification(client.ownerId, {
      title: "🎯 ליד חדש הגיע!",
      body: `${firstName} ${lastName} — ${client.name}`,
      url: "/admin/leads",
    }).catch((err) => console.error("[intake-push]", err));

    prisma.user.findUnique({
      where: { id: client.ownerId },
      select: { email: true },
    }).then((adminUser) => {
      if (adminUser?.email) {
        sendNewLeadEmail(adminUser.email, {
          clientName: client.name,
          leadName: `${firstName} ${lastName}`,
          leadPhone: phone || "",
          leadEmail: email || undefined,
          source: detectedSource,
        }).catch((err) => console.error("[intake-email]", err));
      }
    }).catch((err) => console.error("[intake-admin-lookup]", err));
  }

  return NextResponse.json({ intake, lead, clientName: client.name }, { status: 201 });
}
