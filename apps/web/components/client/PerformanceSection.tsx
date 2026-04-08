"use client";

import { useState, useEffect } from "react";
import { TrendingUp, TrendingDown, Minus, Wand2, Loader2 } from "lucide-react";

type Performance = {
  pageViews: { today: number; week: number; month: number };
  leads:     { today: number; week: number; month: number };
  conversionRate: number;
  topSource: string;
  trend: "up" | "down" | "stable";
  sparkline: number[];
};

type Recommendation = {
  title: string;
  description: string;
  action: string;
  priority: "high" | "medium" | "low";
};

const PRIORITY_CONFIG = {
  high:   { label: "🔴 דחוף",  bg: "bg-red-50 border-red-100",     badge: "bg-red-100 text-red-700" },
  medium: { label: "🟡 חשוב",  bg: "bg-yellow-50 border-yellow-100", badge: "bg-yellow-100 text-yellow-700" },
  low:    { label: "🟢 רעיון", bg: "bg-green-50 border-green-100",  badge: "bg-green-100 text-green-700" },
};

function Sparkline({ data }: { data: number[] }) {
  const max = Math.max(...data, 1);
  return (
    <div className="flex items-end gap-0.5 h-8">
      {data.map((v, i) => (
        <div
          key={i}
          className="flex-1 bg-blue-200 rounded-sm min-h-[2px] transition-all"
          style={{ height: `${Math.max(2, (v / max) * 32)}px` }}
        />
      ))}
    </div>
  );
}

interface Props {
  slug: string;
  onOpenAiAgent?: (message: string) => void;
}

export function PerformanceSection({ slug, onOpenAiAgent }: Props) {
  const [perf, setPerf]     = useState<Performance | null>(null);
  const [recs, setRecs]     = useState<Recommendation[]>([]);
  const [loadingPerf, setLoadingPerf] = useState(true);
  const [loadingRecs, setLoadingRecs] = useState(false);

  useEffect(() => {
    fetch(`/api/portal/${slug}/performance`)
      .then((r) => r.ok ? r.json() : null)
      .then((d: Performance | null) => { if (d) setPerf(d); })
      .catch(() => {})
      .finally(() => setLoadingPerf(false));
  }, [slug]);

  useEffect(() => {
    if (!perf) return;
    setLoadingRecs(true);
    fetch(`/api/portal/${slug}/ai-recommendations`)
      .then((r) => r.ok ? r.json() : null)
      .then((d: { recommendations?: Recommendation[] } | null) => {
        if (d?.recommendations?.length) setRecs(d.recommendations);
      })
      .catch(() => {})
      .finally(() => setLoadingRecs(false));
  }, [slug, perf]);

  const TrendIcon = perf?.trend === "up" ? TrendingUp : perf?.trend === "down" ? TrendingDown : Minus;
  const trendColor = perf?.trend === "up" ? "text-green-600" : perf?.trend === "down" ? "text-red-500" : "text-slate-400";

  const stats = perf ? [
    { label: "לידים היום",    value: perf.leads.today,    sub: `${perf.leads.week} השבוע` },
    { label: "לידים החודש",   value: perf.leads.month,    sub: `המרה ${perf.conversionRate}%` },
    { label: "צפיות השבוע",   value: perf.pageViews.week, sub: `${perf.pageViews.today} היום` },
    { label: "מקור מוביל",    value: perf.topSource,      sub: "מקור לידים" },
  ] : [];

  return (
    <div className="space-y-5">
      {/* Performance header */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-semibold text-slate-900">ביצועי הדף שלך השבוע</h2>
          {perf && (
            <div className={`flex items-center gap-1 text-sm font-medium ${trendColor}`}>
              <TrendIcon size={16} />
              {perf.trend === "up" ? "עלייה" : perf.trend === "down" ? "ירידה" : "יציב"}
            </div>
          )}
        </div>

        {loadingPerf ? (
          <div className="flex justify-center py-8">
            <Loader2 size={24} className="animate-spin text-slate-300" />
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-5">
              {stats.map(({ label, value, sub }) => (
                <div key={label} className="bg-slate-50 rounded-xl p-4">
                  <p className="text-2xl font-bold text-slate-900">{value}</p>
                  <p className="text-xs font-medium text-slate-600 mt-0.5">{label}</p>
                  <p className="text-xs text-slate-400 mt-0.5">{sub}</p>
                </div>
              ))}
            </div>
            {perf?.sparkline && (
              <div>
                <p className="text-xs text-slate-400 mb-2">לידים 7 ימים אחרונים</p>
                <Sparkline data={perf.sparkline} />
              </div>
            )}
          </>
        )}
      </div>

      {/* AI Recommendations */}
      {(loadingRecs || recs.length > 0) && (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
              <Wand2 size={15} className="text-blue-600" />
            </div>
            <div>
              <h2 className="font-semibold text-slate-900">המלצות AI</h2>
              <p className="text-xs text-slate-400">מבוסס על ביצועי הדף שלך</p>
            </div>
            {loadingRecs && <Loader2 size={14} className="animate-spin text-slate-300 mr-auto" />}
          </div>

          <div className="space-y-3">
            {recs.map((rec, i) => {
              const cfg = PRIORITY_CONFIG[rec.priority] ?? PRIORITY_CONFIG.low;
              return (
                <div key={i} className={`rounded-xl border p-4 ${cfg.bg}`}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${cfg.badge}`}>
                          {cfg.label}
                        </span>
                        <p className="font-semibold text-slate-900 text-sm">{rec.title}</p>
                      </div>
                      <p className="text-sm text-slate-600 leading-relaxed">{rec.description}</p>
                    </div>
                    {onOpenAiAgent && (
                      <button
                        onClick={() => onOpenAiAgent(rec.action)}
                        className="flex-shrink-0 flex items-center gap-1 text-xs font-medium text-blue-600 hover:text-blue-800 border border-blue-200 hover:border-blue-400 rounded-lg px-2.5 py-1.5 transition whitespace-nowrap"
                      >
                        <Wand2 size={11} />
                        בצע עם AI
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
