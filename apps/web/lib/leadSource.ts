/**
 * Lead Source Normalization
 *
 * Centralizes all lead source handling into one file.
 * Every lead creation flow should use normalizeLeadSource() before saving.
 *
 * Normalized values:
 *   facebook, instagram, google, tiktok, linkedin,
 *   landing_page, whatsapp, chatbot, ai_agent,
 *   webhook, manual, organic, other
 */

export type NormalizedSource =
  | "facebook"
  | "instagram"
  | "google"
  | "tiktok"
  | "linkedin"
  | "landing_page"
  | "whatsapp"
  | "chatbot"
  | "ai_agent"
  | "webhook"
  | "manual"
  | "organic"
  | "other";

// Mapping of raw input patterns → normalized source
const SOURCE_PATTERNS: [RegExp | string, NormalizedSource][] = [
  [/facebook|fb|meta/i, "facebook"],
  ["Facebook Lead Ads", "facebook"],
  [/instagram|ig/i, "instagram"],
  [/google|gclid/i, "google"],
  [/tiktok/i, "tiktok"],
  [/linkedin/i, "linkedin"],
  [/whatsapp|wa/i, "whatsapp"],
  ["chatbot", "chatbot"],
  ["ai_agent", "ai_agent"],
  [/webhook/i, "webhook"],
  ["manual", "manual"],
  ["organic", "organic"],
  ["landing_page", "landing_page"],
  ["direct", "organic"],
];

/**
 * Normalize any source string to a clean, consistent value.
 * Falls back to "other" for unrecognized inputs.
 */
export function normalizeLeadSource(raw: string | null | undefined): NormalizedSource {
  if (!raw || !raw.trim()) return "organic";

  const input = raw.trim();

  // Exact matches first (case-insensitive)
  for (const [pattern, normalized] of SOURCE_PATTERNS) {
    if (typeof pattern === "string") {
      if (input.toLowerCase() === pattern.toLowerCase()) return normalized;
    } else {
      if (pattern.test(input)) return normalized;
    }
  }

  return "other";
}

/**
 * Detect source from UTM parameters.
 * Used by intake and any form-based lead creation.
 */
export function detectSourceFromUtm(utmSource?: string | null, utmMedium?: string | null): NormalizedSource {
  if (utmSource) {
    const normalized = normalizeLeadSource(utmSource);
    if (normalized !== "other") return normalized;
  }

  // Check medium for paid signals
  if (utmMedium) {
    const med = utmMedium.toLowerCase();
    if (med.includes("cpc") || med.includes("paid") || med.includes("ppc")) {
      // Paid but source unknown — try to infer from medium
      if (med.includes("facebook") || med.includes("fb")) return "facebook";
      if (med.includes("google")) return "google";
      if (med.includes("instagram")) return "instagram";
    }
  }

  return utmSource ? "other" : "organic";
}

/**
 * Hebrew display labels — centralized for all UI components.
 */
export const SOURCE_DISPLAY: Record<NormalizedSource, string> = {
  facebook: "פייסבוק",
  instagram: "אינסטגרם",
  google: "גוגל",
  tiktok: "טיקטוק",
  linkedin: "לינקדאין",
  landing_page: "דף נחיתה",
  whatsapp: "וואצאפ",
  chatbot: "צ'אטבוט",
  ai_agent: "סוכן AI",
  webhook: "ווהבוק",
  manual: "ידני",
  organic: "אורגני",
  other: "אחר",
};

/**
 * Get Hebrew label for any source value (handles both normalized and raw).
 */
export function getSourceLabel(source: string | null | undefined): string {
  if (!source) return SOURCE_DISPLAY.organic;
  const normalized = normalizeLeadSource(source);
  return SOURCE_DISPLAY[normalized] ?? source;
}

// ── Medium normalization ─────────────────────────────────────────────────────

export type NormalizedMedium = "cpc" | "social" | "organic" | "email" | "referral" | "direct" | "other";

const MEDIUM_PATTERNS: [RegExp | string, NormalizedMedium][] = [
  [/^cpc$|^ppc$|^paid$|^paidsocial$|^paid_social$/i, "cpc"],
  [/^social$|^social-media$/i, "social"],
  [/^organic$/i, "organic"],
  [/^email$|^newsletter$/i, "email"],
  [/^referral$|^affiliate$/i, "referral"],
  [/^direct$|^none$/i, "direct"],
];

/**
 * Normalize UTM medium to a clean value.
 */
export function normalizeMedium(raw: string | null | undefined): NormalizedMedium | null {
  if (!raw || !raw.trim()) return null;
  const input = raw.trim();
  for (const [pattern, normalized] of MEDIUM_PATTERNS) {
    if (typeof pattern === "string") {
      if (input.toLowerCase() === pattern) return normalized;
    } else {
      if (pattern.test(input)) return normalized;
    }
  }
  return "other";
}

// ── Campaign sanitization ────────────────────────────────────────────────────

/**
 * Sanitize UTM campaign name: trim, lowercase, truncate.
 * Keeps the original wording but makes it consistent.
 */
export function sanitizeCampaign(raw: string | null | undefined): string | undefined {
  if (!raw || !raw.trim()) return undefined;
  return raw.trim().slice(0, 200);
}

// ── Attribution bundle helper ────────────────────────────────────────────────

export interface NormalizedAttribution {
  source: NormalizedSource;
  medium: NormalizedMedium | null;
  campaign: string | undefined;
  utmContent: string | undefined;
  utmTerm: string | undefined;
}

/**
 * Normalize all attribution fields in one call.
 * Use at lead creation to ensure consistency.
 */
export function normalizeAttribution(params: {
  utmSource?: string | null;
  utmMedium?: string | null;
  utmCampaign?: string | null;
  utmContent?: string | null;
  utmTerm?: string | null;
  sourceOverride?: string | null;
}): NormalizedAttribution {
  return {
    source: params.sourceOverride
      ? normalizeLeadSource(params.sourceOverride)
      : detectSourceFromUtm(params.utmSource, params.utmMedium),
    medium: normalizeMedium(params.utmMedium),
    campaign: sanitizeCampaign(params.utmCampaign),
    utmContent: params.utmContent?.trim().slice(0, 200) || undefined,
    utmTerm: params.utmTerm?.trim().slice(0, 200) || undefined,
  };
}
