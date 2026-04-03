"use client";

interface BillingActionsProps {
  plan: "BASIC" | "PRO" | "AGENCY";
  currentPlan: "BASIC" | "PRO" | "AGENCY";
  hasStripeSubscription: boolean;
  mode: "upgrade" | "portal" | "cancel";
}

const PLAN_LABELS: Record<string, string> = {
  BASIC: "ניסיון חינם",
  PRO: "Pro",
  AGENCY: 'נדל"ן Pro',
};

export function BillingActions({ plan, mode }: BillingActionsProps) {
  if (mode === "cancel") {
    return (
      <div className="flex items-center gap-3">
        <a
          href="https://wa.me/972501234567?text=אני+רוצה+לבטל+את+המנוי"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 px-4 py-2 border border-red-200 text-red-600 hover:bg-red-50 text-sm font-medium rounded-lg transition-colors"
        >
          בטל מנוי
        </a>
      </div>
    );
  }

  if (mode === "portal") {
    return (
      <div className="flex items-center gap-3">
        <a
          href="https://wa.me/972501234567?text=אני+רוצה+לנהל+את+המנוי+שלי"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 text-sm font-medium rounded-lg transition-colors"
        >
          נהל מנוי
        </a>
      </div>
    );
  }

  // Upgrade mode
  return (
    <div className="bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200 rounded-xl p-5 text-center">
      <div className="text-2xl mb-2">💳</div>
      <h4 className="font-semibold text-gray-900 text-sm mb-1">שדרג ל-{PLAN_LABELS[plan]}</h4>
      <p className="text-gray-500 text-xs mb-4">צור איתנו קשר ונשדרג אותך תוך דקות</p>
      <div className="flex gap-2 justify-center">
        <a
          href="https://wa.me/972501234567?text=אני+רוצה+לשדרג+לתוכנית+Pro"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 bg-green-600 hover:bg-green-500 text-white font-semibold rounded-lg px-4 py-2 text-xs transition-colors"
        >
          💬 וואצאפ
        </a>
        <a
          href="mailto:info@marketingos.co.il?subject=שדרוג תוכנית MarketingOS"
          className="inline-flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-lg px-4 py-2 text-xs transition-colors"
        >
          📧 מייל
        </a>
      </div>
    </div>
  );
}
