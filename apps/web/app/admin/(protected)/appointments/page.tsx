"use client";

import { useState, useEffect } from "react";
import { HDate } from "@hebcal/core";

type EventType = "appointment" | "task" | "reminder";
type CalView = "month" | "list";

const HEBREW_MONTHS = ["תשרי", "חשון", "כסלו", "טבת", "שבט", "אדר", "אדר א׳", "אדר ב׳", "ניסן", "אייר", "סיון", "תמוז", "אב", "אלול"];

function toGematria(num: number): string {
  if (num === 15) return 'ט״ו';
  if (num === 16) return 'ט״ז';
  const ones = ["", "א", "ב", "ג", "ד", "ה", "ו", "ז", "ח", "ט"];
  const tens = ["", "י", "כ", "ל"];
  let r = "";
  if (num >= 10) { r += tens[Math.floor(num / 10)]; num %= 10; }
  if (num > 0) r += ones[num];
  return r.length === 1 ? r + "׳" : r.slice(0, -1) + "״" + r.slice(-1);
}

function getHebrewDate(date: Date) {
  try {
    const hd = new HDate(date);
    return { day: toGematria(hd.getDate()), month: HEBREW_MONTHS[hd.getMonth() - 1] ?? "", isRC: hd.getDate() === 1 };
  } catch {
    return { day: "", month: "", isRC: false };
  }
}

function getHebrewMonthRange(date: Date): string {
  try {
    const f = new HDate(new Date(date.getFullYear(), date.getMonth(), 1));
    const l = new HDate(new Date(date.getFullYear(), date.getMonth() + 1, 0));
    const fm = HEBREW_MONTHS[f.getMonth() - 1] ?? "";
    const lm = HEBREW_MONTHS[l.getMonth() - 1] ?? "";
    return fm === lm ? fm : `${fm} - ${lm}`;
  } catch { return ""; }
}

interface HebrewHoliday { name: string; emoji: string; type: "holiday" | "fast" | "national" | "memorial"; color: string }

function getHolidaysForDate(date: Date): HebrewHoliday[] {
  try {
    const hd = new HDate(date);
    const d = hd.getDate(), m = hd.getMonth();
    const h: HebrewHoliday[] = [];
    // Tishrei (1)
    if (m===1) {
      if (d===1||d===2) h.push({name:"ראש השנה",emoji:"🍎",type:"holiday",color:"#f59e0b"});
      if (d===3) h.push({name:"צום גדליה",emoji:"✡️",type:"fast",color:"#6b7280"});
      if (d===10) h.push({name:"יום כיפור",emoji:"🕍",type:"fast",color:"#7c3aed"});
      if (d===15) h.push({name:"סוכות",emoji:"🌿",type:"holiday",color:"#22c55e"});
      if (d>=16&&d<=20) h.push({name:"חוה״מ סוכות",emoji:"🌿",type:"holiday",color:"#86efac"});
      if (d===21) h.push({name:"הושענא רבה",emoji:"🌿",type:"holiday",color:"#22c55e"});
      if (d===22) h.push({name:"שמיני עצרת",emoji:"✡️",type:"holiday",color:"#f59e0b"});
      if (d===23) h.push({name:"שמחת תורה",emoji:"📜",type:"holiday",color:"#f59e0b"});
    }
    // Kislev (3)
    if (m===3&&d>=25) h.push({name:"חנוכה",emoji:"🕎",type:"holiday",color:"#3b82f6"});
    // Tevet (4)
    if (m===4) {
      if (d<=3) h.push({name:"חנוכה",emoji:"🕎",type:"holiday",color:"#3b82f6"});
      if (d===10) h.push({name:"צום י׳ בטבת",emoji:"✡️",type:"fast",color:"#6b7280"});
    }
    // Shvat (5)
    if (m===5&&d===15) h.push({name:'ט״ו בשבט',emoji:"🌳",type:"holiday",color:"#22c55e"});
    // Adar (6/7)
    if (m===6||m===7) {
      if (d===13) h.push({name:"תענית אסתר",emoji:"✡️",type:"fast",color:"#6b7280"});
      if (d===14) h.push({name:"פורים",emoji:"🎭",type:"holiday",color:"#ec4899"});
      if (d===15) h.push({name:"שושן פורים",emoji:"🎭",type:"holiday",color:"#ec4899"});
    }
    // Nisan (7 or 8 depending on @hebcal mapping)
    if (m===8) {
      if (d===15) h.push({name:"פסח",emoji:"🍷",type:"holiday",color:"#f59e0b"});
      if (d>=16&&d<=20) h.push({name:"חוה״מ פסח",emoji:"🍷",type:"holiday",color:"#fcd34d"});
      if (d===21) h.push({name:"שביעי של פסח",emoji:"🌊",type:"holiday",color:"#f59e0b"});
      if (d===27) h.push({name:"יום השואה",emoji:"🕯️",type:"memorial",color:"#1e293b"});
    }
    // Iyar (9)
    if (m===9) {
      if (d===4) h.push({name:"יום הזיכרון",emoji:"🕯️",type:"memorial",color:"#374151"});
      if (d===5) h.push({name:"יום העצמאות",emoji:"🇮🇱",type:"national",color:"#3b82f6"});
      if (d===18) h.push({name:'ל״ג בעומר',emoji:"🔥",type:"holiday",color:"#f97316"});
      if (d===28) h.push({name:"יום ירושלים",emoji:"🏛️",type:"national",color:"#3b82f6"});
    }
    // Sivan (10)
    if (m===10&&(d===6||d===7)) h.push({name:"שבועות",emoji:"📜",type:"holiday",color:"#f59e0b"});
    // Tammuz (11)
    if (m===11&&d===17) h.push({name:'צום י״ז בתמוז',emoji:"✡️",type:"fast",color:"#6b7280"});
    // Av (12)
    if (m===12) {
      if (d===9) h.push({name:"תשעה באב",emoji:"🕍",type:"fast",color:"#7c3aed"});
      if (d===15) h.push({name:'ט״ו באב',emoji:"❤️",type:"holiday",color:"#ec4899"});
    }
    return h;
  } catch { return []; }
}

