/**
 * Conversion Assistant — daily action summary for closing more deals
 *
 * Deterministic rules only. No AI.
 * Aggregates lead data into actionable counts + tips.
 */

import { getLeadPriority, type PriorityInput } from "./conversionPriority";
import { getCloseInsight, type CloseInput } from "./closeProbability";

export interface AssistantResult {
  urgentCount: number;
  highProbabilityCount: number;
  followupCount: number;
  tips: string[];
}

type LeadInput = PriorityInput & CloseInput;

export function getConversionAssistant(leads: LeadInput[]): AssistantResult {
  let urgentCount = 0;
  let highProbabilityCount = 0;
  let followupCount = 0;
  let facebookLeads = 0;

  for (const lead of leads) {
    const priority = getLeadPriority(lead);
    const insight = getCloseInsight(lead);

    if (priority.level === "urgent") urgentCount++;
    if (insight.probability > 70) highProbabilityCount++;
    if (lead.status === "CONTACTED") followupCount++;

    const src = (lead.source ?? "").toLowerCase();
    if (src.includes("facebook") || src.includes("fb")) facebookLeads++;
  }

  const tips: string[] = [];

  if (urgentCount > 0) {
    tips.push("ענה ללידים החדשים עכשיו — תגובה מהירה מכפילה סגירה");
  }

  if (highProbabilityCount > 0) {
    tips.push(`יש ${highProbabilityCount} לידים עם סיכוי גבוה לסגירה — תעדף אותם`);
  }

  if (followupCount > 0) {
    tips.push("שלח מעקב ללידים שכבר טופלו — תזכורת קטנה סוגרת עסקאות");
  }

  if (facebookLeads >= 3) {
    tips.push("לידים מפייסבוק נסגרים מהר — התקשר היום");
  }

  return { urgentCount, highProbabilityCount, followupCount, tips };
}
