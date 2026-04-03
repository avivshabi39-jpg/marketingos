"use client";

import { useState, useEffect } from "react";
import { FlaskConical, Trophy, Loader2 } from "lucide-react";
import toast from "react-hot-toast";

type AbResults = {
  abTestEnabled: boolean;
  A: { views: number; submits: number; conversion: string };
  B: { views: number; submits: number; conversion: string };
  winner: "A" | "B" | null;
};

export function AbTestResults({ clientId }: { clientId: string }) {
  const [results, setResults] = useState<AbResults | null>(null);
  const [loading, setLoading] = useState(true);
  const [selecting, setSelecting] = useState(false);

  useEffect(() => {
    fetch(`/api/clients/${clientId}/ab-results`)
      .then((r) => r.ok ? r.json() : null)
      .then((d: AbResults | null) => setResults(d))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [clientId]);

  async function selectWinner(winner: "A" | "B") {
    setSelecting(true);
    try {
      const res = await fetch(`/api/clients/${clientId}/ab-winner`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ winner }),
      });
      if (!res.ok) throw new Error();
      toast.success(`גרסה ${winner} נבחרה כמנצחת ופורסמה!`);
      setResults((r) => r ? { ...r, abTestEnabled: false } : r);
    } catch {
      toast.error("שגיאה בבחירת מנצח");
    } finally {
      setSelecting(false);
    }
  }

  if (loading) return (
    <div className="flex items-center gap-2 text-sm text-gray-400 py-4">
      <Loader2 size={14} className="animate-spin" /> טוען תוצאות A/B...
    </div>
  );

  if (!results?.abTestEnabled) return null;

  const totalViews = results.A.views + results.B.views;
  if (totalViews === 0) {
    return (
      <div className="bg-purple-50 border border-purple-100 rounded-xl p-4 mt-4">
        <div className="flex items-center gap-2 mb-1">
          <FlaskConical size={16} className="text-purple-600" />
          <span className="text-sm font-semibold text-purple-800">A/B Testing פעיל</span>
        </div>
        <p className="text-xs text-purple-600">אין עדיין נתונים — ממתין למבקרים</p>
      </div>
    );
  }

  return (
    <div className="bg-purple-50 border border-purple-100 rounded-xl p-5 mt-4 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FlaskConical size={16} className="text-purple-600" />
          <span className="text-sm font-semibold text-purple-800">תוצאות A/B Testing</span>
        </div>
        <span className="text-xs text-purple-500">{totalViews} צפיות סה"כ</span>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {(["A", "B"] as const).map((v) => {
          const r = results[v];
          const isWinner = results.winner === v;
          return (
            <div key={v} className={`bg-white rounded-xl p-4 border-2 transition-all ${isWinner ? "border-green-400" : "border-gray-100"}`}>
              <div className="flex items-center justify-between mb-3">
                <span className="font-bold text-gray-800">גרסה {v}</span>
                {isWinner && <Trophy size={14} className="text-green-500" />}
              </div>
              <div className="space-y-1.5 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">צפיות</span>
                  <span className="font-medium">{r.views}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">הגשות</span>
                  <span className="font-medium">{r.submits}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">המרה</span>
                  <span className={`font-bold ${isWinner ? "text-green-600" : "text-gray-700"}`}>{r.conversion}%</span>
                </div>
              </div>
              <button
                onClick={() => selectWinner(v)}
                disabled={selecting}
                className="mt-3 w-full text-xs py-1.5 rounded-lg font-medium bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white transition"
              >
                {selecting ? "..." : `בחר גרסה ${v} כמנצחת`}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