function getUpcomingHolidays(days: number) {
  const upcoming: { date: Date; holiday: HebrewHoliday; hebrew: ReturnType<typeof getHebrewDate> }[] = [];
  const today = new Date();
  for (let i = 0; i < days; i++) {
    const date = new Date(today); date.setDate(today.getDate() + i);
    for (const holiday of getHolidaysForDate(date)) {
      upcoming.push({ date, holiday, hebrew: getHebrewDate(date) });
    }
  }
  return upcoming.slice(0, 8);
}

interface CalEvent {
  id: string;
  name: string;
  phone: string | null;
  notes: string | null;
  scheduledAt: string;
  status: string;
  client: { name: string } | null;
}

interface ClientOption {
  id: string;
  name: string;
}

const MONTHS = ["ינואר", "פברואר", "מרץ", "אפריל", "מאי", "יוני", "יולי", "אוגוסט", "ספטמבר", "אוקטובר", "נובמבר", "דצמבר"];
const WEEKDAYS = ["ראשון", "שני", "שלישי", "רביעי", "חמישי", "שישי", "שבת"];
const STATUS_COLORS: Record<string, string> = {
  PENDING: "#f59e0b",
  CONFIRMED: "#22c55e",
  DONE: "#3b82f6",
  CANCELLED: "#ef4444",
};

function getColor(event: CalEvent): string {
  return STATUS_COLORS[event.status] ?? "#6366f1";
}

function getDaysInMonth(date: Date): Date[] {
  const year = date.getFullYear();
  const month = date.getMonth();
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const days: Date[] = [];

  for (let i = firstDay.getDay() - 1; i >= 0; i--) {
    days.push(new Date(year, month, -i));
  }
  for (let d = 1; d <= lastDay.getDate(); d++) {
    days.push(new Date(year, month, d));
  }
  while (days.length % 7 !== 0) {
    days.push(new Date(year, month + 1, days.length - lastDay.getDate() - firstDay.getDay() + 1));
  }
  return days;
}

function isToday(d: Date): boolean {
  return d.toDateString() === new Date().toDateString();
}

