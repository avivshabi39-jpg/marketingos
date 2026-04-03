/**
 * Automatic lead scoring.
 * Called on lead creation. Returns a score 0-10.
 *
 * Rules:
 *  +2  Israeli mobile phone (05x)
 *  +1  Email address provided
 *  +1  Paid UTM source (cpc, paid, facebook, google)
 *  +1  More than 3 metadata fields filled in
 *  +1  Submitted during business hours (08:00–20:00 Israel time)
 *  -1  No phone AND no email (suspicious / low quality)
 */

type LeadInput = {
  phone?: string | null;
  email?: string | null;
  utmMedium?: string | null;
  utmSource?: string | null;
  metadata?: Record<string, unknown> | null;
  createdAt?: Date;
};

export function computeLeadScore(lead: LeadInput): number {
  let score = 0;

  // +2 Israeli mobile
  if (lead.phone && /^05\d{8}$/.test(lead.phone.replace(/[\s\-]/g, ""))) {
    score += 2;
  }

  // +1 email provided
  if (lead.email && lead.email.includes("@")) {
    score += 1;
  }

  // +1 paid UTM
  const paidMediums = ["cpc", "paid", "ppc", "paidsocial"];
  const paidSources = ["facebook", "google", "instagram", "tiktok"];
  if (
    (lead.utmMedium && paidMediums.some((m) => lead.utmMedium!.toLowerCase().includes(m))) ||
    (lead.utmSource && paidSources.some((s) => lead.utmSource!.toLowerCase().includes(s)))
  ) {
    score += 1;
  }

  // +1 rich metadata (3+ fields)
  if (lead.metadata && Object.keys(lead.metadata).length >= 3) {
    score += 1;
  }

  // +1 business hours (08:00–20:00 Israel time UTC+2/+3)
  const now = lead.createdAt ?? new Date();
  const israelHour = (now.getUTCHours() + 2) % 24; // approximate (no DST)
  if (israelHour >= 8 && israelHour < 20) {
    score += 1;
  }

  // -1 no contact info
  if (!lead.phone && !lead.email) {
    score -= 1;
  }

  return Math.max(0, Math.min(10, score));
}
