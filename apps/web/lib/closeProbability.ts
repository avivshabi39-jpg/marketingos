/**
 * Close Probability + Suggested Actions — per-lead conversion estimate
 *
 * Deterministic scoring. No AI.
 * Returns probability (0-100), Hebrew suggestion, and recommended action type.
 */

import { classifyLeadHeat, type LeadHeatInput } from "./leadHeat";

export type SuggestedAction = "whatsapp" | "call" | "followup" | "wait";

export interface CloseInsight {
  probability: number;
  suggestion: string;
  action: SuggestedAction;
}

export interface CloseInput extends LeadHeatInput {
  status: string;
  source: string | null;
  autoReplied: boolean;
  metadata: Record<string, unknown> | null;
}

export function getCloseInsight(lead: CloseInput): CloseInsight {
  const heat = classifyLeadHeat(lead);
  const mins = Math.floor((Date.now() - new Date(lead.createdAt).getTime()) / 60000);
  const isNew = lead.status === "NEW";
  const isContacted = lead.status === "CONTACTED";
  const hasPhone = Boolean(lead.phone && lead.phone.trim().length > 3);
  const src = (lead.source ?? "").toLowerCase();
  const hasLostReason = Boolean(lead.metadata?.lostReason);

  // ── Probability scoring ──
  let prob = 40;

  if (heat === "hot") prob += 20;
  if (heat === "cold") prob -= 10;
  if (src.includes("google")) prob += 15;
  else if (src.includes("facebook") || src.includes("instagram")) prob += 10;
  if (lead.autoReplied && mins < 5) prob += 10;
  if (hasPhone) prob += 5;
  if (isNew && mins > 120) prob -= 20;
  if (hasLostReason) prob -= 15;

  prob = Math.max(5, Math.min(95, prob));

  // ── Suggestion + action ──
  let suggestion: string;
  let action: SuggestedAction;

  if (prob > 70) {
    suggestion = "שלח הצעת מחיר עכשיו";
    action = hasPhone ? "call" : "whatsapp";
  } else if (heat === "hot" && isNew) {
    suggestion = "התקשר עכשיו — הליד חם";
    action = "call";
  } else if (isNew && !lead.autoReplied) {
    suggestion = "שלח הודעת פתיחה";
    action = "whatsapp";
  } else if (isContacted) {
    suggestion = "שלח מעקב";
    action = "followup";
  } else if (isNew) {
    suggestion = "צור קשר ראשוני";
    action = "whatsapp";
  } else {
    suggestion = "המתן";
    action = "wait";
  }

  return { probability: prob, suggestion, action };
}

// Visual config
export const PROB_STYLES = {
  high:   { color: "text-green-700", bg: "bg-green-50", border: "border-green-200" },
  medium: { color: "text-amber-700", bg: "bg-amber-50", border: "border-amber-200" },
  low:    { color: "text-red-600",   bg: "bg-red-50",   border: "border-red-200" },
} as const;

export function getProbStyle(prob: number) {
  if (prob > 70) return PROB_STYLES.high;
  if (prob >= 40) return PROB_STYLES.medium;
  return PROB_STYLES.low;
}
