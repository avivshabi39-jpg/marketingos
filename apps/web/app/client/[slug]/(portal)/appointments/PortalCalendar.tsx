"use client";

import { useState } from "react";
import { getHebrewDate, getHebrewMonthRange, getHolidaysForDate, getUpcomingHolidays } from "@/lib/hebrewCalendar";

interface Apt { id: string; name: string; scheduledAt: string; status: string; notes: string | null; phone: string | null }

const MONTHS = ["ינואר", "פברואר", "מרץ", "אפריל", "מאי", "יוני", "יולי", "אוגוסט", "ספטמבר", "אוקטובר", "נובמבר", "דצמבר"];
const WEEKDAYS = ["ראשון", "שני", "שלישי", "רביעי", "חמישי", "שישי", "שבת"];
const STATUS_COLORS: Record<string, string> = { PENDING: "#f59e0b", CONFIRMED: "#22c55e", DONE: "#3b82f6", CANCELLED: "#ef4444" };

function getDaysInMonth(date: Date): Date[] {
  const y = date.getFullYear(), m = date.getMonth();
  const first = new Date(y, m, 1), last = new Date(y, m + 1, 0);
  const days: Date[] = [];
  for (let i = first.getDay() - 1; i >= 0; i--) days.push(new Date(y, m, -i));
  for (let d = 1; d <= last.getDate(); d++) days.push(new Date(y, m, d));
  while (days.length % 7 !== 0) days.push(new Date(y, m + 1, days.length - last.getDate() - first.getDay() + 1));
  return days;
}

function isToday(d: Date) { return d.toDateString() === new Date().toDateString(); }

