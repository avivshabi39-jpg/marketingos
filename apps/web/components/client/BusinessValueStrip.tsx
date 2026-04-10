"use client";

import { Users, UserCheck, Trophy, TrendingUp, AlertTriangle } from "lucide-react";

interface Props {
  totalLeads: number;
  leadsThisWeek: number;
  contactedCount: number;
  wonLeads: number;
  conversionRate: number;
  newLeadsCount: number;
  pipelineValue: number;
}

// Rule-based insight — one clear sentence about business state
function getInsight(p: Props): { text: string; type: "success" | "warning" | "urgent" | "neutral" } {
  // Urgent: new leads waiting for contact
  if (p.newLeadsCount >= 3) {
    return {
      text: `יש לך ${p.newLeadsCount} לידים חדשים שמחכים למענה — תגיב מהר כדי לסגור עסקאות`,
      type: "urgent",
    };
  }

  // Warning: contacted but no wins
  if (p.contactedCount > 5 && p.wonLeads === 0) {
    return {
      text: `${p.contactedCount} לידים בשלב מגע אבל אף אחד לא נסגר — שפר את תהליך המכירה`,
      type: "warning",
    };
  }

  // Warning: no leads this week
  if (p.leadsThisWeek === 0 && p.totalLeads > 0) {
    return {
      text: "לא הגיעו לידים חדשים השבוע — שקול לשתף את הדף או להריץ קמפיין",
      type: "warning",
    };
  }

  // Warning: low conversion
  if (p.totalLeads >= 10 && p.conversionRate < 5) {
    return {
      text: `אחוז ההמרה שלך (${p.conversionRate}%) נמוך — שפר מעקב ותגובה מהירה`,
      type: "warning",
    };
  }

  // Success: new leads coming in
  if (p.leadsThisWeek > 0) {
    return {
      text: `הגיעו ${p.leadsThisWeek} לידים חדשים השבוע — המשך לעקוב ולסגור`,
      type: "success",
    };
  }

  // Neutral: no leads yet
  if (p.totalLeads === 0) {
    return {
      text: "עדיין לא הגיעו לידים — שתף את דף הנחיתה שלך כדי להתחיל",
      type: "neutral",
    };
  }

  return {
    text: `${p.totalLeads} לידים במערכת, ${p.wonLeads} נסגרו — המשך לעבוד`,
    type: "neutral",
  };
}

const INSIGHT_STYLES = {
  urgent:  "bg-red-50 border-red-200 text-red-800",
  warning: "bg-amber-50 border-amber-200 text-amber-800",
  success: "bg-green-50 border-green-200 text-green-800",
  neutral: "bg-slate-50 border-slate-200 text-slate-700",
};

const INSIGHT_ICONS = {
  urgent:  "🔥",
  warning: "⚠️",
  success: "✅",
  neutral: "💡",
};

export function BusinessValueStrip(props: Props) {
  const insight = getInsight(props);

  const metrics = [
    { label: "לידים", value: props.totalLeads, icon: Users, color: "text-blue-600" },
    { label: "השבוע", value: props.leadsThisWeek, icon: TrendingUp, color: "text-blue-600" },
    { label: "נוצר קשר", value: props.contactedCount, icon: UserCheck, color: "text-amber-600" },
    { label: "נסגרו", value: props.wonLeads, icon: Trophy, color: "text-green-600" },
    { label: "המרה", value: `${props.conversionRate}%`, icon: TrendingUp, color: props.conversionRate >= 10 ? "text-green-600" : props.conversionRate >= 5 ? "text-amber-600" : "text-red-500" },
  ];

  return (
    <div className="space-y-3">
      {/* Metrics strip */}
      <div className="grid grid-cols-5 gap-2">
        {metrics.map((m) => {
          const Icon = m.icon;
          return (
            <div key={m.label} className="bg-white rounded-xl border border-slate-100 shadow-sm px-3 py-3 text-center">
              <div className="flex items-center justify-center gap-1.5 mb-1">
                <Icon size={13} className={`${m.color} flex-shrink-0`} />
                <span className="text-lg font-bold text-slate-900">{m.value}</span>
              </div>
              <p className="text-[10px] text-slate-500 font-medium">{m.label}</p>
            </div>
          );
        })}
      </div>

      {/* Insight line */}
      <div className={`rounded-xl border px-4 py-3 flex items-center gap-2.5 ${INSIGHT_STYLES[insight.type]}`}>
        <span className="text-sm flex-shrink-0">{INSIGHT_ICONS[insight.type]}</span>
        <p className="text-xs font-medium leading-relaxed">{insight.text}</p>
      </div>
    </div>
  );
}
