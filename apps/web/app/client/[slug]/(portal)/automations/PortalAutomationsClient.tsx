"use client";

import { useState } from "react";

interface Props {
  clientId: string;
  clientName: string;
  autoReplyActive: boolean;
  autoReplyMessage: string;
  stats: { totalLeads: number; newLeads: number };
}

const AUTOS = [
  { id: "autoreply", icon: "💬", title: "חזרה אוטומטית ללידים", desc: "וואצאפ אוטומטי לכל ליד חדש תוך שניות", color: "#22c55e", editable: true },
  { id: "followup", icon: "🔄", title: "followup אוטומטי", desc: "חזרה ללידים שלא ענו אחרי יום", color: "#3b82f6", editable: false },
  { id: "report", icon: "📊", title: "דוח שבועי אוטומטי", desc: "דוח ביצועים כל שני בבוקר", color: "#8b5cf6", editable: false },
  { id: "drip", icon: "📱", title: "רצף הודעות WhatsApp", desc: "יום 1 + יום 3 — followup אוטומטי", color: "#f59e0b", editable: false },
];

export function PortalAutomationsClient({ clientId, clientName, autoReplyActive: initActive, autoReplyMessage: initMsg, stats }: Props) {
  const [active, setActive] = useState(initActive);
  const [message, setMessage] = useState(initMsg || "שלום! קיבלנו את פנייתך ונחזור אליך בהקדם 😊");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  async function save() {
    setSaving(true);
    await fetch(`/api/clients/${clientId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ autoReplyActive: active, whatsappTemplate: message }),
    });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <div className="max-w-lg mx-auto space-y-5" dir="rtl">
      <div>
        <h1 className="text-xl font-bold">⚙️ האוטומציות שלי</h1>
        <p className="text-sm text-gray-500">המערכת עובדת בשבילך גם כשאתה ישן 😴</p>
      </div>

      {/* Stats */}
      <div className="bg-gradient-to-l from-indigo-600 to-purple-600 rounded-2xl p-5 text-white flex justify-between items-center">
        <div>
          <p className="text-xs opacity-80">הודעות אוטומטיות שנשלחו</p>
          <p className="text-3xl font-extrabold">{stats.totalLeads}</p>
        </div>
        <span className="text-4xl">🚀</span>
      </div>

      {/* Automations list */}
      {AUTOS.map((auto) => (
        <div key={auto.id} className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex justify-between items-start">
            <div className="flex gap-3 items-start">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0" style={{ background: auto.color + "15" }}>{auto.icon}</div>
              <div>
                <p className="font-bold text-sm">{auto.title}</p>
                <p className="text-xs text-gray-500">{auto.desc}</p>
                <span className="text-[10px] font-semibold mt-1 inline-block px-2 py-0.5 rounded-full" style={{ background: auto.color + "15", color: auto.color }}>
                  {auto.id === "autoreply" ? (active ? `✅ פעיל — ${stats.newLeads} מחכים` : "⭕ כבוי") : "✅ פעיל — אוטומטי"}
                </span>
              </div>
            </div>
            {auto.editable ? (
              <button onClick={() => setActive(!active)} className="relative w-12 h-6 rounded-full transition-colors flex-shrink-0" style={{ background: active ? auto.color : "#e5e7eb" }}>
                <div className="absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all" style={{ right: active ? "2px" : "26px" }} />
              </button>
            ) : (
              <span className="text-[10px] px-2.5 py-1 bg-green-50 text-green-700 rounded-full font-semibold flex-shrink-0">🔒 אוטו</span>
            )}
          </div>

          {/* Auto-reply editor */}
          {auto.id === "autoreply" && active && (
            <div className="mt-4 pt-4 border-t border-gray-100 space-y-3">
              <label className="text-xs font-bold text-gray-500">✏️ הודעה ללידים חדשים:</label>
              <textarea value={message} onChange={(e) => setMessage(e.target.value)} rows={3} className="w-full border-2 border-gray-200 rounded-xl px-3 py-2.5 text-sm resize-none outline-none focus:border-green-400 leading-relaxed" />
              <p className="text-[10px] text-gray-400">💡 הודעה קצרה וידידותית עם שם העסק עובדת הכי טוב</p>
              <div className="flex gap-1.5 flex-wrap">
                {[
                  "שלום! קיבלנו את פנייתך ונחזור אליך בהקדם 😊",
                  `שלום! אני ${clientName}, שמחתי לקבל פנייתך. נחזור בהקדם! 🙏`,
                  "תודה שפנית! נחזור אליך תוך שעה ⚡",
                ].map((t, i) => (
                  <button key={i} onClick={() => setMessage(t)} className="px-2.5 py-1 bg-gray-50 border border-gray-200 rounded-lg text-[10px] text-gray-600 hover:bg-green-50 hover:border-green-200">תבנית {i + 1}</button>
                ))}
              </div>
              <button onClick={save} disabled={saving} className={`px-5 py-2.5 rounded-xl font-bold text-sm transition-all ${saved ? "bg-green-500 text-white" : saving ? "bg-gray-200 text-gray-400" : "bg-indigo-600 text-white"}`}>
                {saving ? "⏳" : saved ? "✅ נשמר!" : "💾 שמור"}
              </button>
            </div>
          )}
        </div>
      ))}

      {/* Info */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-800 leading-relaxed">
        <strong>💡 איך זה עובד?</strong><br />
        ליד חדש → וואצאפ אוטומטי. לא ענה? → followup ביום הבא. עדיין שקט? → עוד followup ביום 3. הכל אוטומטי! 🚀
      </div>
    </div>
  );
}
