"use client";

import { useState, useEffect } from "react";
import { HDate, HebrewCalendar } from "@hebcal/core";

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

const HOLIDAY_MAP: Record<string, HebrewHoliday> = {
  "Rosh Hashana": { name: "ראש השנה", emoji: "🍎", type: "holiday", color: "#f59e0b" },
  "Yom Kippur": { name: "יום כיפור", emoji: "🕍", type: "fast", color: "#7c3aed" },
  "Sukkot": { name: "סוכות", emoji: "🌿", type: "holiday", color: "#22c55e" },
  "Shmini Atzeret": { name: "שמיני עצרת", emoji: "✡️", type: "holiday", color: "#f59e0b" },
  "Simchat Torah": { name: "שמחת תורה", emoji: "📜", type: "holiday", color: "#f59e0b" },
  "Pesach": { name: "פסח", emoji: "🍷", type: "holiday", color: "#f59e0b" },
  "Shavuot": { name: "שבועות", emoji: "📜", type: "holiday", color: "#f59e0b" },
  "Purim": { name: "פורים", emoji: "🎭", type: "holiday", color: "#ec4899" },
  "Yom HaShoah": { name: "יום השואה", emoji: "🕯️", type: "memorial", color: "#1e293b" },
  "Yom HaZikaron": { name: "יום הזיכרון", emoji: "🕯️", type: "memorial", color: "#374151" },
  "Yom HaAtzma'ut": { name: "יום העצמאות", emoji: "🇮🇱", type: "national", color: "#3b82f6" },
  "Lag BaOmer": { name: 'ל״ג בעומר', emoji: "🔥", type: "holiday", color: "#f97316" },
  "Yom Yerushalayim": { name: "יום ירושלים", emoji: "🏛️", type: "national", color: "#3b82f6" },
  "Tu B'Av": { name: 'ט״ו באב', emoji: "❤️", type: "holiday", color: "#ec4899" },
  "Tu BiShvat": { name: 'ט״ו בשבט', emoji: "🌳", type: "holiday", color: "#22c55e" },
  "Tish'a B'Av": { name: "תשעה באב", emoji: "🕍", type: "fast", color: "#7c3aed" },
};

function mapHebcalEvent(desc: string): HebrewHoliday | null {
  if (HOLIDAY_MAP[desc]) return HOLIDAY_MAP[desc];
  for (const [key, val] of Object.entries(HOLIDAY_MAP)) {
    if (desc.includes(key)) return val;
  }
  if (desc.startsWith("Rosh Chodesh")) return { name: "ראש חודש", emoji: "🌙", type: "holiday", color: "#6366f1" };
  if (desc.includes("Chanukah")) return { name: "חנוכה", emoji: "🕎", type: "holiday", color: "#3b82f6" };
  if (desc.includes("Pesach")) return { name: desc.includes("CH''M") ? "חוה״מ פסח" : "פסח", emoji: "🍷", type: "holiday", color: desc.includes("CH''M") ? "#fcd34d" : "#f59e0b" };
  if (desc.includes("Sukkot") && desc.includes("CH''M")) return { name: "חוה״מ סוכות", emoji: "🌿", type: "holiday", color: "#86efac" };
  if (desc.includes("Hoshana")) return { name: "הושענא רבה", emoji: "🌿", type: "holiday", color: "#22c55e" };
  if (desc.includes("Shushan")) return { name: "שושן פורים", emoji: "🎭", type: "holiday", color: "#ec4899" };
  if (desc.includes("Esther")) return { name: "תענית אסתר", emoji: "✡️", type: "fast", color: "#6b7280" };
  if (desc.includes("Tammuz")) return { name: 'צום י״ז בתמוז', emoji: "✡️", type: "fast", color: "#6b7280" };
  if (desc.includes("Gedaliah")) return { name: "צום גדליה", emoji: "✡️", type: "fast", color: "#6b7280" };
  if (desc.includes("Tevet")) return { name: "צום י׳ בטבת", emoji: "✡️", type: "fast", color: "#6b7280" };
  return null;
}

// Cache calendar events per Hebrew year
const calendarCache = new Map<number, { desc: string; greg: Date }[]>();

function getCalendarEvents(hYear: number): { desc: string; greg: Date }[] {
  if (calendarCache.has(hYear)) return calendarCache.get(hYear)!;
  try {
    const events = HebrewCalendar.calendar({ year: hYear, isHebrewYear: true, il: true });
    const mapped = events.map((ev) => ({ desc: ev.getDesc(), greg: ev.getDate().greg() }));
    calendarCache.set(hYear, mapped);
    return mapped;
  } catch { return []; }
}

