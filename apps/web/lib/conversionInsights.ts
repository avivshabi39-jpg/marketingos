/**
 * Conversion Insights — rule-based actionable signals
 *
 * Derives insights from existing lead data without additional DB queries.
 * Prioritized by action urgency: what should the user do RIGHT NOW.
 *
 * Returns up to 3 insights sorted by priority.
 */

export type InsightLevel = "critical" | "warning" | "opportunity" | "positive";

export interface ConversionInsight {
  text: string;
  level: InsightLevel;
  actionLabel?: string;
  actionHref?: string;
}

export interface InsightInput {
  totalLeads: number;
  newLeadsCount: number;        // status = NEW
  contactedCount: number;       // status = CONTACTED
  proposalCount: number;        // status = PROPOSAL
  wonLeads: number;             // status = WON
  lostCount: number;            // status = LOST
  conversionRate: number;       // wonLeads/totalLeads * 100
  leadsThisWeek: number;
  untreatedCriticalCount: number;  // NEW leads overdue (30+ min)
  slug: string;                 // for action links
}

export function computeConversionInsights(input: InsightInput): ConversionInsight[] {
  const insights: ConversionInsight[] = [];

  // Rule 1: CRITICAL — overdue untreated leads
  if (input.untreatedCriticalCount > 0) {
    insights.push({
      text: input.untreatedCriticalCount === 1
        ? "ליד אחד דחוף מחכה מעל 30 דקות — כל דקה מורידה סיכוי סגירה"
        : `${input.untreatedCriticalCount} לידים דחופים מחכים מעל 30 דקות — הגב עכשיו`,
      level: "critical",
      actionLabel: "טפל עכשיו",
      actionHref: `/client/${input.slug}/leads`,
    });
  }

  // Rule 2: WARNING — hot untreated leads (NEW but not yet critical)
  const untreatedNonCritical = input.newLeadsCount - input.untreatedCriticalCount;
  if (untreatedNonCritical > 0 && insights.length < 3) {
    insights.push({
      text: `${input.newLeadsCount} לידים חדשים ממתינים — תגובה מהירה מכפילה סיכוי סגירה`,
      level: "warning",
      actionLabel: "צפה בלידים",
      actionHref: `/client/${input.slug}/leads`,
    });
  }

  // Rule 3: WARNING — contacted but stuck (no progress to WON)
  if (input.contactedCount >= 3 && input.wonLeads === 0 && insights.length < 3) {
    insights.push({
      text: `${input.contactedCount} לידים בשלב מגע אבל אף אחד לא נסגר — שפר את תהליך המכירה`,
      level: "warning",
    });
  }

  // Rule 4: WARNING — proposals pending (close to conversion)
  if (input.proposalCount >= 2 && insights.length < 3) {
    insights.push({
      text: `${input.proposalCount} לידים בשלב הצעה — דחיפה אחת קטנה יכולה לסגור עסקה`,
      level: "opportunity",
    });
  }

  // Rule 5: WARNING — many lost leads
  if (input.lostCount >= 3 && input.lostCount > input.wonLeads && insights.length < 3) {
    insights.push({
      text: `${input.lostCount} לידים אבדו — בדוק את סיבות ההפסד ושפר את ההצעה`,
      level: "warning",
    });
  }

  // Rule 6: WARNING — low conversion rate with enough data
  if (input.totalLeads >= 10 && input.conversionRate < 5 && insights.length < 3) {
    insights.push({
      text: `אחוז ההמרה שלך (${input.conversionRate}%) נמוך — מעקב מהיר ושיפור הצעה יעזרו`,
      level: "warning",
    });
  }

  // Rule 7: OPPORTUNITY — new leads this week
  if (input.leadsThisWeek > 0 && input.newLeadsCount === 0 && insights.length < 3) {
    insights.push({
      text: `${input.leadsThisWeek} לידים חדשים השבוע — המשך לעקוב ולסגור`,
      level: "positive",
    });
  }

  // Rule 8: POSITIVE — good conversion
  if (input.conversionRate >= 15 && input.totalLeads >= 5 && insights.length < 3) {
    insights.push({
      text: `אחוז ההמרה שלך (${input.conversionRate}%) מצוין — המשך כך!`,
      level: "positive",
    });
  }

  return insights.slice(0, 3);
}

// Visual config
export const INSIGHT_LEVEL_STYLES = {
  critical:    { bg: "bg-red-50", border: "border-red-200", text: "text-red-800", icon: "🚨" },
  warning:     { bg: "bg-amber-50", border: "border-amber-200", text: "text-amber-800", icon: "⚠️" },
  opportunity: { bg: "bg-blue-50", border: "border-blue-200", text: "text-blue-800", icon: "💡" },
  positive:    { bg: "bg-green-50", border: "border-green-200", text: "text-green-800", icon: "✅" },
} as const;
