/**
 * Meta (Facebook) Access Token Manager
 *
 * Token types:
 * - Short-lived: 1-2 hours (from OAuth)
 * - Long-lived: 60 days (exchanged from short)
 * - Page tokens: Never expire (from long-lived user token)
 */

const META_APP_ID = process.env.META_APP_ID || "";
const META_APP_SECRET = process.env.META_APP_SECRET || "";
const GRAPH_API = "https://graph.facebook.com/v19.0";

export interface TokenInfo {
  isValid: boolean;
  expiresAt: Date | null;
  daysUntilExpiry: number | null;
  status: string;
}

/** Exchange short-lived token for long-lived (60 days) */
export async function exchangeForLongLivedToken(
  shortToken: string
): Promise<{ token: string; expiresIn: number } | null> {
  if (!META_APP_ID || !META_APP_SECRET) return null;
  try {
    const url = `${GRAPH_API}/oauth/access_token?grant_type=fb_exchange_token&client_id=${META_APP_ID}&client_secret=${META_APP_SECRET}&fb_exchange_token=${shortToken}`;
    const res = await fetch(url);
    if (!res.ok) return null;
    const data = await res.json();
    return { token: data.access_token, expiresIn: data.expires_in || 5184000 };
  } catch {
    return null;
  }
}

/** Get page access token (never expires if from long-lived user token) */
export async function getPageToken(
  userToken: string,
  pageId: string
): Promise<string | null> {
  try {
    const res = await fetch(
      `${GRAPH_API}/me/accounts?access_token=${userToken}`
    );
    if (!res.ok) return null;
    const data = await res.json();
    const page = (data.data as { id: string; access_token: string }[])?.find(
      (p) => p.id === pageId
    );
    return page?.access_token || null;
  } catch {
    return null;
  }
}

/** Verify token validity + get expiry info */
export async function inspectToken(token: string): Promise<TokenInfo> {
  const invalid: TokenInfo = {
    isValid: false,
    expiresAt: null,
    daysUntilExpiry: null,
    status: "❌ פג תוקף",
  };

  if (!META_APP_ID || !META_APP_SECRET) {
    return { isValid: true, expiresAt: null, daysUntilExpiry: null, status: "✅ תקין" };
  }

  try {
    const res = await fetch(
      `${GRAPH_API}/debug_token?input_token=${token}&access_token=${META_APP_ID}|${META_APP_SECRET}`
    );
    if (!res.ok) return invalid;
    const { data } = await res.json();
    if (!data?.is_valid) return invalid;

    const expiresAt = data.expires_at ? new Date(data.expires_at * 1000) : null;
    const days = expiresAt
      ? Math.floor((expiresAt.getTime() - Date.now()) / 86400000)
      : null;

    return {
      isValid: true,
      expiresAt,
      daysUntilExpiry: days,
      status:
        days === null
          ? "✅ תקין (ללא תפוגה)"
          : days < 7
            ? `⚠️ פג בעוד ${days} ימים`
            : `✅ תקין (${days} ימים)`,
    };
  } catch {
    return invalid;
  }
}

/** Check all client tokens and alert on expiring ones */
export async function checkAndRefreshTokens() {
  const { prisma } = await import("@/lib/prisma");

  const results = { checked: 0, refreshed: 0, expired: 0, errors: [] as string[] };

  const clients = await prisma.client.findMany({
    where: { facebookLeadsEnabled: true, facebookAccessToken: { not: null } },
    select: {
      id: true,
      name: true,
      facebookAccessToken: true,
      facebookPageId: true,
      ownerId: true,
    },
    take: 200,
  });

  for (const client of clients) {
    results.checked++;
    if (!client.facebookAccessToken) continue;

    try {
      const info = await inspectToken(client.facebookAccessToken);

      if (!info.isValid) {
        results.expired++;
        results.errors.push(`${client.name}: expired`);
        if (client.ownerId) {
          const owner = await prisma.user.findUnique({
            where: { id: client.ownerId },
            select: { email: true },
          });
          if (owner?.email) sendAlert(owner.email, client.name, "expired");
        }
        continue;
      }

      if (info.daysUntilExpiry !== null && info.daysUntilExpiry < 7 && client.facebookPageId) {
        const newToken = await getPageToken(client.facebookAccessToken, client.facebookPageId);
        if (newToken) {
          await prisma.client.update({
            where: { id: client.id },
            data: { facebookAccessToken: newToken },
          });
          results.refreshed++;
        }
      }
    } catch (err: unknown) {
      results.errors.push(`${client.name}: ${err instanceof Error ? err.message : "unknown"}`);
    }
  }

  return results;
}

async function sendAlert(email: string, clientName: string, type: string) {
  if (!process.env.RESEND_API_KEY) return;
  await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: process.env.RESEND_FROM || "alerts@marketingos.co.il",
      to: email,
      subject: `🚨 Facebook token ${type} — ${clientName}`,
      html: `<div dir="rtl"><p>טוקן פייסבוק של ${clientName} ${type === "expired" ? "פג תוקף" : "עומד לפוג"}. חדש אותו בהגדרות.</p></div>`,
    }),
  }).catch(() => {});
}
