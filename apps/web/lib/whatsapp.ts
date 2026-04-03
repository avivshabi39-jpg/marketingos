/**
 * Green API — WhatsApp Business integration for Israel
 * https://api.green-api.com
 */

export type WhatsAppResult = { ok: true } | { ok: false; error: string };

export async function sendWhatsApp(
  phone: string,
  message: string,
  instanceId: string,
  apiToken: string
): Promise<WhatsAppResult> {
  // Normalize phone: strip non-digits, ensure country code
  const normalized = normalizePhone(phone);
  if (!normalized) return { ok: false, error: "Invalid phone number" };

  const chatId = `${normalized}@c.us`;
  const url = `https://api.green-api.com/waInstance${instanceId}/sendMessage/${apiToken}`;

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chatId, message }),
      signal: AbortSignal.timeout(10_000),
    });
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
  // Israeli numbers: 05X-XXXXXXX → 9725XXXXXXXX
  if (digits.startsWith("05") && digits.length === 10) {
    return `972${digits.slice(1)}`;
  }
  // Already has country code
  if (digits.startsWith("972") && digits.length === 12) return digits;
  if (digits.startsWith("1") && digits.length === 11) return digits; // US
  // International format without +
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
