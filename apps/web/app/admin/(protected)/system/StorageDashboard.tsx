"use client";

import { useState, useEffect } from "react";

interface ClientStorage {
  id: string;
  name: string;
  storageKB: number;
  storageMB: number;
  counts: { leads: number; appointments: number; socialPosts: number; reports: number; campaignImages: number; broadcastLogs: number };
}

interface StorageData {
  clients: ClientStorage[];
  totals: { totalClients: number; totalStorageKB: number; totalStorageMB: number; usedPercent: number; neonFreeLimitMB: number; oldLeadsToClean: number };
  alerts: { level: string; message: string }[];
}

export function StorageDashboard() {
  const [data, setData] = useState<StorageData | null>(null);
  const [cleaning, setCleaning] = useState(false);
  const [cleanResult, setCleanResult] = useState("");
  const [daysOld, setDaysOld] = useState(90);

  useEffect(() => {
    fetch("/api/admin/storage").then((r) => r.json()).then(setData).catch(() => {});
  }, []);

  async function runCleanup(dryRun: boolean) {
    setCleaning(true);
    const res = await fetch("/api/admin/storage/cleanup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ daysOld, statuses: ["LOST"], dryRun }),
    });
    const result = (await res.json()) as { message: string };
    setCleanResult(result.message);
    setCleaning(false);
    if (!dryRun) fetch("/api/admin/storage").then((r) => r.json()).then(setData);
  }

  if (!data) return <div className="text-center py-8 text-gray-400 text-sm">טוען נתוני אחסון...</div>;

  const { totals, clients, alerts } = data;
  const barColor = totals.usedPercent > 80 ? "#ef4444" : totals.usedPercent > 50 ? "#f59e0b" : "#22c55e";

  return (
    <div className="space-y-5" dir="rtl">
      {/* Alerts */}
      {alerts.map((a, i) => (
        <div key={i} className={`rounded-xl px-4 py-3 text-sm font-medium ${a.level === "critical" ? "bg-red-50 border border-red-200 text-red-700" : a.level === "warning" ? "bg-amber-50 border border-amber-200 text-amber-800" : "bg-blue-50 border border-blue-200 text-blue-700"}`}>
          {a.message}
        </div>
      ))}

      {/* Usage overview */}
      <div className="bg-white rounded-2xl border border-gray-200 p-5">
        <h3 className="font-bold text-base mb-4">💾 סיכום אחסון</h3>
        <div className="flex justify-between text-sm mb-2">
          <span className="font-semibold">{totals.totalStorageMB} MB בשימוש</span>
          <span className="text-gray-500">מתוך {totals.neonFreeLimitMB} MB</span>
        </div>
        <div className="h-3 bg-gray-100 rounded-full overflow-hidden mb-1">
          <div className="h-full rounded-full transition-all duration-500" style={{ width: `${Math.min(totals.usedPercent, 100)}%`, background: barColor }} />
        </div>
        <p className="text-xs text-gray-400 text-left">{totals.usedPercent}%</p>

        <div className="grid grid-cols-3 gap-3 mt-4">
          {[
            { icon: "👥", label: "לקוחות", value: totals.totalClients },
            { icon: "💾", label: "נפח", value: `${totals.totalStorageMB} MB` },
            { icon: "🗑️", label: "לידים ישנים", value: totals.oldLeadsToClean },
          ].map((s) => (
            <div key={s.label} className="bg-gray-50 rounded-xl p-3 text-center">
              <div className="text-lg">{s.icon}</div>
              <div className="text-lg font-extrabold">{s.value}</div>
              <div className="text-[11px] text-gray-500">{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Revenue projection */}
      <div className="bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200 rounded-2xl p-5">
        <h3 className="font-bold text-base mb-3">📈 תחזית הכנסה</h3>
        <div className="flex gap-2 flex-wrap">
          {[5, 10, 20, 50].map((n) => (
            <div key={n} className="flex-1 min-w-[70px] bg-white rounded-lg p-2 text-center">
              <div className="text-[11px] text-gray-500">{n} לקוחות</div>
              <div className="text-sm font-extrabold text-green-700">₪{(n * 400).toLocaleString()}</div>
              <div className="text-[10px] text-gray-400">רווח: ₪{(n * 340).toLocaleString()}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Cleanup */}
      <div className="bg-white rounded-2xl border border-gray-200 p-5">
        <h3 className="font-bold text-base mb-1">🧹 ניקוי לידים ישנים</h3>
        <p className="text-xs text-gray-500 mb-3">מחק לידים לא-רלוונטיים כדי לפנות מקום</p>
        <div className="flex gap-2 mb-3 items-end">
          <div className="flex-1">
            <label className="text-[11px] font-semibold text-gray-600 block mb-1">ישנים מ:</label>
            <select value={daysOld} onChange={(e) => setDaysOld(Number(e.target.value))} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none">
              <option value={30}>30 יום</option>
              <option value={60}>60 יום</option>
              <option value={90}>90 יום</option>
              <option value={180}>6 חודשים</option>
            </select>
          </div>
          <button onClick={() => runCleanup(true)} disabled={cleaning} className="px-4 py-2 bg-gray-100 rounded-lg text-xs font-medium text-gray-700 disabled:opacity-50">
            {cleaning ? "..." : "🔍 בדוק"}
          </button>
          <button onClick={() => { if (confirm("למחוק? לא ניתן לבטל!")) runCleanup(false); }} disabled={cleaning} className="px-4 py-2 bg-red-500 text-white rounded-lg text-xs font-bold disabled:opacity-50">
            🗑️ מחק
          </button>
        </div>
        {cleanResult && <div className="bg-green-50 border border-green-200 rounded-lg px-3 py-2 text-xs text-green-700 font-medium">{cleanResult}</div>}
      </div>

      {/* Per-client */}
      <div className="bg-white rounded-2xl border border-gray-200 p-5">
        <h3 className="font-bold text-base mb-3">👥 שימוש לפי לקוח</h3>
        <div className="space-y-2">
          {clients.map((c) => (
            <div key={c.id} className="bg-gray-50 rounded-xl p-3">
              <div className="flex justify-between items-center mb-1.5">
                <span className="font-semibold text-sm">{c.name}</span>
                <span className="text-xs text-gray-500">{c.storageKB} KB · {c.counts.leads} לידים</span>
              </div>
              <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${Math.min((c.storageKB / (totals.totalStorageKB || 1)) * 100, 100)}%` }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