function getHolidaysForDate(date: Date): HebrewHoliday[] {
  try {
    const hd = new HDate(date);
    const events = getCalendarEvents(hd.getFullYear());
    const dateStr = date.toDateString();
    const results: HebrewHoliday[] = [];
    const seen = new Set<string>();
    for (const ev of events) {
      if (ev.greg.toDateString() === dateStr) {
        const mapped = mapHebcalEvent(ev.desc);
        if (mapped && !seen.has(mapped.name)) {
          results.push(mapped);
          seen.add(mapped.name);
        }
      }
    }
    return results;
  } catch { return []; }
}

function getUpcomingHolidays(days: number) {
  const upcoming: { date: Date; holiday: HebrewHoliday; hebrew: ReturnType<typeof getHebrewDate> }[] = [];
  const today = new Date();
  const hYear = new HDate(today).getFullYear();
  const events = [...getCalendarEvents(hYear), ...getCalendarEvents(hYear + 1)];
  const seen = new Set<string>();
  for (const ev of events) {
    const diff = Math.floor((ev.greg.getTime() - today.getTime()) / 86400000);
    if (diff >= 0 && diff <= days) {
      const mapped = mapHebcalEvent(ev.desc);
      const key = `${ev.greg.toDateString()}-${mapped?.name}`;
      if (mapped && !seen.has(key)) {
        seen.add(key);
        upcoming.push({ date: ev.greg, holiday: mapped, hebrew: getHebrewDate(ev.greg) });
      }
    }
  }
  return upcoming.sort((a, b) => a.date.getTime() - b.date.getTime()).slice(0, 10);
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
  const [clientLeads, setClientLeads] = useState<{ id: string; firstName: string; lastName: string; phone: string | null; status: string }[]>([]);
  const [notification, setNotification] = useState("");

  const [newEvent, setNewEvent] = useState({
    title: "",
    date: new Date().toISOString().split("T")[0],
    time: "09:00",
    type: "appointment" as EventType,
    clientId: "",
    leadId: "",
    leadPhone: "",
    leadName: "",
    notes: "",
    notify: false,
    notifyLead: false,
    leadMessage: "",
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

  // Load leads when client changes
  useEffect(() => {
    if (newEvent.clientId) {
      fetch(`/api/leads?clientId=${newEvent.clientId}`)
        .then((r) => r.json())
        .then((d) => setClientLeads(d.leads ?? []))
        .catch(() => setClientLeads([]));
    } else {
      setClientLeads([]);
    }
  }, [newEvent.clientId]);

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
        leadId: newEvent.leadId || undefined,
        notes: newEvent.notes || undefined,
        type: newEvent.type,
      }),
    });
    const data = (await res.json()) as { appointment?: CalEvent };
    if (data.appointment) {
      setEvents((prev) => [...prev, { ...data.appointment!, client: clientName ? { name: clientName } : null }]);
    }

    // Send WhatsApp reminder to lead
    if (newEvent.notifyLead && newEvent.leadPhone && newEvent.leadMessage) {
      try {
        await fetch("/api/whatsapp/send", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ phone: newEvent.leadPhone, message: newEvent.leadMessage, clientId: newEvent.clientId }),
        });
        setNotification("✅ תזכורת נשלחה ללקוח בוואצאפ!");
      } catch {
        setNotification("⚠️ הפגישה נשמרה אך שליחת הוואצאפ נכשלה");
      }
      setTimeout(() => setNotification(""), 4000);
    }

    setShowModal(false);
    setNewEvent({ title: "", date: new Date().toISOString().split("T")[0], time: "09:00", type: "appointment", clientId: "", leadId: "", leadPhone: "", leadName: "", notes: "", notify: false, notifyLead: false, leadMessage: "" });
    setClientLeads([]);
  }

  async function deleteEvent(id: string) {
    await fetch(`/api/appointments/${id}`, { method: "DELETE" });
    setEvents((prev) => prev.filter((e) => e.id !== id));
    setSelectedEvent(null);
  }

  const todayEvents = getEventsForDay(new Date());

  return (
    <div className="space-y-5 max-w-6xl" dir="rtl">
      {/* Notification */}
      {notification && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 z-[9999] px-6 py-3 rounded-xl text-white font-semibold text-sm shadow-lg" style={{ background: notification.startsWith("✅") ? "#22c55e" : "#f59e0b" }}>
          {notification}
        </div>
      )}
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

            <select value={newEvent.clientId} onChange={(e) => setNewEvent((ev) => ({ ...ev, clientId: e.target.value, leadId: "", leadPhone: "", leadName: "" }))} className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm mb-3 outline-none focus:border-indigo-400">
              <option value="">בחר לקוח (אופציונלי)</option>
              {clients.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>

            {/* Lead selector */}
            {clientLeads.length > 0 && (
              <select
                value={newEvent.leadId}
                onChange={(e) => {
                  const lead = clientLeads.find((l) => l.id === e.target.value);
                  setNewEvent((ev) => ({
                    ...ev,
                    leadId: e.target.value,
                    leadPhone: lead?.phone ?? "",
                    leadName: lead ? `${lead.firstName} ${lead.lastName}` : "",
                    title: ev.title || (lead ? `פגישה עם ${lead.firstName} ${lead.lastName}` : ev.title),
                  }));
                }}
                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm mb-3 outline-none focus:border-indigo-400"
              >
                <option value="">🎯 קשר לליד...</option>
                {clientLeads.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.firstName} {l.lastName}{l.phone ? ` — ${l.phone}` : ""}
                  </option>
                ))}
              </select>
            )}

            <textarea placeholder="הערות..." value={newEvent.notes} onChange={(e) => setNewEvent((ev) => ({ ...ev, notes: e.target.value }))} rows={3} className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm mb-3 outline-none focus:border-indigo-400 resize-none" />

            {/* Lead WhatsApp reminder */}
            {newEvent.leadId && newEvent.leadPhone && (
              <div className="bg-green-50 border border-green-200 rounded-xl p-3 mb-3" dir="rtl">
                <label className="flex items-center gap-2 text-sm font-semibold text-green-800 cursor-pointer">
                  <input type="checkbox" checked={newEvent.notifyLead} onChange={(e) => {
                    const checked = e.target.checked;
                    setNewEvent((ev) => ({
                      ...ev,
                      notifyLead: checked,
                      leadMessage: checked && !ev.leadMessage
                        ? `שלום ${ev.leadName}! 👋\n\nרוצה להזכיר שיש לנו פגישה ב-${new Date(ev.date).toLocaleDateString("he-IL")} בשעה ${ev.time}.\n\nמצפים לראותך! 😊`
                        : ev.leadMessage,
                    }));
                  }} />
                  💬 שלח תזכורת ל{newEvent.leadName} בוואצאפ
                </label>
                {newEvent.notifyLead && (
                  <div className="mt-2">
                    <p className="text-[11px] text-gray-500 mb-1">📱 ישלח ל: {newEvent.leadPhone}</p>
                    <textarea
                      value={newEvent.leadMessage}
                      onChange={(e) => setNewEvent((ev) => ({ ...ev, leadMessage: e.target.value }))}
                      rows={3}
                      className="w-full border border-green-200 rounded-lg px-2.5 py-2 text-xs bg-white resize-none outline-none"
                    />
                    <div className="flex gap-1 mt-1.5 flex-wrap">
                      {[
                        { l: "📅 תזכורת", m: `שלום ${newEvent.leadName}! 👋\n\nתזכורת — יש לנו פגישה ב-${new Date(newEvent.date).toLocaleDateString("he-IL")} בשעה ${newEvent.time}.\n\nנשמח לראותך! 😊` },
                        { l: "✅ אישור", m: `שלום ${newEvent.leadName}! ✅\n\nפגישתנו מאושרת ל-${new Date(newEvent.date).toLocaleDateString("he-IL")} בשעה ${newEvent.time}.\n\nאם יש שינוי — עדכן מראש. תודה! 🙏` },
                      ].map((t) => (
                        <button key={t.l} onClick={() => setNewEvent((ev) => ({ ...ev, leadMessage: t.m }))} className="px-2 py-1 bg-white border border-green-200 rounded text-[10px] text-green-700 font-medium">
                          {t.l}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            <label className="flex items-center gap-2 mb-4 text-sm">
              <input type="checkbox" checked={newEvent.notify} onChange={(e) => setNewEvent((ev) => ({ ...ev, notify: e.target.checked }))} />
              🔔 תזכורת לעצמי
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
