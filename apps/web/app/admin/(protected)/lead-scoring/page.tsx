"use client";

import { useState, useEffect, useCallback } from "react";
import { Flame, TrendingUp, Phone, Mail, Loader2, RefreshCw, Star, Clock, Tag } from "lucide-react";
import Link from "next/link";

type ScoredLead = {
  id: string;
  firstName: string;
  lastName: string;
  phone: string | null;
  email: string | null;
  source: string | null;
  leadScore: number;
  status: string;
  createdAt: string;
  clientId: string;
  client: { name: string; slug: string };
};

const STATUS_HE: Record<string, string> = {
  NEW: "חדש", CONTACTED: "נוצר קשר", QUALIFIED: "מוסמך",
  PROPOSAL: "הצעה", WON: "נסגר", LOST: "אבוד",
};

function ScoreBar({ score }: { score: number }) {
  const pct = Math.round((score / 10) * 100);
  const color = score >= 7 ? "bg-red-500" : score >= 4 ? "bg-amber-400" : "bg-gray-300";
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <span className={`text-xs font-bold w-5 text-right ${score >= 7 ? "text-red-600" : score >= 4 ? "text-amber-600" : "text-gray-400"}`}>
        {score}
      </span>
    </div>
  );
}

function HeatBadge({ score }: { score: number }) {
  if (score >= 7) return (
    <span className="inline-flex items-center gap-1 text-xs font-bold bg-red-100 text-red-600 px-2 py-0.5 rounded-full">
      <Flame size={10} /> חם
    </span>
  );
  if (score >= 4) return (
    <span className="inline-flex items-center gap-1 text-xs font-bold bg-amber-100 text-amber-600 px-2 py-0.5 rounded-full">
      <TrendingUp size={10} /> פושר
    </span>
  );
  return (
    <span className="inline-flex items-center gap-1 text-xs font-bold bg-blue-100 text-blue-500 px-2 py-0.5 rounded-full">
      <Star size={10} /> קר
    </span>
  );
}

