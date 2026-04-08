"use client";

import { useState } from "react";
import { X } from "lucide-react";

interface AiProactiveMessageProps {
  type: "no_page" | "no_leads" | "new_leads" | "performance_up" | null;
  newLeadsCount?: number;
  changePercent?: number;
  onBuildPage?: () => void;
  onViewLeads?: () => void;
}

export function AiProactiveMessage({
  type,
  newLeadsCount = 0,
  changePercent = 0,
  onBuildPage,
  onViewLeads,
}: AiProactiveMessageProps) {
  const [dismissed, setDismissed] = useState(false);

  if (!type || dismissed) return null;

  const configs = {
    no_page: {
      emoji: "🚀",
      message: "אין לך עדיין דף נחיתה. רוצה שה-AI יבנה לך אחד עכשיו?",
      actionLabel: "בנה דף עכשיו",
      onAction: onBuildPage,
      bg: "bg-blue-50 border-blue-200",
      textColor: "text-blue-800",
    },
    no_leads: {
      emoji: "💡",
      message: "לא הגיעו לידים השבוע. בוא נשפר את הדף יחד!",
      actionLabel: "שפר את הדף",
      onAction: onBuildPage,
      bg: "bg-amber-50 border-amber-200",
      textColor: "text-amber-800",
    },
    new_leads: {
      emoji: "🎉",
      message: `יש ${newLeadsCount} לידים חדשים שממתינים לך!`,
      actionLabel: "צפה בלידים",
      onAction: onViewLeads,
      bg: "bg-green-50 border-green-200",
      textColor: "text-green-800",
    },
    performance_up: {
      emoji: "🚀",
      message: `הדף שלך הביא ${changePercent}% יותר לידים השבוע! כל הכבוד!`,
      actionLabel: null,
      onAction: undefined,
      bg: "bg-green-50 border-green-200",
      textColor: "text-green-800",
    },
  };

  const config = configs[type];

  return (
    <div className={`flex items-start gap-3 rounded-2xl border px-5 py-4 ${config.bg}`}>
      <span className="text-xl flex-shrink-0 mt-0.5">{config.emoji}</span>
      <div className="flex-1">
        <p className={`text-sm font-medium ${config.textColor}`}>{config.message}</p>
        {config.actionLabel && config.onAction && (
          <button
            onClick={config.onAction}
            className="mt-2 text-xs font-semibold underline underline-offset-2 opacity-80 hover:opacity-100"
          >
            {config.actionLabel} →
          </button>
        )}
      </div>
      <button
        onClick={() => setDismissed(true)}
        className="text-slate-400 hover:text-slate-600 flex-shrink-0 mt-0.5"
        aria-label="סגור"
      >
        <X size={16} />
      </button>
    </div>
  );
}
