/**
 * Source Insights — actionable signals about lead sources
 *
 * Takes lead counts grouped by source + status and returns
 * up to 3 short, action-oriented insights.
 *
 * Reuses getSourceLabel() for Hebrew display.
 */

import { getSourceLabel } from "./leadSource";

export interface SourceBreakdown {
  source: string;
  total: number;
  won: number;
  lost: number;
}

export interface SourceInsight {
  text: string;
  level: "positive" | "warning" | "info";
}

/**
 * Compute source insights from lead data grouped by source.
 */
export function computeSourceInsights(
  sources: SourceBreakdown[],
  totalLeads: number
): SourceInsight[] {
  if (totalLeads < 3 || sources.length === 0) return [];

  const insights: SourceInsight[] = [];
  const sorted = [...sources].sort((a, b) => b.total - a.total);
  const top = sorted[0];
  const topLabel = getSourceLabel(top.source);

  // Rule 1: Identify top source
  if (top && top.total >= 2) {
    const pct = Math.round((top.total / totalLeads) * 100);
    insights.push({
      text: `רוב הלידים (${pct}%) מגיעים מ${topLabel} — זה המקור החזק שלך`,
      level: "positive",
    });
  }

  // Rule 2: Best converting source (if different from top)
  const withConversion = sources.filter((s) => s.total >= 2 && s.won > 0);
  if (withConversion.length > 0) {
    const best = withConversion.sort((a, b) => (b.won / b.total) - (a.won / a.total))[0];
    const bestRate = Math.round((best.won / best.total) * 100);
    const bestLabel = getSourceLabel(best.source);
    if (best.source !== top.source && insights.length < 3) {
      insights.push({
        text: `${bestLabel} מביא פחות לידים אבל סוגר טוב יותר (${bestRate}% המרה)`,
        level: "info",
      });
    }
  }

  // Rule 3: Source with high loss rate
  const highLoss = sources.filter((s) => s.total >= 3 && s.lost > s.won && s.lost >= 2);
  if (highLoss.length > 0 && insights.length < 3) {
    const worst = highLoss.sort((a, b) => (b.lost / b.total) - (a.lost / a.total))[0];
    const worstLabel = getSourceLabel(worst.source);
    insights.push({
      text: `${worstLabel} מביא לידים אבל רובם אבודים — בדוק את איכות התנועה`,
      level: "warning",
    });
  }

  // Rule 4: Top source declining (if second source is catching up)
  if (sorted.length >= 2 && insights.length < 3) {
    const second = sorted[1];
    if (second.total >= top.total * 0.7 && second.total >= 2) {
      const secondLabel = getSourceLabel(second.source);
      insights.push({
        text: `${secondLabel} מתקרב ל${topLabel} בכמות לידים — שקול לחזק את שניהם`,
        level: "info",
      });
    }
  }

  // Rule 5: Only one source (concentration risk)
  if (sources.length === 1 && top.total >= 5 && insights.length < 3) {
    insights.push({
      text: `כל הלידים מגיעים ממקור אחד — שקול לגוון עם מקור נוסף`,
      level: "warning",
    });
  }

  return insights.slice(0, 3);
}

// Visual config
export const SOURCE_INSIGHT_STYLES = {
  positive: { bg: "bg-green-50", border: "border-green-200", text: "text-green-800", icon: "✅" },
  warning:  { bg: "bg-amber-50", border: "border-amber-200", text: "text-amber-800", icon: "⚠️" },
  info:     { bg: "bg-blue-50",  border: "border-blue-200",  text: "text-blue-800",  icon: "💡" },
} as const;
