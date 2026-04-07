"use client";

import { useState } from "react";
import { EmptyState } from "@/components/ui/EmptyState";

const TEMPLATES = [
  { label: "👋 היכרות", text: "שלום! אנחנו כאן בשבילך. יש שאלות? צור קשר! 😊" },
  { label: "🎁 מבצע", text: "שלום! מבצע מיוחד רק השבוע — צור קשר עכשיו! 🔥" },
  { label: "📞 followup", text: "שלום! פנית אלינו לאחרונה. עדיין מתעניין/ת? נשמח לעזור! 📞" },
  { label: "⭐ ביקורת", text: "שלום! תודה שבחרת בנו! אם היית מרוצה — נשמח לביקורת 🙏" },
  { label: "🔔 תזכורת", text: "שלום! רצינו להזכיר על השירותים שלנו. נשמח לשמוע ממך! 😊" },
];

const AUDIENCES = [
  { value: "all", label: "כל הלידים", icon: "👥" },
  { value: "new", label: "חדשים בלבד", icon: "🆕" },
  { value: "contacted", label: "נוצר קשר", icon: "📞" },
];

interface Props {
  clientId: string;
  clientName: string;
  stats: { totalLeads: number; newLeads: number; contactedLeads: number };
  broadcasts: { id: string; message: string; status: string; totalCount: number; sentCount: number; failCount: number; createdAt: string }[];
}

