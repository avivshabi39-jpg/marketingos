/**
 * Auto-reply system — sends WhatsApp messages when a new lead is created.
 * 1. Confirmation to the lead ("we received your inquiry")
 * 2. Alert to the agent/client ("new lead!")
 *
 * Returns { leadReplied: boolean } so the caller can set autoReplied flag.
 */

import { sendWhatsApp, normalizePhone } from "@/lib/whatsapp";
import { decrypt } from "@/lib/encrypt";

export interface AutoReplyLead {
  firstName: string;
  lastName: string;
  phone: string | null;
  email?: string | null;
  source?: string | null;
  utmSource?: string | null;
  utmCampaign?: string | null;
}

export interface AutoReplyClient {
  name: string;
  whatsappNumber: string | null;
  agentPhone?: string | null;
  greenApiInstanceId: string | null;
  greenApiToken: string | null;
  autoReplyActive: boolean;
  whatsappTemplate: string | null;
}

// Improved default template — friendly, short, includes clear next step
const DEFAULT_LEAD_TEMPLATE =
  `שלום {name}! 👋

תודה שפנית אלינו ב{clientName}.
קיבלנו את הפנייה שלך ונחזור אליך בהקדם.

אם זה דחוף — שלח לנו הודעה כאן ונטפל מיד 📱`;

const DEFAULT_AGENT_TEMPLATE =
  `🔔 ליד חדש!

שם: {name}
טלפון: {phone}
מקור: {source}

הגיב מהר — הלידים החמים נסגרים תוך 5 דקות ⏰`;

export async function sendAutoReply(
  lead: AutoReplyLead,
  client: AutoReplyClient
): Promise<{ leadReplied: boolean }> {
  if (!client.greenApiInstanceId || !client.greenApiToken) {
    return { leadReplied: false };
  }

  const instanceId = client.greenApiInstanceId;
  const rawToken = decrypt(client.greenApiToken);
  const fullName = `${lead.firstName} ${lead.lastName}`.trim();
  const source = lead.source ?? lead.utmSource ?? "אורגני";

  let leadReplied = false;

  // 1. Send confirmation to the lead (if they have a valid phone)
  if (lead.phone && normalizePhone(lead.phone)) {
    const template = client.autoReplyActive && client.whatsappTemplate
      ? client.whatsappTemplate
      : DEFAULT_LEAD_TEMPLATE;

    const leadMessage = template
      .replace(/{name}/g, fullName)
      .replace(/{clientName}/g, client.name)
      .replace(/{phone}/g, lead.phone ?? "");

    const result = await sendWhatsApp(lead.phone, leadMessage, instanceId, rawToken);
    if (result.ok) {
      leadReplied = true;
    } else {
      console.error(`[auto-reply] Failed to send to lead: ${result.error}`);
    }
  }

  // 2. Send new lead alert to agent (whatsappNumber or agentPhone)
  const agentPhone = client.whatsappNumber ?? client.agentPhone ?? null;
  if (agentPhone && normalizePhone(agentPhone)) {
    const agentMessage = DEFAULT_AGENT_TEMPLATE
      .replace(/{name}/g, fullName)
      .replace(/{phone}/g, lead.phone ?? "אין")
      .replace(/{source}/g, source);

    const result = await sendWhatsApp(agentPhone, agentMessage, instanceId, rawToken);
    if (!result.ok) {
      console.error(`[auto-reply] Failed to alert agent: ${result.error}`);
    }
  }

  return { leadReplied };
}
