"use client";

import { useEffect, useState, useCallback } from "react";

interface N8nStatus {
  status: "online" | "offline";
  responseMs: number;
  error: string | null;
  url: string;
  checkedAt: string;
}

const WORKFLOWS = [
  { id: "new-lead", name: "ליד חדש", path: "new-lead", desc: "שולח WhatsApp פתיחה לליד חדש", icon: "👤" },
  { id: "lead-status", name: "שינוי סטטוס", path: "lead-status-change", desc: "הודעה מותאמת לפי סטטוס", icon: "🔄" },
  { id: "broadcast", name: "שידור המוני", path: "broadcast", desc: "מעבד כל ליד בנפרד עם השהייה", icon: "📢" },
  { id: "appointment", name: "תזכורת פגישה", path: "appointment-reminder", desc: "תזכורת 24 שעות + 1 שעה לפני", icon: "📅" },
];

export function N8nDashboard() {
  const [status, setStatus] = useState<N8nStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState<string | null>(null);

  const fetchStatus = useCallback(() => {
    setLoading(true);
    fetch("/api/n8n/health")
      .then((r) => (r.status === 401 ? null : r.json()))
      .then((d) => setStatus(d))
      .catch(() =>
        setStatus({ status: "offline", responseMs: 0, error: "Network error", url: "", checkedAt: new Date().toISOString() })
      )
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { fetchStatus(); }, [fetchStatus]);

  function copyUrl(path: string) {
    const base = status?.url && status.url !== "not configured" ? status.url : "https://your-n8n.up.railway.app";
    navigator.clipboard.writeText(`${base}/webhook/${path}`);
    setCopied(path);
    setTimeout(() => setCopied(null), 2000);
  }

  const isOnline = status?.status === "online";

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
      {/* Header */}
      <div className="flex justify-between items-center mb-4">
        <div>
          <h3 className="font-bold text-base text-slate-900 mb-0.5">⚡ n8n Automation Hub</h3>
          <p className="text-xs text-slate-500">4 workflows פעילים</p>
        </div>
        <div className="flex items-center gap-2">
          <span
            className="inline-block w-2.5 h-2.5 rounded-full"
            style={{ background: loading ? "#d1d5db" : isOnline ? "#22c55e" : "#ef4444" }}
          />
          <span className="text-xs font-semibold" style={{ color: isOnline ? "#16a34a" : "#dc2626" }}>
            {loading ? "..." : isOnline ? "Online" : "Offline"}
          </span>
          {!loading && status?.responseMs != null && status.responseMs > 0 && (
            <span className="text-[11px] text-slate-400">{status.responseMs}ms</span>
          )}
          <button
            onClick={fetchStatus}
            disabled={loading}
            className="text-xs text-slate-400 hover:text-blue-600 transition-colors disabled:opacity-50 ml-1"
          >
            {loading ? "⏳" : "🔄"}
          </button>
        </div>
      </div>

      {/* Error */}
      {!loading && !isOnline && status?.error && (
        <div className="bg-red-50 border border-red-200 rounded-lg px-3 py-2 text-xs text-red-600 mb-3">
          {status.error}
        </div>
      )}

      {/* URL */}
      {status?.url && status.url !== "not configured" && (
        <div className="bg-slate-50 rounded-lg px-3 py-2 text-[11px] text-slate-500 font-mono mb-3" dir="ltr">
          🌐 {status.url}
        </div>
      )}

      {/* Workflows */}
      <div className="space-y-2">
        {WORKFLOWS.map((wf) => (
          <div key={wf.id} className="border border-slate-100 rounded-lg px-3 py-2.5 flex items-center justify-between gap-3">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5 mb-0.5">
                <span className="text-sm">{wf.icon}</span>
                <span className="font-semibold text-xs text-slate-900">{wf.name}</span>
              </div>
              <p className="text-[11px] text-slate-500 truncate">{wf.desc}</p>
              <p className="text-[10px] text-slate-300 font-mono mt-0.5" dir="ltr">/webhook/{wf.path}</p>
            </div>
            <button
              onClick={() => copyUrl(wf.path)}
              className="text-[11px] font-semibold px-2.5 py-1.5 rounded-md transition-all flex-shrink-0"
              style={{
                background: copied === wf.path ? "#dcfce7" : "#f3f4f6",
                color: copied === wf.path ? "#16a34a" : "#374151",
              }}
            >
              {copied === wf.path ? "✅" : "📋 העתק"}
            </button>
          </div>
        ))}
      </div>

      {/* Last checked */}
      {status?.checkedAt && (
        <p className="text-[10px] text-slate-300 mt-3">
          נבדק: {new Date(status.checkedAt).toLocaleTimeString("he-IL")}
        </p>
      )}
    </div>
  );
}