export default function AppointmentsPage() {
  const [view, setView] = useState<CalView>("month");
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState<CalEvent[]>([]);
  const [clients, setClients] = useState<ClientOption[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<CalEvent | null>(null);

  const [newEvent, setNewEvent] = useState({
    title: "",
    date: new Date().toISOString().split("T")[0],
    time: "09:00",
    type: "appointment" as EventType,
    clientId: "",
    notes: "",
    notify: false,
  });

  useEffect(() => {
    fetch("/api/appointments")
      .then((r) => r.json())
      .then((d) => setEvents(d.appointments ?? []))
      .catch(() => {});
    fetch("/api/clients?limit=100")
      .then((r) => r.json())
      .then((d) => setClients(d.clients ?? []))
      .catch(() => {});
  }, []);

  const calDays = getDaysInMonth(currentDate);

  function getEventsForDay(day: Date): CalEvent[] {
    const ds = day.toISOString().split("T")[0];
    return events.filter((e) => e.scheduledAt?.startsWith(ds)).sort((a, b) => a.scheduledAt.localeCompare(b.scheduledAt));
  }

  function openAddModal(day?: Date) {
    setNewEvent((e) => ({ ...e, date: (day ?? new Date()).toISOString().split("T")[0], title: "", notes: "", clientId: "" }));
    setSelectedEvent(null);
    setShowModal(true);
  }

  async function saveEvent() {
    if (!newEvent.title) return;
    const scheduledAt = `${newEvent.date}T${newEvent.time}:00.000Z`;
    const clientName = clients.find((c) => c.id === newEvent.clientId)?.name;

    const res = await fetch("/api/appointments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: newEvent.title,
        scheduledAt,
        clientId: newEvent.clientId || undefined,
        notes: newEvent.notes || undefined,
        type: newEvent.type,
      }),
    });
    const data = (await res.json()) as { appointment?: CalEvent };
    if (data.appointment) {
      setEvents((prev) => [...prev, { ...data.appointment!, client: clientName ? { name: clientName } : null }]);
    }
    setShowModal(false);
  }

  async function deleteEvent(id: string) {
    await fetch(`/api/appointments/${id}`, { method: "DELETE" });
    setEvents((prev) => prev.filter((e) => e.id !== id));
    setSelectedEvent(null);
  }

  const todayEvents = getEventsForDay(new Date());

  return (
    <div className="space-y-5 max-w-6xl" dir="rtl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">📅 לוח תורים ומשימות</h1>
          {todayEvents.length > 0 && <p className="text-sm text-gray-500 mt-0.5">היום יש {todayEvents.length} אירועים</p>}
        </div>
        <button onClick={() => openAddModal()} className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl px-5 py-2.5 text-sm transition-colors">
          + הוסף תור / משימה
        </button>
      </div>

      {/* Nav bar */}
      <div className="bg-white rounded-xl border border-gray-200 px-5 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => setCurrentDate((d) => new Date(d.getFullYear(), d.getMonth() - 1, 1))} className="px-3 py-1.5 bg-gray-100 rounded-lg text-sm hover:bg-gray-200">→</button>
          <h2 className="text-lg font-bold text-gray-900 min-w-[180px] text-center">
            {MONTHS[currentDate.getMonth()]} {currentDate.getFullYear()}
            <span className="text-xs font-normal text-gray-400 mr-2">{getHebrewMonthRange(currentDate)}</span>
          </h2>
          <button onClick={() => setCurrentDate((d) => new Date(d.getFullYear(), d.getMonth() + 1, 1))} className="px-3 py-1.5 bg-gray-100 rounded-lg text-sm hover:bg-gray-200">←</button>
          <button onClick={() => setCurrentDate(new Date())} className="px-3 py-1.5 bg-indigo-50 text-indigo-600 rounded-lg text-xs font-semibold hover:bg-indigo-100">היום</button>
        </div>
        <div className="flex gap-1">
          {(["month", "list"] as CalView[]).map((v) => (
            <button key={v} onClick={() => setView(v)} className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${view === v ? "bg-indigo-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}>
              {v === "month" ? "📅 חודש" : "📋 רשימה"}
            </button>
          ))}
        </div>
      </div>

      {/* Month View */}
      {view === "month" && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          {/* Weekday headers */}
          <div className="grid grid-cols-7">
            {WEEKDAYS.map((d) => (
              <div key={d} className="px-2 py-2.5 text-center text-xs font-semibold text-gray-500 bg-gray-50 border-b border-gray-200">{d}</div>
            ))}
          </div>
          {/* Day cells */}
          <div className="grid grid-cols-7">
            {calDays.map((day, i) => {
              const dayEvents = getEventsForDay(day);
              const sameMonth = day.getMonth() === currentDate.getMonth();
              const today = isToday(day);
              const heb = getHebrewDate(day);
              const hols = getHolidaysForDate(day);
              const holBg = hols.length > 0 ? (hols[0].type === "fast" ? "#f5f3ff" : hols[0].type === "memorial" ? "#f1f5f9" : hols[0].type === "national" ? "#eff6ff" : "#fffbeb") : "";
              return (
                <div
                  key={i}
                  onClick={() => openAddModal(day)}
                  className={`min-h-[100px] p-1.5 cursor-pointer transition-colors border-b border-r border-gray-100 last:border-r-0 ${!sameMonth ? "opacity-40" : ""}`}
                  style={{ background: today ? "#eef2ff" : holBg || undefined }}
                >
                  <div className="flex items-start justify-between mb-1">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${today ? "bg-indigo-600 text-white font-bold" : "text-gray-700"}`}>
                      {day.getDate()}
                    </div>
                    <span className={`text-[10px] leading-none ${heb.isRC ? "text-indigo-600 font-bold" : "text-gray-300"}`}>
                      {heb.day}
                    </span>
                  </div>
                  {heb.isRC && (
                    <div className="text-[8px] text-indigo-500 font-semibold bg-indigo-50 rounded px-1 py-0.5 mb-0.5 inline-block">🌙 ר״ח {heb.month}</div>
                  )}
                  {hols.map((ho, hi) => (
                    <div key={hi} className="text-[9px] font-semibold mb-0.5 truncate rounded px-1 py-0.5" dir="rtl" style={{ background: ho.color + "20", color: ho.color, borderRight: `2px solid ${ho.color}` }}>
                      {ho.emoji} {ho.name}
                    </div>
                  ))}
                  {dayEvents.slice(0, hols.length > 0 ? 2 : 3).map((ev) => (
                    <div
                      key={ev.id}
                      onClick={(e) => { e.stopPropagation(); setSelectedEvent(ev); }}
                      className="px-1.5 py-0.5 rounded text-[10px] font-medium mb-0.5 truncate cursor-pointer"
                      style={{ background: getColor(ev) + "20", color: getColor(ev), borderRight: `3px solid ${getColor(ev)}` }}
                    >
                      {ev.scheduledAt?.slice(11, 16)} {ev.name}
                    </div>
                  ))}
                  {dayEvents.length > 3 && <div className="text-[10px] text-gray-400">+{dayEvents.length - 3} עוד</div>}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* List View */}
      {view === "list" && (
        <div className="space-y-2">
          {events.length === 0 ? (
            <div className="bg-white rounded-xl border border-gray-200 p-16 text-center text-gray-400">
              <div className="text-5xl mb-3">📅</div>
              <p>אין תורים עדיין</p>
            </div>
          ) : (
            events
              .sort((a, b) => a.scheduledAt.localeCompare(b.scheduledAt))
              .map((ev) => (
                <div key={ev.id} onClick={() => setSelectedEvent(ev)} className="bg-white rounded-xl border border-gray-200 p-3.5 flex items-center gap-3 cursor-pointer hover:border-indigo-200 transition-colors" style={{ borderRightWidth: "4px", borderRightColor: getColor(ev) }}>
                  <div className="text-center min-w-[44px]">
                    <div className="text-lg font-extrabold" style={{ color: getColor(ev) }}>{new Date(ev.scheduledAt).getDate()}</div>
                    <div className="text-[10px] text-gray-500">{MONTHS[new Date(ev.scheduledAt).getMonth()]}</div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm text-gray-900 truncate">{ev.name}</p>
                    {ev.client && <p className="text-xs text-gray-500">👤 {ev.client.name}</p>}
                    {ev.notes && <p className="text-xs text-gray-400 truncate">📝 {ev.notes}</p>}
                  </div>
                  {ev.scheduledAt && (
                    <div className="text-xs font-semibold px-2.5 py-1 rounded-lg" style={{ background: getColor(ev) + "15", color: getColor(ev) }}>
                      ⏰ {ev.scheduledAt.slice(11, 16)}
                    </div>
                  )}
                </div>
              ))
          )}
        </div>
      )}

      {/* Legend */}
      <div className="bg-white rounded-xl border border-gray-200 px-5 py-3 flex items-center gap-5 flex-wrap" dir="rtl">
        <span className="text-xs font-semibold text-gray-500">📅 מקרא:</span>
        {[
          { l: "חג", c: "#f59e0b", e: "✡️" },
          { l: "צום", c: "#7c3aed", e: "🕍" },
          { l: "לאומי", c: "#3b82f6", e: "🇮🇱" },
          { l: "זיכרון", c: "#374151", e: "🕯️" },
          { l: "ר״ח", c: "#6366f1", e: "🌙" },
        ].map((x) => (
          <div key={x.l} className="flex items-center gap-1.5 text-xs text-gray-600">
            <div className="w-2.5 h-2.5 rounded" style={{ background: x.c }} />
            {x.e} {x.l}
          </div>
        ))}
      </div>

      {/* Upcoming holidays */}
      {(() => {
        const upcoming = getUpcomingHolidays(60);
        if (upcoming.length === 0) return null;
        return (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4" dir="rtl">
            <p className="font-semibold text-sm text-amber-900 mb-2">✡️ חגים קרובים</p>
            <div className="space-y-1.5">
              {upcoming.map((u, i) => (
                <div key={i} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <span className="text-base">{u.holiday.emoji}</span>
                    <span className="font-medium text-gray-800">{u.holiday.name}</span>
                    <span className="text-[10px] text-gray-400">{u.hebrew.day} {u.hebrew.month}</span>
                  </div>
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-lg" style={{ background: u.holiday.color + "15", color: u.holiday.color }}>
                    {u.date.toLocaleDateString("he-IL", { day: "numeric", month: "short" })}
                  </span>
                </div>
              ))}
            </div>
          </div>
        );
      })()}

      {/* Event detail popup */}
      {selectedEvent && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setSelectedEvent(null)}>
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm" dir="rtl" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-bold text-lg mb-3">{selectedEvent.name}</h3>
            <div className="space-y-2 text-sm text-gray-600 mb-4">
              <p>📅 {new Date(selectedEvent.scheduledAt).toLocaleDateString("he-IL")} ⏰ {selectedEvent.scheduledAt?.slice(11, 16)}</p>
              {selectedEvent.client && <p>👤 {selectedEvent.client.name}</p>}
              {selectedEvent.phone && <p>📞 {selectedEvent.phone}</p>}
              {selectedEvent.notes && <p>📝 {selectedEvent.notes}</p>}
              <p>סטטוס: <span className="font-semibold" style={{ color: getColor(selectedEvent) }}>{selectedEvent.status}</span></p>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setSelectedEvent(null)} className="flex-1 py-2.5 bg-gray-100 rounded-xl text-sm font-medium">סגור</button>
              <button onClick={() => deleteEvent(selectedEvent.id)} className="py-2.5 px-4 bg-red-50 text-red-600 rounded-xl text-sm font-medium hover:bg-red-100">🗑️ מחק</button>
            </div>
          </div>
        </div>
      )}

      {/* Add modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowModal(false)}>
          <div className="bg-white rounded-2xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto" dir="rtl" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-bold text-lg mb-4">➕ הוסף תור / משימה</h3>

            {/* Type */}
            <div className="flex gap-2 mb-4">
              {([{ v: "appointment", l: "📅 תור" }, { v: "task", l: "✅ משימה" }, { v: "reminder", l: "🔔 תזכורת" }] as const).map((t) => (
                <button key={t.v} onClick={() => setNewEvent((e) => ({ ...e, type: t.v }))} className={`flex-1 py-2 rounded-lg text-xs font-medium transition-colors ${newEvent.type === t.v ? "bg-indigo-600 text-white" : "bg-gray-100 text-gray-600"}`}>
                  {t.l}
                </button>
              ))}
            </div>

            <input placeholder="כותרת *" value={newEvent.title} onChange={(e) => setNewEvent((ev) => ({ ...ev, title: e.target.value }))} className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm mb-3 outline-none focus:border-indigo-400" />

            <div className="flex gap-2 mb-3">
              <input type="date" value={newEvent.date} onChange={(e) => setNewEvent((ev) => ({ ...ev, date: e.target.value }))} className="flex-[2] border border-gray-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-indigo-400" />
              <input type="time" value={newEvent.time} onChange={(e) => setNewEvent((ev) => ({ ...ev, time: e.target.value }))} className="flex-1 border border-gray-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-indigo-400" />
            </div>

            <select value={newEvent.clientId} onChange={(e) => setNewEvent((ev) => ({ ...ev, clientId: e.target.value }))} className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm mb-3 outline-none focus:border-indigo-400">
              <option value="">בחר לקוח (אופציונלי)</option>
              {clients.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>

            <textarea placeholder="הערות..." value={newEvent.notes} onChange={(e) => setNewEvent((ev) => ({ ...ev, notes: e.target.value }))} rows={3} className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm mb-3 outline-none focus:border-indigo-400 resize-none" />

            <label className="flex items-center gap-2 mb-4 text-sm">
              <input type="checkbox" checked={newEvent.notify} onChange={(e) => setNewEvent((ev) => ({ ...ev, notify: e.target.checked }))} />
              🔔 שלח תזכורת בוואצאפ
            </label>

            <div className="flex gap-2">
              <button onClick={saveEvent} disabled={!newEvent.title} className="flex-[2] py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold text-sm disabled:opacity-40 transition-colors">💾 שמור</button>
              <button onClick={() => setShowModal(false)} className="flex-1 py-3 bg-gray-100 text-gray-600 rounded-xl text-sm">ביטול</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
