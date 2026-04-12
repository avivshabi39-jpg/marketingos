/**
 * Untreated Leads Logic
 *
 * Computes counts and urgency for leads that haven't been handled.
 * Reuses SLA thresholds from leadSla.ts — no duplicated constants.
 */

import { SLA_THRESHOLDS } from "./leadSla";

export interface UntreatedStats {
  untreatedCount: number;       // total NEW leads
  criticalCount: number;        // NEW leads past CRITICAL threshold (30+ min)
  warningCount: number;         // NEW leads past WARNING threshold (5-30 min)
  goodCount: number;            // NEW leads within GOOD threshold (<5 min)
}

interface LeadInput {
  status: string;
  createdAt: string | Date;
}

/**
 * Compute untreated lead statistics from a list of leads.
 * Designed to work with any lead array that has status + createdAt.
 */
export function computeUntreatedStats(leads: LeadInput[]): UntreatedStats {
  let untreatedCount = 0;
  let criticalCount = 0;
  let warningCount = 0;
  let goodCount = 0;

  const now = Date.now();

  for (const lead of leads) {
    if (lead.status !== "NEW") continue;

    untreatedCount++;
    const mins = Math.floor((now - new Date(lead.createdAt).getTime()) / 60000);

    if (mins >= SLA_THRESHOLDS.CRITICAL_MINUTES) {
      criticalCount++;
    } else if (mins >= SLA_THRESHOLDS.WARNING_MINUTES) {
      warningCount++;
    } else {
      goodCount++;
    }
  }

  return { untreatedCount, criticalCount, warningCount, goodCount };
}

/**
 * Get a Hebrew alert message based on untreated stats.
 * Returns null if no alert is needed.
 */
export function getUntreatedAlertMessage(stats: UntreatedStats): {
  text: string;
  level: "critical" | "warning" | "info";
} | null {
  if (stats.untreatedCount === 0) return null;

  if (stats.criticalCount > 0) {
    return {
      text: stats.criticalCount === 1
        ? `ליד אחד ממתין למענה כבר יותר מ-30 דקות — הגב עכשיו!`
        : `${stats.criticalCount} לידים ממתינים למענה יותר מ-30 דקות — הגב עכשיו!`,
      level: "critical",
    };
  }

  if (stats.warningCount > 0) {
    return {
      text: `${stats.untreatedCount} לידים חדשים ממתינים למענה`,
      level: "warning",
    };
  }

  return {
    text: `${stats.untreatedCount} לידים חדשים הגיעו — עכשיו הזמן לטפל`,
    level: "info",
  };
}
