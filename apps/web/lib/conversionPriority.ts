/**
 * Conversion Priority Engine — deterministic lead urgency scoring
 *
 * No AI. Pure rules based on status, age, heat, source, and activity signals.
 * Returns a priority level + Hebrew reason string.
 */

import { classifyLeadHeat, type LeadHeatInput } from "./leadHeat";

export type PriorityLevel = "urgent" | "high" | "normal";

export interface LeadPriority {
  level: PriorityLevel;
  reason: string;
}

export interface PriorityInput extends LeadHeatInput {
  status: string;
  source: string | null;
  autoReplied: boolean;
  metadata: Record<string, unknown> | null;
}

const HIGH_VALUE_SOURCES = ["facebook", "google", "instagram"];

export function getLeadPriority(lead: PriorityInput): LeadPriority {
  const mins = Math.floor((Date.now() - new Date(lead.createdAt).getTime()) / 60000);
  const heat = classifyLeadHeat(lead);
  const isNew = lead.status === "NEW";
  const hasBeenContacted = lead.status !== "NEW";
  const isPaused = lead.metadata?.followUpPaused === true;

  // ── URGENT rules ──

  // Fresh NEW lead under 10 minutes with no auto-reply yet
  if (isNew && mins < 10 && !lead.autoReplied) {
    return { level: "urgent", reason: "ליד חדש לפני דקות — הגב מיד" };
  }

  // HOT lead still NEW (no contact at all)
  if (isNew && heat === "hot") {
    return { level: "urgent", reason: "ליד חם שלא טופל — סיכוי סגירה גבוה" };
  }

  // NEW lead under 10 minutes (even with auto-reply — still urgent)
  if (isNew && mins < 10) {
    return { level: "urgent", reason: "ליד חדש — תגובה מהירה מכפילה סגירה" };
  }

  // ── HIGH rules ──

  // NEW lead over 1 hour with no follow-up
  if (isNew && mins > 60 && !isPaused) {
    return { level: "high", reason: "ליד ממתין מעל שעה — הגב לפני שיתקרר" };
  }

  // WARM lead from high-value source still NEW
  if (isNew && heat === "warm" && lead.source && HIGH_VALUE_SOURCES.includes(lead.source.toLowerCase())) {
    return { level: "high", reason: "ליד ממקור איכותי — כדאי לטפל מהר" };
  }

  // NEW lead with phone but no auto-reply sent
  if (isNew && lead.phone && !lead.autoReplied) {
    return { level: "high", reason: "ליד עם טלפון בלי מענה אוטומטי" };
  }

  // ── NORMAL ──

  return { level: "normal", reason: "" };
}

// Visual config
export const PRIORITY_STYLES = {
  urgent: { badge: "bg-red-100 text-red-700", label: "🔥 לטפל עכשיו" },
  high:   { badge: "bg-amber-100 text-amber-700", label: "⚡ עדיפות גבוהה" },
  normal: { badge: "", label: "" },
} as const;
