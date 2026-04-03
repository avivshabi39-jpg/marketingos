/**
 * Auto-reply system — sends WhatsApp messages when a new lead is created.
 * 1. Confirmation to the lead ("we received your inquiry")
 * 2. Alert to the agent/client ("new lead!")
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

const DEFAULT_LEAD_TEMPLATE =
  "שלום {name}! קיבלנו את פנייתך ל{clientName}.\nנחזור אליך תוך זמן קצר 😊";

const DEFAULT_AGENT_TEMPLATE =
  "ליד חדש! 🔔\nשם: {name}\nטלפון: {phone}\nמקור: {source}";

export async function sendAutoReply(
  lead: AutoReplyLead,
  client: AutoReplyClient
): Promise<void> {
  if (!client.greenApiInstanceId || !client.greenApiToken) return;

  const instanceId = client.greenApiInstanceId;
  const rawToken = decrypt(client.greenApiToken);
  const fullName = `${lead.firstName} ${lead.lastName}`.trim();
  const source = lead.source ?? lead.utmSource ?? "אורגני";

  const promises: Promise<unknown>[] = [];

  // 1. Send confirmation to the lead (if they have a phone)
  if (lead.phone && normalizePhone(lead.phone)) {
    const template = client.autoReplyActive && client.whatsappTemplate
      ? client.whatsappTemplate
      : DEFAULT_LEAD_TEMPLATE;

    const leadMessage = template
      .replace(/{name}/g, fullName)
      .replace(/{clientName}/g, client.name)
      .replace(/{phone}/g, lead.phone ?? "");

    promises.push(
      sendWhatsApp(lead.phone, leadMessage, instanceId, rawToken).catch(() => {})
    );
  }

  // 2. Send new lead alert to agent (whatsappNumber or agentPhone)
  const agentPhone = client.whatsappNumber ?? client.agentPhone ?? null;
  if (agentPhone && normalizePhone(agentPhone)) {
    const agentMessage = DEFAULT_AGENT_TEMPLATE
      .replace(/{name}/g, fullName)
      .replace(/{phone}/g, lead.phone ?? "אין")
      .replace(/{source}/g, source);

    promises.push(
      sendWhatsApp(agentPhone, agentMessage, instanceId, rawToken).catch(() => {})
    );
  }

  await Promise.allSettled(promises);
}
