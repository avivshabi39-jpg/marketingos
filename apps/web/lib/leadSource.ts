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
