"use client";

import { useEffect, useState } from "react";
import { StorageDashboard } from "./StorageDashboard";
import {
  CheckCircle2, AlertTriangle, XCircle,
  RefreshCw, Database, Mail, Lock, Shield, MessageSquare, Users, TrendingUp,
} from "lucide-react";

type CheckResult = {
  status: "ok" | "warn" | "error";
  detail?: string;
};

type HealthData = {
  status: "ok" | "warn" | "error";
  checks: Record<string, CheckResult>;
  stats: {
    totalClients: number;
    activeClients: number;
    totalLeads: number;
    leadsThisMonth: number;
    totalAppointments: number;
  };
  timestamp: string;
};

const CHECK_LABELS: Record<string, { label: string; icon: React.ElementType }> = {
  database:   { label: "מסד נתונים (PostgreSQL)", icon: Database },
  greenApi:   { label: "Green API (WhatsApp)",     icon: MessageSquare },
  resend:     { label: "Resend (אימייל)",           icon: Mail },
  encryption: { label: "מפתח הצפנה",               icon: Lock },
  jwt:        { label: "JWT Secret",               icon: Shield },
};

const STATUS_COLOR = {
  ok:    "text-green-600 bg-green-50 border-green-200",
  warn:  "text-yellow-600 bg-yellow-50 border-yellow-200",
  error: "text-red-600 bg-red-50 border-red-200",
};

const STATUS_LABEL = { ok: "תקין", warn: "אזהרה", error: "שגיאה" };

function StatusIcon({ status }: { status: "ok" | "warn" | "error" }) {
  if (status === "ok")    return <CheckCircle2 size={18} className="text-green-500" />;
  if (status === "warn")  return <AlertTriangle size={18} className="text-yellow-500" />;
  return <XCircle size={18} className="text-red-500" />;
}

export default function SystemHealthPage() {
  const [data, setData] = useState<HealthData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function load() {
    setLoading(true);
    setError("");
    const res = await fetch("/api/system/health");
    if (res.ok) {
      setData(await res.json());
    } else {
      setError("שגיאה בטעינת נתוני בריאות המערכת");
    }
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6" dir="rtl">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Shield size={24} className="text-indigo-600" /> בריאות המערכת
        </h1>
        <button
          onClick={load}
          disabled={loading}
          className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 border border-gray-200 px-3 py-2 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
        >
          <RefreshCw size={15} className={loading ? "animate-spin" : ""} />
          רענן
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-700">{error}</div>
      )}

      {loading && !data && (
        <div className="text-center py-16 text-gray-400">בודק מצב המערכת...</div>
      )}

      {data && (
        <>
          {/* Overall status */}
          <div className={`border rounded-xl p-4 flex items-center gap-3 ${STATUS_COLOR[data.status]}`}>
            <StatusIcon status={data.status} />
            <div>
              <p className="font-semibold">סטטוס כללי: {STATUS_LABEL[data.status]}</p>
              <p className="text-xs opacity-70 mt-0.5">
                עדכון אחרון: {new Date(data.timestamp).toLocaleString("he-IL")}
              </p>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { label: "לקוחות פעילים", value: `${data.stats.activeClients}/${data.stats.totalClients}`, icon: Users },
              { label: "לידים החודש",   value: data.stats.leadsThisMonth, icon: TrendingUp },
              { label: "סה״כ לידים",    value: data.stats.totalLeads,      icon: TrendingUp },
              { label: "ביקורים",       value: data.stats.totalAppointments, icon: CheckCircle2 },
            ].map(({ label, value, icon: Icon }) => (
              <div key={label} className="bg-white border border-gray-100 rounded-xl p-4 text-center shadow-sm">
                <Icon size={20} className="mx-auto text-indigo-400 mb-2" />
                <p className="text-2xl font-bold text-gray-900">{value}</p>
                <p className="text-xs text-gray-500 mt-1">{label}</p>
              </div>
            ))}
          </div>

          {/* Integration checks */}
          <div className="bg-white border border-gray-100 rounded-xl shadow-sm overflow-hidden">
            <div className="px-5 py-3 border-b border-gray-100">
              <h2 className="font-semibold text-gray-800 text-sm">בדיקות תשתית</h2>
            </div>
            <div className="divide-y divide-gray-50">
              {Object.entries(data.checks).map(([key, check]) => {
                const meta = CHECK_LABELS[key] ?? { label: key, icon: Shield };
                const Icon = meta.icon;
                return (
                  <div key={key} className="flex items-center gap-3 px-5 py-3.5">
                    <Icon size={16} className="text-gray-400 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-800">{meta.label}</p>
                      {check.detail && (
                        <p className="text-xs text-gray-500 mt-0.5 truncate">{check.detail}</p>
                      )}
                    </div>
                    <div className={`flex items-center gap-1.5 text-xs font-medium px-2 py-1 rounded-full border ${STATUS_COLOR[check.status]}`}>
                      <StatusIcon status={check.status} />
                      {STATUS_LABEL[check.status]}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}

      {/* Storage & Cost Dashboard */}
      <div className="mt-8 pt-6 border-t border-gray-200">
        <StorageDashboard />
      </div>
    </div>
  );
}