export function PortalBroadcastClient({ clientId, clientName, stats, broadcasts }: Props) {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [audience, setAudience] = useState("all");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [done, setDone] = useState(false);
  const [generating, setGenerating] = useState(false);

  const count = audience === "new" ? stats.newLeads : audience === "contacted" ? stats.contactedLeads : stats.totalLeads;

  async function generateAI() {
    setGenerating(true);
    try {
      const res = await fetch("/api/social-posts/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clientId, topic: "שידור וואצאפ ללידים", platform: "whatsapp", style: "fun" }),
      });
      const data = (await res.json()) as { post?: string };
      if (data.post) setMessage(data.post);
    } catch { setMessage(`שלום! אנחנו ${clientName} ונשמח לעזור 😊`); }
    setGenerating(false);
  }

  async function send() {
    if (!message.trim() || count === 0) return;
    setSending(true);
    try {
      const res = await fetch("/api/broadcast", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clientId, message, filter: audience }),
      });
      const data = (await res.json()) as { broadcastId?: string };
      if (data.broadcastId) {
        await fetch(`/api/broadcast/${data.broadcastId}/send`, { method: "POST" });
      }
      setDone(true);
    } catch { /* ignore */ }
    setSending(false);
  }

  if (done) {
    return (
      <div className="max-w-lg mx-auto text-center py-16" dir="rtl">
        <div className="text-6xl mb-4">🎉</div>
        <h2 className="text-2xl font-extrabold mb-2">השידור נשלח!</h2>
        <p className="text-gray-500 mb-6">ההודעה נשלחה ל-{count} נמענים</p>
        <button onClick={() => { setStep(1); setMessage(""); setDone(false); }} className="px-6 py-3 bg-indigo-600 text-white rounded-xl font-bold text-sm">📢 שידור חדש</button>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto space-y-5" dir="rtl">
      <div>
        <h1 className="text-xl font-bold">📢 שידור WhatsApp</h1>
        <p className="text-sm text-gray-500">שלח הודעה לכל הלידים שלך</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { l: 'סה"כ', v: stats.totalLeads, c: "#6366f1" },
          { l: "חדשים", v: stats.newLeads, c: "#3b82f6" },
          { l: "נוצר קשר", v: stats.contactedLeads, c: "#f59e0b" },
        ].map((s) => (
          <div key={s.l} className="bg-white rounded-xl border border-gray-200 p-3 text-center">
            <div className="text-xl font-extrabold" style={{ color: s.c }}>{s.v}</div>
            <div className="text-[11px] text-gray-500">{s.l}</div>
          </div>
        ))}
      </div>

      {/* Step 1 — Audience */}
      {step === 1 && (
        <div className="space-y-3">
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <p className="font-bold text-sm mb-3">👥 בחר קהל יעד</p>
            <div className="space-y-2">
              {AUDIENCES.map((a) => (
                <button key={a.value} onClick={() => setAudience(a.value)} className={`w-full px-4 py-3 rounded-xl border-2 text-right flex justify-between items-center transition-all ${audience === a.value ? "border-indigo-500 bg-indigo-50" : "border-gray-200"}`}>
                  <span className={`font-semibold text-sm ${audience === a.value ? "text-indigo-700" : "text-gray-700"}`}>{a.icon} {a.label}</span>
                  <span className="text-sm font-bold text-gray-500">{a.value === "all" ? stats.totalLeads : a.value === "new" ? stats.newLeads : stats.contactedLeads}</span>
                </button>
              ))}
            </div>
          </div>
          {count > 0 && <div className="bg-green-50 border border-green-200 rounded-xl px-4 py-3 text-sm text-green-700 font-medium">✅ ישלח ל-{count} נמענים</div>}
          <button onClick={() => setStep(2)} disabled={count === 0} className="w-full py-3.5 bg-indigo-600 text-white rounded-xl font-bold text-sm disabled:opacity-40">הבא →</button>
        </div>
      )}

      {/* Step 2 — Message */}
      {step === 2 && (
        <div className="space-y-3">
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="flex justify-between items-center mb-3">
              <p className="font-bold text-sm">✍️ כתוב הודעה</p>
              <button onClick={generateAI} disabled={generating} className="px-3 py-1.5 bg-indigo-50 text-indigo-600 border border-indigo-200 rounded-lg text-xs font-semibold">
                {generating ? "⏳" : "✨ AI"}
              </button>
            </div>
            <textarea value={message} onChange={(e) => setMessage(e.target.value)} placeholder="כתוב את ההודעה..." rows={5} className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-sm resize-none outline-none focus:border-indigo-400 leading-relaxed" />
            <p className="text-[10px] text-gray-400 mt-1">{message.length} תווים</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <p className="text-xs font-semibold text-gray-500 mb-2">📋 תבניות</p>
            <div className="flex gap-1.5 flex-wrap">
              {TEMPLATES.map((t) => (
                <button key={t.label} onClick={() => setMessage(t.text)} className="px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-xs text-gray-600 hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-200 transition-colors">{t.label}</button>
              ))}
            </div>
          </div>
          {message && (
            <div className="bg-green-50 border border-green-200 rounded-xl p-4">
              <p className="text-xs font-semibold text-green-700 mb-2">👀 תצוגה מקדימה:</p>
              <div className="bg-white rounded-lg px-3 py-2 text-sm border border-green-200 whitespace-pre-wrap">{message}</div>
            </div>
          )}
          <div className="flex gap-2">
            <button onClick={() => setStep(1)} className="flex-1 py-3 bg-gray-100 rounded-xl text-sm font-semibold">← חזור</button>
            <button onClick={send} disabled={!message.trim() || sending} className="flex-[2] py-3 bg-green-600 text-white rounded-xl font-bold text-sm disabled:opacity-40">
              {sending ? "⏳ שולח..." : `💬 שלח ל-${count} נמענים`}
            </button>
          </div>
        </div>
      )}

      {/* Past broadcasts */}
      {step === 1 && broadcasts.length === 0 && (
        <div className="bg-white rounded-xl border border-gray-200">
          <EmptyState
            icon="📢"
            title="לא נשלחו שידורים עדיין"
            subtitle="שלח הודעת WhatsApp לכל הלידים שלך בלחיצה אחת"
          />
        </div>
      )}

      {step === 1 && broadcasts.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="font-bold text-sm mb-3">📋 שידורים קודמים</p>
          {broadcasts.slice(0, 5).map((b) => (
            <div key={b.id} className="flex justify-between items-center py-2 border-b border-gray-50 last:border-0">
              <div className="flex-1 min-w-0">
                <p className="text-xs text-gray-700 truncate">{b.message}</p>
                <p className="text-[10px] text-gray-400">{new Date(b.createdAt).toLocaleDateString("he-IL")}</p>
              </div>
              <span className="text-xs font-bold text-green-600 mr-3">✅ {b.sentCount}/{b.totalCount}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
