"use client";

import { useState, useEffect, useCallback } from "react";
import { Loader2, RefreshCw, CheckCircle2, XCircle, Smartphone } from "lucide-react";

interface StatusData {
  status: string;
  isConnected: boolean;
  hasCredentials: boolean;
  qrCode: string | null;
  phone: string | null;
}

export function WhatsAppSetup({ clientId }: { clientId: string }) {
  const [data, setData] = useState<StatusData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [instanceId, setInstanceId] = useState("");
  const [token, setToken] = useState("");
  const [phone, setPhone] = useState("");

  const checkStatus = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/clients/${clientId}/whatsapp`);
      if (res.ok) {
        const d = (await res.json()) as StatusData;
        setData(d);
        if (d.phone) setPhone(d.phone);
      }
    } catch { /* ignore */ }
    setLoading(false);
  }, [clientId]);

  useEffect(() => { checkStatus(); }, [checkStatus]);

  async function saveCredentials() {
    setSaving(true);
    try {
      const res = await fetch(`/api/clients/${clientId}/whatsapp`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ instanceId, token, phone }),
      });
      if (res.ok) await checkStatus();
    } catch { /* ignore */ }
    setSaving(false);
  }

  const statusColor = data?.isConnected ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200";
  const statusIcon = data?.isConnected
    ? <CheckCircle2 size={20} className="text-green-600" />
    : <XCircle size={20} className="text-red-500" />;
  const statusText = data?.isConnected ? "וואצאפ מחובר ופעיל" : "וואצאפ לא מחובר";

  const STATUS_LABELS: Record<string, string> = {
    authorized: "מחובר",
    notAuthorized: "לא מאושר — יש לסרוק QR",
    not_configured: "לא הוגדר",
    sleeping: "במצב שינה",
    starting: "מתחבר...",
    error: "שגיאת חיבור",
    unknown: "לא ידוע",
  };

  return (
    <div className="space-y-4" dir="rtl">
      {/* Status banner */}
      <div className={`flex items-center gap-3 rounded-xl border p-4 ${statusColor}`}>
        {loading ? <Loader2 size={20} className="animate-spin text-slate-400" /> : statusIcon}
        <div className="flex-1">
          <p className="font-semibold text-sm text-slate-900">
            {loading ? "בודק חיבור..." : statusText}
          </p>
          <p className="text-xs text-slate-500">
            סטטוס: {loading ? "..." : STATUS_LABELS[data?.status ?? ""] ?? data?.status}
          </p>
        </div>
        <button
          onClick={checkStatus}
          disabled={loading}
          className="flex items-center gap-1 text-xs text-slate-500 hover:text-slate-700 border border-slate-200 rounded-lg px-2.5 py-1.5 transition-colors disabled:opacity-50"
        >
          <RefreshCw size={12} className={loading ? "animate-spin" : ""} />
          בדוק
        </button>
      </div>

      {/* QR Code */}
      {data?.qrCode && !data.isConnected && (
        <div className="bg-white rounded-xl border border-slate-200 p-5 text-center">
          <Smartphone size={24} className="text-green-600 mx-auto mb-2" />
          <p className="text-sm font-medium text-slate-900 mb-3">סרוק עם וואצאפ:</p>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(data.qrCode)}`}
            alt="QR Code"
            className="mx-auto rounded-lg"
            width={200}
            height={200}
          />
          <p className="text-xs text-slate-400 mt-3">WhatsApp → Settings → Linked Devices → Link a Device</p>
        </div>
      )}

      {/* Credentials form */}
      <div className="bg-slate-50 rounded-xl border border-slate-200 p-5 space-y-3">
        <h4 className="font-semibold text-sm text-slate-900 flex items-center gap-2">
          <span className="text-lg">⚙️</span>
          הגדרות Green API
        </h4>
        <p className="text-xs text-slate-500">
          צור חשבון חינמי ב-
          <a href="https://green-api.com" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">
            green-api.com
          </a>
          {" "}← צור Instance ← העתק פרטים
        </p>

        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">Instance ID</label>
          <input
            value={instanceId}
            onChange={(e) => setInstanceId(e.target.value)}
            placeholder="7107XXXXXX"
            className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-200 focus:border-blue-400 outline-none"
            dir="ltr"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">API Token</label>
          <input
            value={token}
            onChange={(e) => setToken(e.target.value)}
            placeholder="your-api-token"
            className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-200 focus:border-blue-400 outline-none"
            dir="ltr"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">מספר וואצאפ</label>
          <input
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="0501234567"
            className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-200 focus:border-blue-400 outline-none"
            dir="ltr"
          />
        </div>

        <button
          onClick={saveCredentials}
          disabled={saving || !instanceId || !token}
          className="w-full flex items-center justify-center gap-2 bg-green-600 hover:bg-green-500 text-white font-semibold rounded-lg py-2.5 text-sm transition-colors disabled:opacity-40"
        >
          {saving ? <Loader2 size={14} className="animate-spin" /> : null}
          {saving ? "שומר..." : "💾 שמור וחבר"}
        </button>
      </div>

      {/* Instructions */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-xs text-amber-800 space-y-1">
        <p className="font-semibold">📋 איך מחברים:</p>
        <p>1. פתח green-api.com → Sign up חינם</p>
        <p>2. לחץ Create Instance → Developer</p>
        <p>3. העתק Instance ID + Token</p>
        <p>4. הכנס כאן ולחץ שמור</p>
        <p>5. סרוק QR עם וואצאפ בטלפון</p>
      </div>
    </div>
  );
}
