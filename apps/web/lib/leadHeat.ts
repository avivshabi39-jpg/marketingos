/**
 * Lead Heat Classification — HOT / WARM / COLD
 *
 * Derived from leadScore + contact data + recency.
 * Centralized here so all UI components use the same logic.
 *
 * Rules:
 *   HOT  = score >= 4 AND has phone
 *   WARM = score >= 2 AND has phone, OR score >= 4 without phone
 *   COLD = everything else
 *
 * Recency boost: leads created in last 24h get +1 effective level
 *   (COLD → WARM, WARM → HOT)
 */

export type LeadHeat = "hot" | "warm" | "cold";

export interface LeadHeatInput {
  leadScore: number;
  phone: string | null;
  email: string | null;
  createdAt: string | Date;
}

export function classifyLeadHeat(lead: LeadHeatInput): LeadHeat {
  const score = lead.leadScore ?? 0;
  const hasPhone = Boolean(lead.phone && lead.phone.trim().length > 3);
  const isRecent = (Date.now() - new Date(lead.createdAt).getTime()) < 24 * 3600 * 1000;

  // Base classification
  let heat: LeadHeat;
  if (score >= 4 && hasPhone) {
    heat = "hot";
  } else if ((score >= 2 && hasPhone) || score >= 4) {
    heat = "warm";
  } else {
    heat = "cold";
  }

  // Recency boost: bump up one level if created in last 24h
  if (isRecent && heat === "cold") heat = "warm";
  if (isRecent && heat === "warm" && hasPhone) heat = "hot";

  return heat;
}

// Visual config — used by UI components
export const HEAT_CONFIG = {
  hot: {
    label: "חם",
    emoji: "🔥",
    color: "text-red-700",
    bg: "bg-red-50",
    border: "border-red-200",
    badge: "bg-red-100 text-red-700",
  },
  warm: {
    label: "חמים",
    emoji: "🟡",
    color: "text-amber-700",
    bg: "bg-amber-50",
    border: "border-amber-200",
    badge: "bg-amber-100 text-amber-700",
  },
  cold: {
    label: "קר",
    emoji: "🧊",
    color: "text-slate-500",
    bg: "bg-slate-50",
    border: "border-slate-200",
    badge: "bg-slate-100 text-slate-500",
  },
} as const;
