import { NextRequest, NextResponse } from "next/server";
import { createHmac, timingSafeEqual } from "crypto";
import { prisma } from "@/lib/prisma";
import { triggerN8nWebhook } from "@/lib/webhooks";
import { matchLeadToProperties } from "@/lib/propertyMatcher";
import { decrypt } from "@/lib/encrypt";
import { sendAutoReply } from "@/lib/autoReply";
import { sendNewLeadEmail } from "@/lib/email";
import { sendPushNotification } from "@/lib/push";

// Facebook field name → our Lead field mapping
const FB_FIELD_MAP: Record<string, string> = {
  full_name:    "fullName",
  first_name:   "firstName",
  last_name:    "lastName",
  email:        "email",
  phone_number: "phone",
  phone:        "phone",
};

type FbFieldData = { name: string; values: string[] };
type FbLeadData = {
  id: string;
  field_data: FbFieldData[];
  created_time: string;
  ad_id?: string;
  form_id?: string;
  page_id?: string;
};
type FbEntry = {
  id: string;
  changes: { value: { leadgen_id: string; page_id: string; form_id: string; adgroup_id?: string }; field: string }[];
};

async function fetchFacebookLead(leadId: string, accessToken: string): Promise<FbLeadData | null> {
  const url = `https://graph.facebook.com/v19.0/${leadId}?access_token=${accessToken}`;
  const res = await fetch(url, { signal: AbortSignal.timeout(10_000) });
  if (!res.ok) return null;
  return res.json() as Promise<FbLeadData>;
}

function parseLeadFields(fieldData: FbFieldData[]): {
  firstName: string;
  lastName: string;
  email: string | null;
  phone: string | null;
  extra: Record<string, string>;
} {
  const mapped: Record<string, string> = {};
  const extra: Record<string, string> = {};

  for (const field of fieldData) {
    const val = field.values[0] ?? "";
    const ourKey = FB_FIELD_MAP[field.name];
    if (ourKey) {
      mapped[ourKey] = val;
    } else {
      extra[field.name] = val;
    }
  }

  let firstName = mapped.firstName ?? "";
  let lastName = mapped.lastName ?? "";

  // If only full_name provided, split it
  if (!firstName && mapped.fullName) {
    const parts = mapped.fullName.trim().split(" ");
    firstName = parts[0] ?? "";
    lastName = parts.slice(1).join(" ") || "-";
  }

  return {
    firstName: firstName || "Unknown",
    lastName: lastName || "-",
    email: mapped.email ?? null,
    phone: mapped.phone ?? null,
    extra,
  };
}

// GET — Facebook webhook verification
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const mode = searchParams.get("hub.mode");
  const token = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");

  if (mode === "subscribe" && token === process.env.FACEBOOK_VERIFY_TOKEN) {
    return new NextResponse(challenge, { status: 200 });
  }

  return NextResponse.json({ error: "Forbidden" }, { status: 403 });
}

// POST — Facebook webhook events
export async function POST(req: NextRequest) {
  const rawBody = await req.text();

  // Verify X-Hub-Signature-256 when FACEBOOK_APP_SECRET is configured
  const signature = req.headers.get("X-Hub-Signature-256");
  const secret = process.env.FACEBOOK_APP_SECRET ?? "";
  if (secret) {
    if (!signature) {
      return NextResponse.json({ error: "Missing signature" }, { status: 401 });
    }
    const expected = "sha256=" + createHmac("sha256", secret).update(rawBody).digest("hex");
    const sigBuf = Buffer.from(signature);
    const expBuf = Buffer.from(expected);
    if (sigBuf.length !== expBuf.length || !timingSafeEqual(sigBuf, expBuf)) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }
  }

  let body: { object: string; entry: FbEntry[] };
  try {
    body = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (body.object !== "page") {
    return NextResponse.json({ status: "ignored" });
  }

  // Process each entry asynchronously (Facebook expects quick response)
  processEntries(body.entry).catch((err) =>
    console.error("[fb-webhook] Processing error:", err)
  );

  return NextResponse.json({ status: "ok" });
}

async function processEntries(entries: FbEntry[]) {
  for (const entry of entries) {
    for (const change of entry.changes) {
      if (change.field !== "leadgen") continue;

      const { leadgen_id, page_id, form_id } = change.value;

      // Find client by Facebook page ID (facebookPageId takes priority, fall back to facebookPixelId)
      const client = await prisma.client.findFirst({
        where: {
          OR: [
            { facebookPageId: page_id, isActive: true },
            { facebookPixelId: page_id, isActive: true },
          ],
        },
        select: {
          id: true,
          name: true,
          industry: true,
          ownerId: true,
          facebookAccessToken: true,
          whatsappNumber: true,
          agentPhone: true,
          autoReplyActive: true,
          whatsappTemplate: true,
          greenApiInstanceId: true,
          greenApiToken: true,
        },
      });

      if (!client) {
        console.warn(`[fb-webhook] No client found for page_id: ${page_id}`);
        continue;
      }

      // Use per-client token (decrypt if encrypted), fall back to global env var
      const rawToken = client.facebookAccessToken
        ? decrypt(client.facebookAccessToken)
        : null;
      const accessToken = rawToken || process.env.FACEBOOK_ACCESS_TOKEN;
      if (!accessToken) {
        console.warn(`[fb-webhook] No access token for client ${client.id}`);
        continue;
      }

      const fbLead = await fetchFacebookLead(leadgen_id, accessToken);
      if (!fbLead) {
        console.warn(`[fb-webhook] Could not fetch lead ${leadgen_id}`);
        continue;
      }

      const { firstName, lastName, email, phone, extra } = parseLeadFields(fbLead.field_data);

      const lead = await prisma.lead.create({
        data: {
          firstName,
          lastName,
          email,
          phone,
          source: "facebook",
          utmSource: "facebook",
          utmMedium: "lead_form",
          utmCampaign: change.value.adgroup_id ?? undefined,
          utmContent: form_id,
          clientId: client.id,
          metadata: {
            facebookLeadId: leadgen_id,
            facebookFormId: form_id,
            facebookPageId: page_id,
            ...extra,
          },
        },
      });

      // Trigger n8n webhook
      triggerN8nWebhook(client.id, "lead.created", {
        lead: {
          id: lead.id,
          name: `${firstName} ${lastName}`,
          email,
          phone,
          source: "facebook",
          utmSource: "facebook",
          utmCampaign: change.value.adgroup_id,
        },
        fromFacebook: true,
      }).catch(() => {});

      // Auto-reply via WhatsApp
      sendAutoReply(
        { firstName, lastName, phone, source: "facebook", utmSource: "facebook" },
        client as Parameters<typeof sendAutoReply>[1]
      ).catch(() => {});

      // Push notification to admin
      if (client.ownerId) {
        sendPushNotification(client.ownerId, {
          title: "🎯 ליד חדש מפייסבוק!",
          body: `${firstName} ${lastName} — ${client.name}`,
          url: "/admin/leads",
        }).catch(() => {});

        // Email notification
        const adminUser = await prisma.user.findUnique({
          where: { id: client.ownerId },
          select: { email: true },
        });
        if (adminUser?.email) {
          sendNewLeadEmail(adminUser.email, {
            clientName: client.name,
            leadName: `${firstName} ${lastName}`,
            leadPhone: phone || "",
            leadEmail: email || undefined,
            source: "Facebook Lead Ads",
          }).catch(() => {});
        }
      }

      // For real estate clients, match to properties
      if (client.industry === "REAL_ESTATE") {
        matchLeadToProperties(lead.id).catch(() => {});
      }
    }
  }
}
