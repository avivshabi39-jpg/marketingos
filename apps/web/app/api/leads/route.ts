import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSession, isSuperAdmin } from "@/lib/auth";
import { getClientSession } from "@/lib/clientAuth";
import { triggerN8nWebhook } from "@/lib/webhooks";
import { triggerN8nWebhook as triggerN8nDirect } from "@/lib/n8n";
import { sendWhatsApp, buildNewLeadMessage } from "@/lib/whatsapp";
import { rateLimit, getIp } from "@/lib/rateLimit";
import { computeLeadScore } from "@/lib/leadScoring";
import { decrypt } from "@/lib/encrypt";
import { sendAutoReply } from "@/lib/autoReply";
import { sanitizeText } from "@/lib/sanitize";

const VALID_STATUSES = ["NEW", "CONTACTED", "QUALIFIED", "PROPOSAL", "WON", "LOST"] as const;
type LeadStatus = (typeof VALID_STATUSES)[number];

const createSchema = z.object({
  // Honeypot field — bots fill this, humans leave it empty
  _hp: z.string().max(0, "bot").optional(),

  firstName:    z.string().min(1).max(100).transform((v) => v.trim()),
  lastName:     z.string().min(1).max(100).transform((v) => v.trim()),
  email:        z.string().email().max(254).transform((v) => v.trim()).optional().or(z.literal("")),
  phone:        z.string().max(30).transform((v) => v.trim()).optional(),
  source:       z.string().max(100).optional(),
  clientId:     z.string().min(1),
  landingPageId: z.string().optional(),
  metadata:     z.record(z.unknown()).optional(),
  utmSource:    z.string().max(200).optional(),
  utmMedium:    z.string().max(200).optional(),
  utmCampaign:  z.string().max(200).optional(),
  utmContent:   z.string().max(200).optional(),
  utmTerm:      z.string().max(200).optional(),
  notes:        z.string().max(5000).transform((v) => v.trim()).optional(),
  value:        z.number().optional(),
  leadScore:    z.number().int().min(0).max(100).optional(),
  gender:       z.enum(["male", "female", "other"]).optional(),
  ageRange:     z.string().max(20).optional(),
  city:         z.string().max(100).transform((v) => v.trim()).optional(),
});

// GET /api/leads
export async function GET(req: NextRequest) {
  // תמיכה הן ב-admin session והן ב-client_token (פורטל לקוח)
  const clientPortal = await getClientSession();
  const session      = clientPortal ? null : await getSession();

  if (!session && !clientPortal) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const page = Number(searchParams.get("page") ?? "1");
  const limit = Math.min(Number(searchParams.get("limit") ?? "25"), 200);
  const perPage = limit;
  const statusParam = searchParams.get("status");
  const orderByParam = searchParams.get("orderBy");
  const requestedClientId = searchParams.get("clientId") ?? undefined;

  const status = VALID_STATUSES.includes(statusParam as LeadStatus)
    ? (statusParam as LeadStatus)
    : undefined;

  // Build where clause with multi-tenant isolation
  let clientIdFilter: string | { in: string[] } | undefined;

  if (clientPortal) {
    // Client portal: always locked to the token's clientId
    clientIdFilter = clientPortal.clientId;
  } else if (session!.clientId) {
    // Scoped agent/user: always locked to their assigned client
    clientIdFilter = session!.clientId;
  } else if (isSuperAdmin(session!)) {
    // Super-admin: can filter by any clientId or see all
    clientIdFilter = requestedClientId;
  } else {
    // Regular admin (agency owner): restrict to owned clients
    if (requestedClientId) {
      const owned = await prisma.client.findFirst({
        where: { id: requestedClientId, ownerId: session!.userId },
        select: { id: true },
      });
      if (!owned) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
      clientIdFilter = requestedClientId;
    } else {
      const ownedClients = await prisma.client.findMany({
        where: { ownerId: session!.userId },
        select: { id: true },
      });
      clientIdFilter = { in: ownedClients.map((c) => c.id) };
    }
  }

  const where = {
    ...(clientIdFilter ? { clientId: clientIdFilter } : {}),
    ...(status ? { status } : {}),
  };

  const orderBy =
    orderByParam === "leadScore" ? { leadScore: "desc" as const } : { createdAt: "desc" as const };

  const [leads, total] = await Promise.all([
    prisma.lead.findMany({
      where,
      orderBy,
      skip: (page - 1) * perPage,
      take: perPage,
      include: { client: { select: { name: true, slug: true } } },
    }),
    prisma.lead.count({ where }),
  ]);

  return NextResponse.json({ leads, total, page, perPage });
}

