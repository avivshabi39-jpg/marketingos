"use client";

import { useState, useEffect } from "react";
import { Loader2, TrendingUp, Eye, Users, Percent, type LucideIcon } from "lucide-react";

type AnalyticsData = {
  totalViews: number;
  leadCount: number;
  conversionRate: number;
  byDay: Record<string, number>;
  bySource: Record<string, number>;
  leadsBySource: { source: string; count: number }[];
};

function StatCard({ label, value, icon: Icon, color }: { label: string; value: string | number; icon: LucideIcon; color: string }) {
  return (
    <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-5">
      <div className="flex items-center gap-3">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color}`}>
          <Icon size={18} />
        </div>
        <div>
          <p className="text-2xl font-bold text-slate-900">{value}</p>
          <p className="text-xs text-slate-500 mt-0.5">{label}</p>
        </div>
      </div>
    </div>
  );
}

export function ClientAnalyticsTab({ clientId }: { clientId: string }) {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [days, setDays] = useState(30);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/clients/${clientId}/analytics?days=${days}`)
      .then((r) => r.json())
      .then(setData)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [clientId, days]);

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 size={24} className="animate-spin text-slate-300" />
      </div>
    );
  }

  if (!data) return null;

  const dayEntries = Object.entries(data.byDay).sort(([a], [b]) => a.localeCompare(b));
  const maxViews = Math.max(...dayEntries.map(([, v]) => v), 1);

  const sourceEntries = Object.entries(data.bySource).sort(([, a], [, b]) => b - a);
  const maxSource = Math.max(...sourceEntries.map(([, v]) => v), 1);

  const SOURCE_LABELS: Record<string, string> = {
    facebook: "פייסבוק",
    google: "גוגל",
    whatsapp: "וואצאפ",
    direct: "ישיר",
    organic: "אורגני",
  };

  return (
    <div className="space-y-6" dir="rtl">
      {/* Range selector */}
      <div className="flex items-center gap-2">
        <span className="text-sm text-slate-500">תקופה:</span>
        {[7, 14, 30, 60, 90].map((d) => (
          <button
            key={d}
            onClick={() => setDays(d)}
            className={`px-3 py-1 text-sm rounded-lg border transition-all ${days === d ? "border-blue-500 bg-blue-50 text-blue-700 font-medium" : "border-slate-200 text-slate-500 hover:border-slate-300"}`}
          >
            {d} ימים
          </button>
        ))}
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="צפיות בדף" value={data.totalViews.toLocaleString()} icon={Eye} color="bg-blue-50 text-blue-600" />
        <StatCard label="לידים" value={data.leadCount.toLocaleString()} icon={Users} color="bg-green-50 text-green-600" />
        <StatCard label="המרה" value={`${data.conversionRate}%`} icon={Percent} color="bg-purple-50 text-purple-600" />
        <StatCard label="ממוצע יומי" value={dayEntries.length > 0 ? Math.round(data.totalViews / dayEntries.length) : 0} icon={TrendingUp} color="bg-amber-50 text-amber-600" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Bar chart */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-100 shadow-sm p-5">
          <h3 className="font-semibold text-slate-900 text-sm mb-4">צפיות לפי יום</h3>
          {dayEntries.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-slate-300">
              <Eye size={32} className="mb-2" />
              <p className="text-sm">אין נתוני צפיות עדיין</p>
            </div>
          ) : (
            <div className="flex items-end gap-1 h-32">
              {dayEntries.map(([day, count]) => (
                <div key={day} className="flex-1 flex flex-col items-center gap-1 group relative">
                  <div
                    className="w-full bg-blue-400 hover:bg-blue-500 rounded-t transition-all"
                    style={{ height: `${Math.max((count / maxViews) * 100, 4)}%` }}
                  />
                  <div className="absolute bottom-full mb-1 hidden group-hover:flex bg-slate-800 text-white text-xs px-2 py-1 rounded whitespace-nowrap">
                    {new Date(day).toLocaleDateString("he-IL", { day: "numeric", month: "short" })}: {count}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Sources */}
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-5">
          <h3 className="font-semibold text-slate-900 text-sm mb-4">מקורות תנועה</h3>
          {sourceEntries.length === 0 ? (
            <p className="text-sm text-slate-400 text-center py-8">אין נתונים</p>
          ) : (
            <div className="space-y-3">
              {sourceEntries.slice(0, 6).map(([src, count]) => (
                <div key={src}>
                  <div className="flex justify-between text-xs text-slate-600 mb-1">
                    <span>{SOURCE_LABELS[src] ?? src}</span>
                    <span className="font-medium">{count}</span>
                  </div>
                  <div className="h-1.5 bg-slate-100 rounded-full">
                    <div
                      className="h-full bg-blue-400 rounded-full"
                      style={{ width: `${(count / maxSource) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {data.totalViews === 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-800">
          💡 <strong>טיפ:</strong> כדי לראות נתוני צפיות, הוסף את קוד המעקב לדף הנחיתה שלך. הנתונים יצטברו כאשר מבקרים יגיעו לדף.
        </div>
      )}
    </div>
  );
}
