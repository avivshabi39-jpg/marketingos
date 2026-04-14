/**
 * Automation Status — determines which automations are active for a client
 *
 * Centralized logic so dashboard, settings, and AI can all show consistent status.
 * Each automation has: active | setup_needed | inactive
 */

export type AutomationState = "active" | "setup_needed" | "inactive";

export interface AutomationItem {
  key: string;
  label: string;
  description: string;
  state: AutomationState;
  setupHint?: string;    // shown when setup_needed
}

export interface AutomationInput {
  whatsappNumber: string | null;
  greenApiInstanceId: string | null;
  greenApiToken: string | null;
  autoReplyActive: boolean;
  pagePublished: boolean;
  n8nWebhookUrl: string | null;
}

export function computeAutomationStatus(input: AutomationInput): AutomationItem[] {
  const hasWhatsApp = Boolean(input.whatsappNumber && input.greenApiInstanceId && input.greenApiToken);

  return [
    {
      key: "auto_reply",
      label: "חזרה אוטומטית",
      description: "הודעת וואצאפ נשלחת אוטומטית לכל ליד חדש",
      state: hasWhatsApp && input.autoReplyActive
        ? "active"
        : hasWhatsApp
        ? "inactive"
        : "setup_needed",
      setupHint: !hasWhatsApp ? "חבר וואצאפ בהגדרות" : undefined,
    },
    {
      key: "followup",
      label: "מעקב אוטומטי",
      description: "תזכורת נשלחת אחרי יום ו-3 ימים ללידים שלא הגיבו",
      state: hasWhatsApp && input.autoReplyActive
        ? "active"
        : hasWhatsApp
        ? "inactive"
        : "setup_needed",
      setupHint: !hasWhatsApp
        ? "חבר וואצאפ בהגדרות"
        : !input.autoReplyActive
        ? "הפעל חזרה אוטומטית בעמוד הלידים"
        : undefined,
    },
    {
      key: "lead_tracking",
      label: "מעקב לידים",
      description: "כל ליד נרשם, מדורג ומקבל סטטוס אוטומטית",
      state: "active", // always active
    },
    {
      key: "page_tracking",
      label: "מעקב ביקורים",
      description: "צפיות בדף הנחיתה נמדדות אוטומטית",
      state: input.pagePublished ? "active" : "setup_needed",
      setupHint: !input.pagePublished ? "פרסם דף נחיתה" : undefined,
    },
    {
      key: "notifications",
      label: "התראות",
      description: "התראה בזמן אמת על כל ליד חדש ופעולה חשובה",
      state: "active", // always active
    },
  ];
}

// Visual config
export const AUTOMATION_STATE_STYLES = {
  active:       { dot: "bg-green-500", text: "text-green-700", bg: "bg-green-50", label: "פעיל" },
  setup_needed: { dot: "bg-amber-400", text: "text-amber-700", bg: "bg-amber-50", label: "דרוש הגדרה" },
  inactive:     { dot: "bg-slate-300", text: "text-slate-500", bg: "bg-slate-50", label: "כבוי" },
} as const;
