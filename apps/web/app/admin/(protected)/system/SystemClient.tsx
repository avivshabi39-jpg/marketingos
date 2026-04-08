"use client";

import { useState, useEffect } from "react";

interface HealthData {
  status: string;
  checks: Record<string, { status: string; message: string; latencyMs?: number }>;
  stats: { totalUsers: number; totalClients: number; totalLeads: number; todayLeads: number; totalAppointments: number; totalReports: number };
  monthlyData: { month: string; leads: number }[];
  timestamp: string;
}

const SERVICE_LABELS: Record<string, string> = {
  database: "🗄️ מסד נתונים (Neon)",
  ai: "🤖 Claude AI",
  whatsapp: "💬 WhatsApp (Green API)",
  email: "📧 מייל (Resend)",
  cloudinary: "🖼️ תמונות (Cloudinary)",
  push: "🔔 התראות Push",
};

const STATUS_STYLES: Record<string, { bg: string; border: string; text: string; dot: string }> = {
  ok: { bg: "#f0fdf4", border: "#bbf7d0", text: "#166534", dot: "#22c55e" },
  warning: { bg: "#fffbeb", border: "#fde68a", text: "#92400e", dot: "#f59e0b" },
  error: { bg: "#fef2f2", border: "#fecaca", text: "#dc2626", dot: "#ef4444" },
};

export function SystemClient() {
  const [health, setHealth] = useState<HealthData | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  async function load() {
    setRefreshing(true);
    try {
      const res = await fetch("/api/system/health");
      setHealth(await res.json());
    } catch { /* ignore */ }
    setRefreshing(false);
  }

  useEffect(() => { load(); const t = setInterval(load, 60000); return () => clearInterval(t); }, []);

  if (!health) return <div className="text-center py-12 text-slate-400">⚙️ טוען...</div>;

  const maxLeads = Math.max(...health.monthlyData.map((d) => d.leads), 1);

  return (
    <div className="space-y-5" dir="rtl">
      {/* Overall banner */}
      <div className="rounded-2xl px-5 py-4 text-white flex items-center justify-between" style={{ background: health.status === "ok" ? "linear-gradient(135deg,#22c55e,#16a34a)" : health.status === "warning" ? "linear-gradient(135deg,#f59e0b,#d97706)" : "linear-gradient(135deg,#ef4444,#dc2626)" }}>
        <div className="flex items-center gap-3">
          <span className="text-3xl">{health.status === "ok" ? "✅" : health.status === "warning" ? "⚠️" : "❌"}</span>
          <div>
            <p className="font-extrabold text-base">{health.status === "ok" ? "כל המערכות פועלות תקין" : health.status === "warning" ? "יש אזהרות" : "יש תקלות"}</p>
            <p className="text-xs opacity-80">עדכון: {new Date(health.timestamp).toLocaleTimeString("he-IL")}</p>
          </div>
        </div>
        <button onClick={load} disabled={refreshing} className="px-4 py-2 bg-white/20 border border-white/30 rounded-lg text-xs font-semibold">
          {refreshing ? "⏳" : "🔄 רענן"}
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { l: "משתמשים", v: health.stats.totalUsers, i: "👤" },
          { l: "לקוחות", v: health.stats.totalClients, i: "👥" },
          { l: "לידים היום", v: health.stats.todayLeads, i: "🎯" },
          { l: 'לידים סה"כ', v: health.stats.totalLeads, i: "📊" },
          { l: "תורים", v: health.stats.totalAppointments, i: "📅" },
          { l: "דוחות", v: health.stats.totalReports, i: "📋" },
        ].map((s) => (
          <div key={s.l} className="bg-white rounded-xl border border-slate-200 p-4 flex items-center gap-3">
            <span className="text-2xl">{s.i}</span>
            <div><div className="text-xl font-extrabold">{s.v}</div><div className="text-xs text-slate-500">{s.l}</div></div>
          </div>
        ))}
      </div>

      {/* Services */}
      <div className="bg-white rounded-xl border border-slate-200 p-5">
        <p className="font-bold text-base mb-3">🔌 סטטוס שירותים</p>
        <div className="grid grid-cols-2 gap-2.5">
          {Object.entries(health.checks).map(([key, check]) => {
            const st = STATUS_STYLES[check.status] ?? STATUS_STYLES.ok;
            return (
              <div key={key} className="rounded-lg px-3.5 py-3 flex items-center justify-between" style={{ background: st.bg, border: `1px solid ${st.border}` }}>
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ background: st.dot, boxShadow: check.status === "ok" ? `0 0 6px ${st.dot}` : "none" }} />
                  <span className="text-sm font-semibold text-slate-700">{SERVICE_LABELS[key] ?? key}</span>
                </div>
                <div className="text-left">
                  <span className="text-xs font-semibold" style={{ color: st.text }}>{check.message}</span>
                  {check.latencyMs != null && <div className="text-[10px] text-slate-400">{check.latencyMs}ms</div>}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Monthly graph */}
      <div className="bg-white rounded-xl border border-slate-200 p-5">
        <p className="font-bold text-base mb-4">📈 לידים — 6 חודשים אחרונים</p>
        <div className="flex items-end gap-2" style={{ height: "130px" }}>
          {health.monthlyData.map((d, i) => {
            const pct = maxLeads > 0 ? (d.leads / maxLeads) * 100 : 0;
            const isLast = i === health.monthlyData.length - 1;
            return (
              <div key={d.month} className="flex-1 flex flex-col items-center gap-1">
                <span className={`text-xs font-bold ${isLast ? "text-blue-600" : "text-slate-400"}`}>{d.leads}</span>
                <div className="w-full rounded-t-md" style={{ height: `${Math.max(pct, 4)}%`, minHeight: "6px", background: isLast ? "linear-gradient(135deg,#6366f1,#8b5cf6)" : "#e5e7eb", transition: "height 0.5s" }} />
                <span className="text-[10px] text-slate-400">{d.month.slice(0, 3)}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
