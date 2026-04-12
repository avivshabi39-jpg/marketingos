"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { type ConversionInsight, INSIGHT_LEVEL_STYLES } from "@/lib/conversionInsights";

interface Props {
  insights: ConversionInsight[];
}

export function ConversionInsightsBlock({ insights }: Props) {
  if (insights.length === 0) return null;

  return (
    <div className="space-y-2">
      <p className="text-xs font-semibold text-slate-500 px-1">📊 תובנות המרה</p>
      {insights.map((insight, i) => {
        const style = INSIGHT_LEVEL_STYLES[insight.level];
        return (
          <div
            key={i}
            className={`rounded-xl border px-4 py-2.5 flex items-center gap-2.5 ${style.bg} ${style.border}`}
          >
            <span className="text-sm flex-shrink-0">{style.icon}</span>
            <p className={`text-xs font-medium flex-1 leading-relaxed ${style.text}`}>
              {insight.text}
            </p>
            {insight.actionLabel && insight.actionHref && (
              <Link
                href={insight.actionHref}
                className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1.5 rounded-lg transition-colors flex-shrink-0 ${
                  insight.level === "critical"
                    ? "bg-red-600 text-white hover:bg-red-700"
                    : "bg-white/80 text-slate-700 hover:bg-white"
                }`}
              >
                {insight.actionLabel}
                <ArrowLeft size={10} />
              </Link>
            )}
          </div>
        );
      })}
    </div>
  );
}
