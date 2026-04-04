/**
 * Green API — WhatsApp Business integration
 * Supports per-client credentials with fallback to env defaults
 */

export type WhatsAppResult = { ok: true } | { ok: false; error: string };

interface ClientWhatsApp {
  greenApiInstanceId?: string | null;
  greenApiToken?: string | null;
}

const DEFAULT_INSTANCE = process.env.GREEN_API_INSTANCE_ID ?? "";
const DEFAULT_TOKEN = process.env.GREEN_API_TOKEN ?? "";
const DEFAULT_URL = process.env.GREEN_API_URL ?? "https://api.green-api.com";

function getConfig(client?: ClientWhatsApp | null) {
  const instanceId = client?.greenApiInstanceId || DEFAULT_INSTANCE;
  const token = client?.greenApiToken || DEFAULT_TOKEN;
  // Derive base URL from instance ID prefix (Green API routing)
  const prefix = instanceId.slice(0, 4);
  const url = prefix ? `https://${prefix}.api.greenapi.com` : DEFAULT_URL;
  return { instanceId, token, url };
}

export async function getWhatsAppStatus(
  client?: ClientWhatsApp | null
): Promise<string> {
  const { instanceId, token, url } = getConfig(client);
  if (!instanceId || !token) return "not_configured";

  try {
    const res = await fetch(
      `${url}/waInstance${instanceId}/getStateInstance/${token}`,
      { signal: AbortSignal.timeout(8_000), cache: "no-store" }
    );
    const data = (await res.json()) as { stateInstance?: string };
    return data.stateInstance ?? "unknown";
  } catch {
    return "error";
  }
}

export async function getQRCode(
  client?: ClientWhatsApp | null
): Promise<string | null> {
  const { instanceId, token, url } = getConfig(client);
  if (!instanceId || !token) return null;

  try {
    const res = await fetch(
      `${url}/waInstance${instanceId}/qr/${token}`,
      { signal: AbortSignal.timeout(8_000) }
    );
    const data = (await res.json()) as { message?: string; type?: string };
    return data.message ?? null;
  } catch {
    return null;
  }
}

export async function sendWhatsApp(
  phone: string,
  message: string,
  instanceIdOrClient: string | ClientWhatsApp,
  apiToken?: string
): Promise<WhatsAppResult> {
  let instanceId: string;
  let token: string;
  let url: string;

  if (typeof instanceIdOrClient === "string") {
    instanceId = instanceIdOrClient;
    token = apiToken ?? "";
    const prefix = instanceId.slice(0, 4);
    url = prefix ? `https://${prefix}.api.greenapi.com` : DEFAULT_URL;
  } else {
    const config = getConfig(instanceIdOrClient);
    instanceId = config.instanceId;
    token = config.token;
    url = config.url;
  }

  if (!instanceId || !token) return { ok: false, error: "WhatsApp לא מוגדר" };

  const normalized = normalizePhone(phone);
  if (!normalized) return { ok: false, error: "מספר טלפון לא תקין" };

  const chatId = `${normalized}@c.us`;

  try {
    const res = await fetch(
      `${url}/waInstance${instanceId}/sendMessage/${token}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chatId, message }),
        signal: AbortSignal.timeout(10_000),
      }
    );
    if (!res.ok) {
      const body = await res.text().catch(() => "");
      return { ok: false, error: `Green API error ${res.status}: ${body}` };
    }
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Network error" };
  }
}

export function normalizePhone(phone: string): string | null {
  const digits = phone.replace(/[^0-9]/g, "");
  if (!digits) return null;
  if (digits.startsWith("05") && digits.length === 10) return `972${digits.slice(1)}`;
  if (digits.startsWith("972") && digits.length === 12) return digits;
  if (digits.startsWith("1") && digits.length === 11) return digits;
  if (digits.length >= 10) return digits;
  return null;
}

export function buildNewLeadMessage(
  clientName: string,
  lead: {
    firstName: string;
    lastName: string;
    phone: string | null;
    email: string | null;
    source: string | null;
  }
): string {
  const lines = [
    `🔔 *ליד חדש התקבל — ${clientName}*`,
    ``,
    `👤 *שם:* ${lead.firstName} ${lead.lastName}`,
  ];
  if (lead.phone) lines.push(`📞 *טלפון:* ${lead.phone}`);
  if (lead.email) lines.push(`📧 *מייל:* ${lead.email}`);
  if (lead.source) lines.push(`📌 *מקור:* ${lead.source}`);
  lines.push(``, `⏰ ${new Date().toLocaleString("he-IL")}`);
  return lines.join("\n");
}
