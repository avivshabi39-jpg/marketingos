"use client";

import { useState, useEffect, useCallback } from "react";

export function N8nStatusCard() {
  const [data, setData] = useState<{
    status: string;
    url: string;
  } | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchStatus = useCallback(() => {
    setLoading(true);
    fetch("/api/n8n/health")
      .then((r) => r.json())
      .then(setData)
      .catch(() => setData({ status: "offline", url: "error" }))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  const online = data?.status === "online";

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
          {loading ? "..." : "רענן"}
        </button>
      </div>
      <div className="flex items-center gap-2 mb-2">
        <span
          className="inline-block w-2.5 h-2.5 rounded-full"
          style={{ background: online ? "#22c55e" : "#ef4444" }}
        />
        <span
          className="text-xs font-semibold"
          style={{ color: online ? "#166534" : "#dc2626" }}
        >
          {online ? "Online" : "Offline"}
        </span>
      </div>
      <p
        className="text-[11px] text-gray-400 truncate"
        dir="ltr"
        title={data?.url}
      >
        {data?.url || "..."}
      </p>
    </div>
  );
}
