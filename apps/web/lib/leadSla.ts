/**
 * Lead SLA / Response Time System
 *
 * Classifies how urgently a lead needs attention based on
 * time elapsed since creation AND current status.
 *
 * Only NEW leads (untouched) are measured against SLA.
 * Leads already CONTACTED/WON/LOST have met their SLA.
 *
 * Thresholds:
 *   GOOD     = 0–5 minutes   (green — still time to respond)
 *   WARNING  = 5–30 minutes  (amber — respond now)
 *   CRITICAL = 30+ minutes   (red — overdue)
 *   MET      = lead already handled (not NEW)
 */

export type SlaLevel = "good" | "warning" | "critical" | "met";

export interface SlaResult {
  label: string;          // Hebrew human-readable time
  level: SlaLevel;
  minutesSince: number;
}

// Thresholds in minutes — centralized for reuse
export const SLA_THRESHOLDS = {
  WARNING_MINUTES: 5,
  CRITICAL_MINUTES: 30,
} as const;

/**
 * Format elapsed time in Hebrew
 */
function formatTimeHe(mins: number): string {
  if (mins < 1) return "עכשיו";
  if (mins < 60) return `לפני ${mins} דק׳`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `לפני ${hrs} שעות`;
  const days = Math.floor(hrs / 24);
  if (days === 1) return "אתמול";
  if (days < 7) return `לפני ${days} ימים`;
  if (days < 30) return `לפני ${Math.floor(days / 7)} שבועות`;
  return new Date(Date.now() - mins * 60000).toLocaleDateString("he-IL");
}

/**
 * Compute SLA for a single lead
 */
export function getLeadSla(lead: {
  createdAt: string | Date;
  status: string;
}): SlaResult {
  const mins = Math.floor((Date.now() - new Date(lead.createdAt).getTime()) / 60000);
  const label = formatTimeHe(mins);

  // Already handled — SLA is met
  if (lead.status !== "NEW") {
    return { label, level: "met", minutesSince: mins };
  }

  // NEW lead — measure against SLA
  if (mins < SLA_THRESHOLDS.WARNING_MINUTES) {
    return { label, level: "good", minutesSince: mins };
  }
  if (mins < SLA_THRESHOLDS.CRITICAL_MINUTES) {
    return { label, level: "warning", minutesSince: mins };
  }
  return { label, level: "critical", minutesSince: mins };
}

// Visual config — used by UI components
export const SLA_CONFIG = {
  good: {
    color: "text-green-600",
    bg: "bg-green-50",
    border: "border-green-200",
    icon: "⚡",
  },
  warning: {
    color: "text-amber-600",
    bg: "bg-amber-50",
    border: "border-amber-200",
    icon: "⏳",
  },
  critical: {
    color: "text-red-600",
    bg: "bg-red-50",
    border: "border-red-200",
    icon: "🚨",
  },
  met: {
    color: "text-slate-400",
    bg: "",
    border: "",
    icon: "",
  },
} as const;