export function PortalCalendar({ clientId, clientName, appointments }: { clientId: string; clientName: string; appointments: Apt[] }) {
  const [cur, setCur] = useState(new Date());
  const [events, setEvents] = useState(appointments);
  const [showModal, setShowModal] = useState(false);
  const [selected, setSelected] = useState<Apt | null>(null);
  const [newTitle, setNewTitle] = useState("");
  const [newDate, setNewDate] = useState(new Date().toISOString().split("T")[0]);
  const [newTime, setNewTime] = useState("09:00");
  const [newNotes, setNewNotes] = useState("");
  const [notif, setNotif] = useState("");

  const calDays = getDaysInMonth(cur);

  function getForDay(day: Date) {
    const ds = day.toISOString().split("T")[0];
    return events.filter((e) => e.scheduledAt.startsWith(ds));
  }

  async function save() {
    if (!newTitle) return;
    const res = await fetch("/api/appointments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newTitle, scheduledAt: `${newDate}T${newTime}:00.000Z`, clientId, notes: newNotes || undefined }),
    });
    const data = (await res.json()) as { appointment?: Apt };
    if (data.appointment) {
      setEvents((p) => [...p, { ...data.appointment!, scheduledAt: data.appointment!.scheduledAt ?? `${newDate}T${newTime}:00.000Z` }]);
      setNotif("✅ נשמר!");
      setTimeout(() => setNotif(""), 2000);
    }
    setShowModal(false);
    setNewTitle(""); setNewNotes("");
  }

  async function del(id: string) {
    await fetch(`/api/appointments/${id}`, { method: "DELETE" });
    setEvents((p) => p.filter((e) => e.id !== id));
    setSelected(null);
  }

  const upcoming = getUpcomingHolidays(30);

  return (
    <div className="space-y-5 max-w-4xl" dir="rtl">
      {notif && <div className="fixed top-5 left-1/2 -translate-x-1/2 z-[9999] px-6 py-3 bg-green-500 text-white rounded-xl font-semibold text-sm shadow-lg">{notif}</div>}

      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">📅 לוח התורים שלי</h1>
        <button onClick={() => { setNewDate(new Date().toISOString().split("T")[0]); setShowModal(true); }} className="px-5 py-2.5 bg-blue-600 text-white rounded-xl font-bold text-sm">+ הוסף תור</button>
      </div>

      {/* Nav */}
      <div className="bg-white rounded-xl border border-slate-200 px-5 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => setCur((d) => new Date(d.getFullYear(), d.getMonth() - 1, 1))} className="px-3 py-1.5 bg-slate-100 rounded-lg text-sm">→</button>
          <h2 className="text-lg font-bold min-w-[160px] text-center">
            {MONTHS[cur.getMonth()]} {cur.getFullYear()}
            <span className="text-xs font-normal text-slate-400 mr-2">{getHebrewMonthRange(cur)}</span>
          </h2>
          <button onClick={() => setCur((d) => new Date(d.getFullYear(), d.getMonth() + 1, 1))} className="px-3 py-1.5 bg-slate-100 rounded-lg text-sm">←</button>
          <button onClick={() => setCur(new Date())} className="px-3 py-1.5 bg-blue-50 text-blue-600 rounded-lg text-xs font-semibold">היום</button>
        </div>
      </div>

      {/* Month grid */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="grid grid-cols-7">
          {WEEKDAYS.map((d) => <div key={d} className="px-2 py-2.5 text-center text-xs font-semibold text-slate-500 bg-slate-50 border-b border-slate-200">{d}</div>)}
        </div>
        <div className="grid grid-cols-7">
          {calDays.map((day, i) => {
            const dayEvts = getForDay(day);
            const heb = getHebrewDate(day);
            const hols = getHolidaysForDate(day);
            const sameM = day.getMonth() === cur.getMonth();
            const td = isToday(day);
            const holBg = hols.length > 0 ? (hols[0].type === "fast" ? "#f5f3ff" : hols[0].type === "memorial" ? "#f1f5f9" : "#fffbeb") : "";
            return (
              <div key={i} onClick={() => { setNewDate(day.toISOString().split("T")[0]); setShowModal(true); }} className={`min-h-[90px] p-1.5 cursor-pointer border-b border-r border-slate-100 transition-colors ${!sameM ? "opacity-40" : ""}`} style={{ background: td ? "#eef2ff" : holBg || undefined }}>
                <div className="flex justify-between items-start mb-0.5">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${td ? "bg-blue-600 text-white font-bold" : "text-slate-700"}`}>{day.getDate()}</div>
                  <span className={`text-[10px] ${heb.isRC ? "text-blue-600 font-bold" : "text-slate-300"}`}>{heb.day}</span>
                </div>
                {heb.isRC && <div className="text-[8px] text-blue-500 font-semibold mb-0.5">🌙 ר״ח {heb.month}</div>}
                {hols.map((h, hi) => <div key={hi} className="text-[9px] font-semibold mb-0.5 truncate rounded px-1 py-0.5" style={{ background: h.color + "20", color: h.color, borderRight: `2px solid ${h.color}` }}>{h.emoji} {h.name}</div>)}
                {dayEvts.slice(0, 2).map((ev) => (
                  <div key={ev.id} onClick={(e) => { e.stopPropagation(); setSelected(ev); }} className="px-1 py-0.5 rounded text-[10px] font-medium mb-0.5 truncate" style={{ background: (STATUS_COLORS[ev.status] ?? "#6366f1") + "20", color: STATUS_COLORS[ev.status] ?? "#6366f1", borderRight: `3px solid ${STATUS_COLORS[ev.status] ?? "#6366f1"}` }}>
                    {ev.scheduledAt.slice(11, 16)} {ev.name}
                  </div>
                ))}
                {dayEvts.length > 2 && <div className="text-[10px] text-slate-400">+{dayEvts.length - 2}</div>}
              </div>
            );
          })}
        </div>
      </div>

      {/* Upcoming holidays */}
      {upcoming.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
          <p className="font-bold text-sm text-amber-900 mb-2">✡️ חגים קרובים</p>
          {upcoming.slice(0, 5).map((u, i) => (
            <div key={i} className="flex items-center justify-between text-sm py-1">
              <span>{u.holiday.emoji} {u.holiday.name} <span className="text-[10px] text-slate-400">{u.hebrew.day} {u.hebrew.month}</span></span>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-lg" style={{ background: u.holiday.color + "15", color: u.holiday.color }}>{u.date.toLocaleDateString("he-IL", { day: "numeric", month: "short" })}</span>
            </div>
          ))}
        </div>
      )}

      {/* Legend */}
      <div className="bg-white rounded-xl border border-slate-200 px-5 py-3 flex items-center gap-5 flex-wrap">
        <span className="text-xs font-semibold text-slate-500">📅 מקרא:</span>
        {[{ l: "חג", c: "#f59e0b" }, { l: "צום", c: "#7c3aed" }, { l: "לאומי", c: "#3b82f6" }, { l: "זיכרון", c: "#374151" }, { l: "ר״ח", c: "#6366f1" }].map((x) => (
          <div key={x.l} className="flex items-center gap-1.5 text-xs text-slate-600"><div className="w-2.5 h-2.5 rounded" style={{ background: x.c }} />{x.l}</div>
        ))}
      </div>

      {/* Event detail */}
      {selected && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setSelected(null)}>
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm" dir="rtl" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-bold text-lg mb-3">{selected.name}</h3>
            <p className="text-sm text-slate-600 mb-1">📅 {new Date(selected.scheduledAt).toLocaleDateString("he-IL")} ⏰ {selected.scheduledAt.slice(11, 16)}</p>
            {selected.phone && <p className="text-sm text-slate-600 mb-1">📞 {selected.phone}</p>}
            {selected.notes && <p className="text-sm text-slate-600 mb-3">📝 {selected.notes}</p>}
            <div className="flex gap-2">
              <button onClick={() => setSelected(null)} className="flex-1 py-2.5 bg-slate-100 rounded-xl text-sm font-medium">סגור</button>
              <button onClick={() => del(selected.id)} className="py-2.5 px-4 bg-red-50 text-red-600 rounded-xl text-sm font-medium">🗑️</button>
            </div>
          </div>
        </div>
      )}

      {/* Add modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowModal(false)}>
          <div className="bg-white rounded-2xl p-6 w-full max-w-md" dir="rtl" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-bold text-lg mb-4">➕ הוסף תור</h3>
            <input placeholder="כותרת *" value={newTitle} onChange={(e) => setNewTitle(e.target.value)} className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm mb-3 outline-none focus:border-blue-400" />
            <div className="flex gap-2 mb-3">
              <input type="date" value={newDate} onChange={(e) => setNewDate(e.target.value)} className="flex-[2] border border-slate-200 rounded-lg px-3 py-2.5 text-sm outline-none" />
              <input type="time" value={newTime} onChange={(e) => setNewTime(e.target.value)} className="flex-1 border border-slate-200 rounded-lg px-3 py-2.5 text-sm outline-none" />
            </div>
            {newDate && <p className="text-xs text-slate-400 mb-3">{getHebrewDate(new Date(newDate)).day} {getHebrewDate(new Date(newDate)).month}</p>}
            <textarea placeholder="הערות..." value={newNotes} onChange={(e) => setNewNotes(e.target.value)} rows={2} className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm mb-3 outline-none resize-none" />
            <div className="flex gap-2">
              <button onClick={save} disabled={!newTitle} className="flex-[2] py-3 bg-blue-600 text-white rounded-xl font-bold text-sm disabled:opacity-40">💾 שמור</button>
              <button onClick={() => setShowModal(false)} className="flex-1 py-3 bg-slate-100 rounded-xl text-sm">ביטול</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