export default function LeadScoringPage() {
  const [leads, setLeads] = useState<ScoredLead[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "hot" | "warm" | "cold">("all");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/leads?limit=100&orderBy=leadScore");
      if (res.ok) {
        const data = await res.json();
        setLeads(data.leads ?? []);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = leads
    .filter((l) => {
      if (filter === "hot") return l.leadScore >= 7;
      if (filter === "warm") return l.leadScore >= 4 && l.leadScore < 7;
      if (filter === "cold") return l.leadScore < 4;
      return true;
    })
    .sort((a, b) => b.leadScore - a.leadScore);

  const hot = leads.filter((l) => l.leadScore >= 7).length;
  const warm = leads.filter((l) => l.leadScore >= 4 && l.leadScore < 7).length;
  const cold = leads.filter((l) => l.leadScore < 4).length;
  const topFive = leads.slice().sort((a, b) => b.leadScore - a.leadScore).slice(0, 5);

  return (
    <div className="space-y-6" dir="rtl">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Flame size={22} className="text-red-500" /> ציון לידים
          </h1>
          <p className="text-sm text-gray-500 mt-1">דירוג לידים לפי חום — פוקוס על הלידים הכי שווים</p>
        </div>
        <button onClick={load} disabled={loading} className="flex items-center gap-1.5 text-sm text-gray-500 border border-gray-200 px-3 py-2 rounded-lg hover:bg-gray-50 transition">
          <RefreshCw size={14} className={loading ? "animate-spin" : ""} /> רענן
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "לידים חמים 🔴", count: hot, color: "bg-red-50 border-red-200 text-red-700", filter: "hot" as const },
          { label: "לידים פושרים 🟡", count: warm, color: "bg-amber-50 border-amber-200 text-amber-700", filter: "warm" as const },
          { label: "לידים קרים 🔵", count: cold, color: "bg-blue-50 border-blue-200 text-blue-500", filter: "cold" as const },
        ].map((s) => (
          <button
            key={s.filter}
            onClick={() => setFilter(filter === s.filter ? "all" : s.filter)}
            className={`rounded-xl border p-4 text-right transition-all ${s.color} ${filter === s.filter ? "ring-2 ring-offset-1 ring-indigo-400" : "hover:opacity-80"}`}
          >
            <p className="text-2xl font-bold">{s.count}</p>
            <p className="text-xs font-medium mt-0.5">{s.label}</p>
          </button>
        ))}
      </div>

      {/* Focus box */}
      {topFive.length > 0 && (
        <div className="bg-gradient-to-br from-red-50 to-orange-50 border border-red-100 rounded-xl p-5">
          <h3 className="font-semibold text-gray-900 text-sm mb-3 flex items-center gap-2">
            <Flame size={16} className="text-red-500" /> 5 לידים שצריך לטפל בהם עכשיו
          </h3>
          <div className="space-y-2">
            {topFive.map((l, i) => (
              <div key={l.id} className="flex items-center gap-3 bg-white rounded-lg px-3 py-2 shadow-sm">
                <span className="text-lg font-bold text-gray-300 w-5 flex-shrink-0">{i + 1}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{l.firstName} {l.lastName}</p>
                  <p className="text-xs text-gray-400 truncate">{l.client?.name} · {l.phone ?? l.email ?? "—"}</p>
                </div>
                <ScoreBar score={l.leadScore} />
                {l.phone && (
                  <a href={`tel:${l.phone}`} className="text-green-500 hover:text-green-700">
                    <Phone size={15} />
                  </a>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Main list */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-5 py-3 border-b border-gray-50 flex items-center gap-2 flex-wrap">
          <span className="text-sm font-medium text-gray-700">{filtered.length} לידים</span>
          {filter !== "all" && (
            <button onClick={() => setFilter("all")} className="text-xs text-indigo-500 hover:underline">
              הצג הכל
            </button>
          )}
        </div>
        {loading ? (
          <div className="flex justify-center py-16">
            <Loader2 size={24} className="animate-spin text-gray-300" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center py-12 text-gray-300">
            <Flame size={32} className="mb-2" />
            <p className="text-sm">אין לידים להצגה</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {filtered.map((l) => (
              <div key={l.id} className="px-5 py-3 flex items-center gap-4 hover:bg-gray-50 transition">
                <HeatBadge score={l.leadScore} />
                <div className="flex-1 min-w-0">
                  <Link href={`/admin/clients/${l.clientId}`} className="text-sm font-medium text-gray-900 hover:text-indigo-600">
                    {l.firstName} {l.lastName}
                  </Link>
                  <div className="flex items-center gap-3 mt-0.5">
                    {l.phone && (
                      <span className="flex items-center gap-1.5">
                        <span className="text-xs text-gray-400 flex items-center gap-1"><Phone size={10} />{l.phone}</span>
                        <a
                          href={`tel:${l.phone.replace(/[^0-9+]/g, "")}`}
                          onClick={(e) => e.stopPropagation()}
                          className="w-6 h-6 rounded-full bg-green-100 hover:bg-green-200 flex items-center justify-center text-xs transition-colors"
                          title="התקשר"
                        >
                          📞
                        </a>
                      </span>
                    )}
                    {l.email && <span className="text-xs text-gray-400 flex items-center gap-1"><Mail size={10} />{l.email}</span>}
                    {l.source && <span className="text-xs text-gray-400 flex items-center gap-1"><Tag size={10} />{l.source}</span>}
                  </div>
                </div>
                <div className="w-24 flex-shrink-0">
                  <ScoreBar score={l.leadScore} />
                </div>
                <span className="text-xs text-gray-400 hidden sm:block">
                  {STATUS_HE[l.status] ?? l.status}
                </span>
                <span className="text-xs text-gray-300 hidden sm:block flex items-center gap-1">
                  <Clock size={10} />{new Date(l.createdAt).toLocaleDateString("he-IL")}
                </span>
                <span className="text-xs text-gray-400 hidden md:block truncate max-w-24">{l.client?.name}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
