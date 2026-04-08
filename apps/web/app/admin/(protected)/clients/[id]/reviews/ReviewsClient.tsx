"use client";

import { useState } from "react";
import Link from "next/link";
import { Star, Send, ExternalLink, ArrowRight, CheckCircle2 } from "lucide-react";

type WonLead = {
  id: string;
  firstName: string;
  lastName: string;
  phone: string | null;
  email: string | null;
  createdAt: string | Date;
};

export function ReviewsClient({
  clientId,
  clientName,
  googleBusinessUrl,
  hasWhatsApp,
  wonLeads,
}: {
  clientId: string;
  clientName: string;
  googleBusinessUrl: string | null;
  hasWhatsApp: boolean;
  wonLeads: WonLead[];
}) {
  const [sent, setSent] = useState<Record<string, boolean>>({});
  const [sending, setSending] = useState<string | null>(null);
  const [error, setError] = useState("");

  async function sendReview(lead: WonLead) {
    if (!googleBusinessUrl) return;
    setSending(lead.id);
    setError("");
    const res = await fetch("/api/reviews/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        clientId,
        leadId: lead.id,
        phone: lead.phone,
        name: `${lead.firstName} ${lead.lastName}`,
        reviewUrl: googleBusinessUrl,
      }),
    });
    if (res.ok) {
      setSent((prev) => ({ ...prev, [lead.id]: true }));
    } else {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "שגיאה בשליחה");
    }
    setSending(null);
  }

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6" dir="rtl">
      <div className="flex items-center gap-3 mb-2">
        <Link
          href={`/admin/clients/${clientId}`}
          className="flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700"
        >
          <ArrowRight size={14} className="rotate-180" /> {clientName}
        </Link>
      </div>

      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
          <Star size={24} className="text-yellow-500" /> בקשות ביקורת
        </h1>
        {googleBusinessUrl && (
          <a
            href={googleBusinessUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-sm text-blue-600 hover:underline"
          >
            <ExternalLink size={14} /> פתח דף Google
          </a>
        )}
      </div>

      {!googleBusinessUrl && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 text-sm text-yellow-800">
          <strong>טרם הוגדר קישור Google Business.</strong>{" "}
          <Link href={`/admin/clients/${clientId}?tab=settings`} className="underline">
            הוסף בהגדרות הלקוח
          </Link>
          .
        </div>
      )}

      {!hasWhatsApp && (
        <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 text-sm text-orange-800">
          <strong>Green API לא מוגדר.</strong> ללא חיבור WhatsApp, לא ניתן לשלוח הודעות אוטומטית.
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-sm text-red-700">{error}</div>
      )}

      {wonLeads.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border border-slate-200">
          <Star size={48} className="mx-auto text-slate-200 mb-3" />
          <p className="text-slate-500 font-medium">אין לידים שנסגרו עדיין</p>
          <p className="text-slate-400 text-sm mt-1">לאחר סגירת עסקאות, תוכל לשלוח כאן בקשות ביקורת</p>
        </div>
      ) : (
        <div className="space-y-3">
          <p className="text-sm text-slate-500">{wonLeads.length} לידים שנסגרו — שלח בקשת ביקורת ב-WhatsApp</p>
          {wonLeads.map((lead) => (
            <div
              key={lead.id}
              className="bg-white border border-slate-200 rounded-xl p-4 flex items-center justify-between gap-4 shadow-sm"
            >
              <div className="min-w-0">
                <p className="font-medium text-slate-900 text-sm">
                  {lead.firstName} {lead.lastName}
                </p>
                <p className="text-xs text-slate-400 mt-0.5">
                  {lead.phone ?? lead.email ?? "—"}
                  {" · "}
                  {new Date(lead.createdAt).toLocaleDateString("he-IL")}
                </p>
              </div>
              {sent[lead.id] ? (
                <span className="flex items-center gap-1 text-green-600 text-sm font-medium shrink-0">
                  <CheckCircle2 size={16} /> נשלח
                </span>
              ) : (
                <button
                  onClick={() => sendReview(lead)}
                  disabled={!googleBusinessUrl || !hasWhatsApp || !lead.phone || sending === lead.id}
                  className="flex items-center gap-1.5 bg-green-500 hover:bg-green-600 disabled:opacity-40 text-white text-sm font-medium px-3 py-1.5 rounded-lg transition-colors shrink-0"
                >
                  {sending === lead.id ? (
                    <span className="animate-spin inline-block w-3 h-3 border-2 border-white border-t-transparent rounded-full" />
                  ) : (
                    <Send size={13} />
                  )}
                  שלח בקשה
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
