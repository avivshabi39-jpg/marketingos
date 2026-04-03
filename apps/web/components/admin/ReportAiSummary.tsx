"use client";

import { useState } from "react";
import { Sparkles, Loader2, ChevronDown } from "lucide-react";

interface Props {
  clientName: string;
  leads: number;
  conversions: number;
  topSource: string | null;
}

export function ReportAiSummary({ clientName, leads, conversions, topSource }: Props) {
  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState<string | null>(null);
  const [recommendations, setRecommendations] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState(false);

  async function handleGenerate() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/ai/weekly-report-summary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clientName, leads, conversions, topSource: topSource ?? "לא ידוע" }),
      });
      const data = await res.json() as {
        summary?: string;
        recommendations?: string[];
        error?: string;
      };
      if (!res.ok) {
        setError(data.error ?? "שגיאה ביצירת סיכום, נסה שוב");
        return;
      }
      setSummary(data.summary ?? null);
      setRecommendations(data.recommendations ?? []);
      setOpen(true);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mt-3 pt-3 border-t border-gray-100">
      {!summary ? (
        <div className="flex items-center gap-2">
          <button
            onClick={handleGenerate}
            disabled={loading}
            className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 rounded-lg transition-colors disabled:opacity-60"
          >
            {loading
              ? <><Loader2 size={11} className="animate-spin" /> מייצר סיכום...</>
              : <><Sparkles size={11} /> ✨ צור סיכום AI</>
            }
          </button>
          {error && <p className="text-xs text-red-500">{error}</p>}
        </div>
      ) : (
        <div>
          <button
            onClick={() => setOpen(o => !o)}
            className="flex items-center gap-1.5 text-xs font-medium text-indigo-600 hover:text-indigo-800"
          >
            <Sparkles size={11} />
            סיכום AI
            <ChevronDown size={11} className={`transition-transform ${open ? "rotate-180" : ""}`} />
          </button>
          {open && (
            <div className="mt-2 bg-indigo-50 rounded-xl p-4 space-y-3">
              <p className="text-sm text-gray-700">{summary}</p>
              {recommendations.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-indigo-700 mb-1.5">המלצות:</p>
                  <ul className="space-y-1">
                    {recommendations.map((r, i) => (
                      <li key={i} className="flex items-start gap-1.5 text-xs text-gray-600">
                        <span className="text-indigo-400 font-bold mt-0.5">{i + 1}.</span>
                        {r}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              <button
                onClick={handleGenerate}
                disabled={loading}
                className="text-xs text-indigo-400 hover:text-indigo-600 disabled:opacity-50"
              >
                {loading ? "מייצר..." : "↺ צור מחדש"}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
