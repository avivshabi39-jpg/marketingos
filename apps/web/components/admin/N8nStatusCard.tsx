"use client";

import { useState, useEffect, useCallback } from "react";

interface N8nStatus {
  status: "online" | "offline";
  responseMs: number;
  error: string | null;
  url: string;
  checkedAt: string;
}

export function N8nStatusCard() {
  const [data, setData] = useState<N8nStatus | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchStatus = useCallback(() => {
    setLoading(true);
    fetch("/api/n8n/health")
      .then((r) => (r.status === 401 ? null : r.json()))
      .then((d) => setData(d))
      .catch(() =>
        setData({
          status: "offline",
          responseMs: 0,
          error: "Network error",
          url: "",
          checkedAt: new Date().toISOString(),
        })
      )
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  const isOnline = data?.status === "online";

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span style={{ fontSize: "20px" }}>🔄</span>
          <span className="font-bold text-sm text-gray-900">n8n Automation</span>
        </div>
        <button
          onClick={fetchStatus}
          disabled={loading}
          className="text-xs text-gray-400 hover:text-indigo-600 transition-colors disabled:opacity-50"
        >
          {loading ? "⏳" : "🔄 רענן"}
        </button>
      </div>

      <div className="flex items-center gap-2 mb-2">
        <span
          className="inline-block w-2.5 h-2.5 rounded-full"
          style={{
            background: loading ? "#d1d5db" : isOnline ? "#22c55e" : "#ef4444",
          }}
        />
        <span
          className="text-xs font-semibold"
          style={{ color: isOnline ? "#166534" : "#dc2626" }}
        >
          {loading ? "בודק..." : isOnline ? "Online" : "Offline"}
        </span>
        {!loading && data && data.responseMs > 0 && (
          <span className="text-[11px] text-gray-400">{data.responseMs}ms</span>
        )}
      </div>

      {data?.url && data.url !== "not configured" && (
        <p className="text-[11px] text-gray-400 truncate" dir="ltr">
          {data.url}
        </p>
      )}

      {!loading && !isOnline && data?.error && (
        <p className="text-[11px] text-red-400 mt-1">{data.error}</p>
      )}

      {data?.checkedAt && (
        <p className="text-[10px] text-gray-300 mt-1">
          נבדק: {new Date(data.checkedAt).toLocaleTimeString("he-IL")}
        </p>
      )}
    </div>
  );
}