// POST /api/leads — create lead
export async function POST(req: NextRequest) {
  const limited = rateLimit(getIp(req), "leads");
  if (limited) {
    return NextResponse.json(
      { error: `יותר מדי בקשות. נסה שוב בעוד ${limited.retryAfter} שניות.` },
      { status: 429, headers: { "Retry-After": String(limited.retryAfter) } }
    );
  }

  const body = await req.json().catch(() => null);
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  // Honeypot: bot trap — silently accept but do nothing
  if (parsed.data._hp) {
    return NextResponse.json({ ok: true, lead: {} });
  }

  // If an authenticated admin session is making this request, verify they own the target client
  const adminSession = await getSession();
  if (adminSession) {
    if (adminSession.clientId && adminSession.clientId !== parsed.data.clientId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    if (!adminSession.clientId && !isSuperAdmin(adminSession)) {
      const owned = await prisma.client.findFirst({
        where: { id: parsed.data.clientId, ownerId: adminSession.userId },
        select: { id: true },
      });
      if (!owned) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    }
  }

  const client = await prisma.client.findUnique({
    where: { id: parsed.data.clientId },
    select: { id: true, isActive: true },
  });

  if (!client || !client.isActive) {
    return NextResponse.json({ error: "לקוח לא קיים או לא פעיל" }, { status: 400 });
  }

  // Duplicate detection — same phone + clientId within last 30 days
  if (parsed.data.phone) {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const duplicate = await prisma.lead.findFirst({
      where: {
        clientId:  parsed.data.clientId,
        phone:     parsed.data.phone,
        createdAt: { gte: thirtyDaysAgo },
      },
      select: { id: true },
    });
    if (duplicate) {
      return NextResponse.json(
        { error: "ליד עם מספר טלפון זה כבר קיים (30 ימים אחרונים)", duplicate: true, existingId: duplicate.id },
        { status: 409 }
      );
    }
  }

  const { metadata, ...rest } = parsed.data;

  // Sanitize text inputs
  if (rest.firstName) rest.firstName = sanitizeText(rest.firstName, 100);
  if (rest.lastName)  rest.lastName  = sanitizeText(rest.lastName, 100);
  if (rest.phone)     rest.phone     = sanitizeText(rest.phone, 30);
  if (rest.email)     rest.email     = sanitizeText(rest.email, 254);
  if (rest.notes)     rest.notes     = sanitizeText(rest.notes, 5000);

  const autoScore = computeLeadScore({
    phone:      rest.phone,
    email:      rest.email,
    utmMedium:  rest.utmMedium,
    utmSource:  rest.utmSource,
    metadata:   metadata as Record<string, unknown> | null | undefined,
  });

  const lead = await prisma.lead.create({
    data: {
      ...rest,
      source:    rest.source ?? "landing_page",
      leadScore: rest.leadScore ?? autoScore,
      ...(metadata ? { metadata: metadata as object } : {}),
    },
  });

  // Write initial activity
  prisma.leadActivity.create({
    data: {
      leadId: lead.id,
      type: "created",
      content: `ליד נוצר ממקור: ${lead.source ?? "לא ידוע"}`,
    },
  }).catch(() => {});

  // Create InboxEvent for client owner
  prisma.client.findUnique({
    where: { id: lead.clientId },
    select: { ownerId: true },
  }).then((c) => {
    if (!c?.ownerId) return;
    return prisma.inboxEvent.create({
      data: {
        userId:      c.ownerId,
        type:        "lead",
        title:       `${lead.firstName} ${lead.lastName}`,
        description: `ליד חדש ממקור: ${lead.source ?? "ללא מקור"}`,
        clientId:    lead.clientId,
        phone:       lead.phone ?? undefined,
      },
    });
  }).catch(() => {});

  // Fire existing workflow webhooks (legacy)
  triggerWorkflowWebhooks(lead).catch(() => {});

  // Fire Green API WhatsApp notification to client
  sendWhatsAppLeadNotification(lead).catch(() => {});

  // Auto-reply: confirm to lead + alert agent
  prisma.client.findUnique({
    where: { id: lead.clientId },
    select: {
      name: true, whatsappNumber: true, agentPhone: true,
      greenApiInstanceId: true, greenApiToken: true,
      autoReplyActive: true, whatsappTemplate: true,
    },
  }).then((c) => { if (c) sendAutoReply(lead, c).catch(() => {}); }).catch(() => {});

  // Fire n8n webhook
  triggerN8nWebhook(lead.clientId, "lead.created", {
    lead: {
      id: lead.id,
      name: `${lead.firstName} ${lead.lastName}`,
      email: lead.email,
      phone: lead.phone,
      source: lead.source,
      utmSource: lead.utmSource,
      utmCampaign: lead.utmCampaign,
    },
  }).catch(() => {});

  // Fire n8n Railway direct webhook (if configured)
  triggerN8nDirect("new-lead", {
    leadId: lead.id,
    clientId: lead.clientId,
    name: `${lead.firstName} ${lead.lastName}`,
    phone: lead.phone ?? "",
    source: lead.source ?? "unknown",
    createdAt: lead.createdAt.toISOString(),
  }).catch(() => {});

  return NextResponse.json({ lead }, { status: 201 });
}

async function triggerWorkflowWebhooks(lead: {
  firstName: string;
  lastName: string;
  phone: string | null;
  source: string | null;
  clientId: string;
}) {
  const workflows = await prisma.workflow.findMany({
    where: {
      clientId: lead.clientId,
      type: "WEBHOOK",
      status: "ACTIVE",
      webhookUrl: { not: null },
    },
    select: { id: true, webhookUrl: true },
  });

  if (workflows.length === 0) return;

  const payload = {
    name: `${lead.firstName} ${lead.lastName}`.trim(),
    phone: lead.phone ?? null,
    source: lead.source ?? null,
    clientId: lead.clientId,
  };

  await Promise.all(
    workflows.map(async (wf) => {
      try {
        await fetch(wf.webhookUrl!, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
          signal: AbortSignal.timeout(10_000),
        });
        await prisma.workflow.update({
          where: { id: wf.id },
          data: { lastRunAt: new Date() },
        });
      } catch {
        // Swallow — webhook failure must not affect lead creation
      }
    })
  );
}

async function sendWhatsAppLeadNotification(lead: {
  firstName: string;
  lastName: string;
  phone: string | null;
  email: string | null;
  source: string | null;
  clientId: string;
}) {
  const client = await prisma.client.findUnique({
    where: { id: lead.clientId },
    select: {
      name: true,
      whatsappNumber: true,
      greenApiInstanceId: true,
      greenApiToken: true,
    },
  });

  if (
    !client?.greenApiInstanceId ||
    !client?.greenApiToken ||
    !client?.whatsappNumber
  ) return;

  const message = buildNewLeadMessage(client.name, lead);
  const decryptedToken = decrypt(client.greenApiToken);
  await sendWhatsApp(
    client.whatsappNumber,
    message,
    client.greenApiInstanceId,
    decryptedToken
  );
}
