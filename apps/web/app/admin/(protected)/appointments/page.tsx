"use client";

import { useState, useEffect, useMemo } from "react";
import { getHebrewDate, getHebrewMonthRange, getHolidaysForDate, getUpcomingHolidays } from "@/lib/hebrewCalendar";
import { PageHeader } from "@/components/ui/PageHeader";
import { CalendarDays, List, ChevronRight, ChevronLeft, Plus, X, Trash2, Clock, User, Phone, FileText, MessageSquare, Loader2 } from "lucide-react";

type EventType = "appointment" | "task" | "reminder";
type CalView = "month" | "week" | "list";

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
const WEEKDAYS_SHORT = ["א׳", "ב׳", "ג׳", "ד׳", "ה׳", "ו׳", "ש׳"];
const STATUS_COLORS: Record<string, string> = {
  PENDING: "#D97706",
  CONFIRMED: "#059669",
  DONE: "#3B82F6",
  CANCELLED: "#DC2626",
};
const STATUS_HE: Record<string, string> = {
  PENDING: "ממתין",
  CONFIRMED: "מאושר",
  DONE: "הושלם",
  CANCELLED: "בוטל",
};
const HOURS = Array.from({ length: 13 }, (_, i) => i + 8); // 08:00 - 20:00

function getColor(event: CalEvent): string {
  return STATUS_COLORS[event.status] ?? "#3B82F6";
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

function getWeekDays(date: Date): Date[] {
  const day = date.getDay();
  const start = new Date(date);
  start.setDate(start.getDate() - day); // Sunday
  const days: Date[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(start);
    d.setDate(d.getDate() + i);
    days.push(d);
  }
  return days;
}

function isToday(d: Date): boolean {
  return d.toDateString() === new Date().toDateString();
}

function isSameDay(a: Date, b: Date): boolean {
  return a.toDateString() === b.toDateString();
}

export default function AppointmentsPage() {
  const [view, setView] = useState<CalView>("week");
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState<CalEvent[]>([]);
  const [clients, setClients] = useState<ClientOption[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<CalEvent | null>(null);
  const [clientLeads, setClientLeads] = useState<{ id: string; firstName: string; lastName: string; phone: string | null; status: string }[]>([]);
  const [notification, setNotification] = useState("");
  const [saving, setSaving] = useState(false);

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
  const weekDays = getWeekDays(currentDate);

  function getEventsForDay(day: Date): CalEvent[] {
    const ds = day.toISOString().split("T")[0];
    return events.filter((e) => e.scheduledAt?.startsWith(ds)).sort((a, b) => a.scheduledAt.localeCompare(b.scheduledAt));
  }

  function getEventsForHour(day: Date, hour: number): CalEvent[] {
    const ds = day.toISOString().split("T")[0];
    const hStr = hour.toString().padStart(2, "0");
    return events.filter((e) => e.scheduledAt?.startsWith(ds) && e.scheduledAt?.slice(11, 13) === hStr);
  }

  function openAddModal(day?: Date, hour?: number) {
    setNewEvent((e) => ({
      ...e,
      date: (day ?? new Date()).toISOString().split("T")[0],
      time: hour !== undefined ? `${hour.toString().padStart(2, "0")}:00` : "09:00",
      title: "",
      notes: "",
      clientId: "",
      leadId: "",
      leadPhone: "",
      leadName: "",
    }));
    setSelectedEvent(null);
    setShowModal(true);
  }

  async function saveEvent() {
    if (!newEvent.title) return;
    setSaving(true);
    try {
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

      if (newEvent.notifyLead && newEvent.leadPhone && newEvent.leadMessage) {
        try {
          await fetch("/api/whatsapp/send", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ phone: newEvent.leadPhone, message: newEvent.leadMessage, clientId: newEvent.clientId }),
          });
          setNotification("תזכורת נשלחה ללקוח בוואצאפ!");
        } catch {
          setNotification("הפגישה נשמרה אך שליחת הוואצאפ נכשלה");
        }
        setTimeout(() => setNotification(""), 4000);
      }

      setShowModal(false);
      setNewEvent({ title: "", date: new Date().toISOString().split("T")[0], time: "09:00", type: "appointment", clientId: "", leadId: "", leadPhone: "", leadName: "", notes: "", notify: false, notifyLead: false, leadMessage: "" });
      setClientLeads([]);
    } finally {
      setSaving(false);
    }
  }

  async function deleteEvent(id: string) {
    await fetch(`/api/appointments/${id}`, { method: "DELETE" });
    setEvents((prev) => prev.filter((e) => e.id !== id));
    setSelectedEvent(null);
  }

  function navigatePrev() {
    if (view === "month") setCurrentDate((d) => new Date(d.getFullYear(), d.getMonth() - 1, 1));
    else if (view === "week") setCurrentDate((d) => { const n = new Date(d); n.setDate(n.getDate() - 7); return n; });
  }
  function navigateNext() {
    if (view === "month") setCurrentDate((d) => new Date(d.getFullYear(), d.getMonth() + 1, 1));
    else if (view === "week") setCurrentDate((d) => { const n = new Date(d); n.setDate(n.getDate() + 7); return n; });
  }

  const todayEvents = getEventsForDay(new Date());

  return (
    <div className="space-y-5 max-w-7xl" dir="rtl">
      {/* Notification */}
      {notification && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 z-[9999] px-6 py-3 rounded-xl text-white font-semibold text-sm shadow-lg bg-emerald-600">
          {notification}
        </div>
      )}

      {/* Header */}
      <PageHeader title="לוח תורים ומשימות" subtitle={todayEvents.length > 0 ? `היום יש ${todayEvents.length} אירועים` : undefined}>
        <button onClick={() => openAddModal()} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl px-5 py-2.5 text-sm transition-colors shadow-sm">
          <Plus size={16} />
          הוסף תור
        </button>
      </PageHeader>

      {/* Nav bar */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm px-5 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={navigateNext} className="p-2 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors">
            <ChevronRight size={16} />
          </button>
          <h2 className="text-lg font-bold text-slate-900 min-w-[200px] text-center">
            {view === "week" ? (
              <>
                {weekDays[0].toLocaleDateString("he-IL", { day: "numeric", month: "short" })} — {weekDays[6].toLocaleDateString("he-IL", { day: "numeric", month: "short" })}
              </>
            ) : (
              <>
                {MONTHS[currentDate.getMonth()]} {currentDate.getFullYear()}
                <span className="text-xs font-normal text-slate-400 mr-2">{getHebrewMonthRange(currentDate)}</span>
              </>
            )}
          </h2>
          <button onClick={navigatePrev} className="p-2 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors">
            <ChevronLeft size={16} />
          </button>
          <button onClick={() => setCurrentDate(new Date())} className="px-3 py-1.5 bg-blue-50 text-blue-600 rounded-xl text-xs font-semibold hover:bg-blue-100 transition-colors">
            היום
          </button>
        </div>
        <div className="flex gap-1 bg-slate-100 p-1 rounded-xl">
          {([
            { key: "week" as CalView, label: "שבוע", icon: CalendarDays },
            { key: "month" as CalView, label: "חודש", icon: CalendarDays },
            { key: "list" as CalView, label: "רשימה", icon: List },
          ]).map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setView(key)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-150 ${
                view === key ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Weekly View */}
      {view === "week" && (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          {/* Day headers */}
          <div className="grid grid-cols-[60px_repeat(7,1fr)] border-b border-slate-100">
            <div className="p-2" />
            {weekDays.map((day, i) => {
              const today = isToday(day);
              const dayEvents = getEventsForDay(day);
              return (
                <div key={i} className={`p-3 text-center border-r border-slate-100 first:border-r-0 ${today ? "bg-blue-50/50" : ""}`}>
                  <div className="text-xs text-slate-500 font-medium">{WEEKDAYS_SHORT[day.getDay()]}</div>
                  <div className={`text-lg font-bold mt-0.5 ${today ? "text-blue-600" : "text-slate-900"}`}>
                    {day.getDate()}
                  </div>
                  {dayEvents.length > 0 && (
                    <div className="flex gap-0.5 justify-center mt-1">
                      {dayEvents.slice(0, 3).map((_, ei) => (
                        <div key={ei} className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          {/* Time grid */}
          <div className="max-h-[600px] overflow-y-auto">
            {HOURS.map((hour) => (
              <div key={hour} className="grid grid-cols-[60px_repeat(7,1fr)] border-b border-slate-50 min-h-[60px]">
                <div className="p-2 text-xs text-slate-400 font-medium text-center border-r border-slate-100">
                  {hour.toString().padStart(2, "0")}:00
                </div>
                {weekDays.map((day, di) => {
                  const hourEvents = getEventsForHour(day, hour);
                  const today = isToday(day);
                  return (
                    <div
                      key={di}
                      onClick={() => openAddModal(day, hour)}
                      className={`border-r border-slate-50 first:border-r-0 p-1 cursor-pointer hover:bg-slate-50/50 transition-colors ${today ? "bg-blue-50/20" : ""}`}
                    >
                      {hourEvents.map((ev) => (
                        <div
                          key={ev.id}
                          onClick={(e) => { e.stopPropagation(); setSelectedEvent(ev); }}
                          className="px-2 py-1 rounded-lg text-[11px] font-medium mb-0.5 cursor-pointer hover:opacity-80 transition-opacity"
                          style={{ backgroundColor: getColor(ev) + "15", color: getColor(ev), borderRight: `3px solid ${getColor(ev)}` }}
                        >
                          <div className="font-semibold truncate">{ev.name}</div>
                          {ev.client && <div className="text-[10px] opacity-70 truncate">{ev.client.name}</div>}
                        </div>
                      ))}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Month View */}
      {view === "month" && (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="grid grid-cols-7">
            {WEEKDAYS.map((d) => (
              <div key={d} className="px-2 py-3 text-center text-xs font-semibold text-slate-500 bg-slate-50 border-b border-slate-100">{d}</div>
            ))}
          </div>
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
                  className={`min-h-[100px] p-1.5 cursor-pointer transition-colors border-b border-r border-slate-50 last:border-r-0 hover:bg-slate-50/50 ${!sameMonth ? "opacity-40" : ""}`}
                  style={{ background: today ? "#EFF6FF" : holBg || undefined }}
                >
                  <div className="flex items-start justify-between mb-1">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${today ? "bg-blue-600 text-white font-bold" : "text-slate-700"}`}>
                      {day.getDate()}
                    </div>
                    <span className={`text-[10px] leading-none ${heb.isRC ? "text-blue-600 font-bold" : "text-slate-300"}`}>
                      {heb.day}
                    </span>
                  </div>
                  {heb.isRC && (
                    <div className="text-[8px] text-blue-500 font-semibold bg-blue-50 rounded px-1 py-0.5 mb-0.5 inline-block">ר״ח {heb.month}</div>
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
                      className="px-1.5 py-0.5 rounded-lg text-[10px] font-medium mb-0.5 truncate cursor-pointer hover:opacity-80"
                      style={{ background: getColor(ev) + "15", color: getColor(ev), borderRight: `3px solid ${getColor(ev)}` }}
                    >
                      {ev.scheduledAt?.slice(11, 16)} {ev.name}
                    </div>
                  ))}
                  {dayEvents.length > 3 && <div className="text-[10px] text-slate-400">+{dayEvents.length - 3} עוד</div>}
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
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-16 text-center">
              <div className="text-5xl mb-3">📅</div>
              <p className="text-slate-500">אין תורים עדיין</p>
            </div>
          ) : (
            events
              .sort((a, b) => a.scheduledAt.localeCompare(b.scheduledAt))
              .map((ev) => (
                <div
                  key={ev.id}
                  onClick={() => setSelectedEvent(ev)}
                  className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 flex items-center gap-4 cursor-pointer hover:border-blue-200 hover:shadow-md transition-all duration-200"
                  style={{ borderRightWidth: "4px", borderRightColor: getColor(ev) }}
                >
                  <div className="text-center min-w-[48px]">
                    <div className="text-xl font-extrabold" style={{ color: getColor(ev) }}>{new Date(ev.scheduledAt).getDate()}</div>
                    <div className="text-[10px] text-slate-500">{MONTHS[new Date(ev.scheduledAt).getMonth()]}</div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm text-slate-900 truncate">{ev.name}</p>
                    {ev.client && <p className="text-xs text-slate-500 flex items-center gap-1"><User size={11} />{ev.client.name}</p>}
                    {ev.notes && <p className="text-xs text-slate-400 truncate"><FileText size={11} className="inline" /> {ev.notes}</p>}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium px-2.5 py-1 rounded-lg" style={{ background: getColor(ev) + "15", color: getColor(ev) }}>
                      {STATUS_HE[ev.status] ?? ev.status}
                    </span>
                    <span className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-slate-100 text-slate-600 flex items-center gap-1">
                      <Clock size={11} />
                      {ev.scheduledAt.slice(11, 16)}
                    </span>
                  </div>
                </div>
              ))
          )}
        </div>
      )}

      {/* Status legend */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm px-5 py-3 flex items-center gap-5 flex-wrap" dir="rtl">
        <span className="text-xs font-semibold text-slate-500">מקרא סטטוסים:</span>
        {Object.entries(STATUS_HE).map(([key, label]) => (
          <div key={key} className="flex items-center gap-1.5 text-xs text-slate-600">
            <div className="w-2.5 h-2.5 rounded" style={{ background: STATUS_COLORS[key] }} />
            {label}
          </div>
        ))}
      </div>

      {/* Upcoming holidays */}
      {(() => {
        const upcoming = getUpcomingHolidays(60);
        if (upcoming.length === 0) return null;
        return (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4" dir="rtl">
            <p className="font-semibold text-sm text-amber-900 mb-2">חגים קרובים</p>
            <div className="space-y-1.5">
              {upcoming.map((u, i) => (
                <div key={i} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <span className="text-base">{u.holiday.emoji}</span>
                    <span className="font-medium text-slate-800">{u.holiday.name}</span>
                    <span className="text-[10px] text-slate-400">{u.hebrew.day} {u.hebrew.month}</span>
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

      {/* Event detail modal */}
      {selectedEvent && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50" onClick={() => setSelectedEvent(null)}>
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl" dir="rtl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-lg text-slate-900">{selectedEvent.name}</h3>
              <button onClick={() => setSelectedEvent(null)} className="text-slate-400 hover:text-slate-600 transition-colors">
                <X size={18} />
              </button>
            </div>
            <div className="space-y-3 text-sm text-slate-600 mb-5">
              <div className="flex items-center gap-2">
                <CalendarDays size={14} className="text-slate-400" />
                {new Date(selectedEvent.scheduledAt).toLocaleDateString("he-IL")}
                <Clock size={14} className="text-slate-400 mr-2" />
                {selectedEvent.scheduledAt?.slice(11, 16)}
              </div>
              {selectedEvent.client && (
                <div className="flex items-center gap-2">
                  <User size={14} className="text-slate-400" />
                  {selectedEvent.client.name}
                </div>
              )}
              {selectedEvent.phone && (
                <div className="flex items-center gap-2">
                  <Phone size={14} className="text-slate-400" />
                  <a href={`tel:${selectedEvent.phone}`} className="text-blue-600 hover:underline">{selectedEvent.phone}</a>
                </div>
              )}
              {selectedEvent.notes && (
                <div className="flex items-start gap-2">
                  <FileText size={14} className="text-slate-400 mt-0.5" />
                  {selectedEvent.notes}
                </div>
              )}
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold px-2.5 py-1 rounded-lg" style={{ background: getColor(selectedEvent) + "15", color: getColor(selectedEvent) }}>
                  {STATUS_HE[selectedEvent.status] ?? selectedEvent.status}
                </span>
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setSelectedEvent(null)} className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 rounded-xl text-sm font-medium text-slate-700 transition-colors">סגור</button>
              <button onClick={() => deleteEvent(selectedEvent.id)} className="py-2.5 px-4 bg-red-50 text-red-600 rounded-xl text-sm font-medium hover:bg-red-100 transition-colors flex items-center gap-1.5">
                <Trash2 size={14} />
                מחק
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50" onClick={() => setShowModal(false)}>
          <div className="bg-white rounded-2xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto shadow-2xl" dir="rtl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-lg text-slate-900">הוסף תור / משימה</h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600 transition-colors">
                <X size={18} />
              </button>
            </div>

            {/* Type */}
            <div className="flex gap-2 mb-4 bg-slate-100 p-1 rounded-xl">
              {([{ v: "appointment", l: "תור" }, { v: "task", l: "משימה" }, { v: "reminder", l: "תזכורת" }] as const).map((t) => (
                <button key={t.v} onClick={() => setNewEvent((e) => ({ ...e, type: t.v }))} className={`flex-1 py-2 rounded-lg text-xs font-medium transition-all duration-150 ${newEvent.type === t.v ? "bg-white text-slate-900 shadow-sm" : "text-slate-500"}`}>
                  {t.l}
                </button>
              ))}
            </div>

            <input placeholder="כותרת *" value={newEvent.title} onChange={(e) => setNewEvent((ev) => ({ ...ev, title: e.target.value }))} className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm mb-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all duration-150 placeholder:text-slate-400" />

            <div className="flex gap-2 mb-3">
              <input type="date" value={newEvent.date} onChange={(e) => setNewEvent((ev) => ({ ...ev, date: e.target.value }))} className="flex-[2] border border-slate-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all duration-150" />
              <input type="time" value={newEvent.time} onChange={(e) => setNewEvent((ev) => ({ ...ev, time: e.target.value }))} className="flex-1 border border-slate-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all duration-150" />
            </div>

            <select value={newEvent.clientId} onChange={(e) => setNewEvent((ev) => ({ ...ev, clientId: e.target.value, leadId: "", leadPhone: "", leadName: "" }))} className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm mb-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 bg-white transition-all duration-150">
              <option value="">בחר לקוח (אופציונלי)</option>
              {clients.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>

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
                className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm mb-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 bg-white transition-all duration-150"
              >
                <option value="">קשר לליד...</option>
                {clientLeads.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.firstName} {l.lastName}{l.phone ? ` — ${l.phone}` : ""}
                  </option>
                ))}
              </select>
            )}

            <textarea placeholder="הערות..." value={newEvent.notes} onChange={(e) => setNewEvent((ev) => ({ ...ev, notes: e.target.value }))} rows={3} className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm mb-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 resize-none transition-all duration-150 placeholder:text-slate-400" />

            {/* Lead WhatsApp reminder */}
            {newEvent.leadId && newEvent.leadPhone && (
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 mb-3" dir="rtl">
                <label className="flex items-center gap-2 text-sm font-semibold text-emerald-800 cursor-pointer">
                  <input type="checkbox" checked={newEvent.notifyLead} onChange={(e) => {
                    const checked = e.target.checked;
                    setNewEvent((ev) => ({
                      ...ev,
                      notifyLead: checked,
                      leadMessage: checked && !ev.leadMessage
                        ? `שלום ${ev.leadName}!\n\nרוצה להזכיר שיש לנו פגישה ב-${new Date(ev.date).toLocaleDateString("he-IL")} בשעה ${ev.time}.\n\nמצפים לראותך!`
                        : ev.leadMessage,
                    }));
                  }} className="rounded" />
                  <MessageSquare size={14} />
                  שלח תזכורת ל{newEvent.leadName} בוואצאפ
                </label>
                {newEvent.notifyLead && (
                  <div className="mt-2">
                    <p className="text-[11px] text-slate-500 mb-1">ישלח ל: {newEvent.leadPhone}</p>
                    <textarea
                      value={newEvent.leadMessage}
                      onChange={(e) => setNewEvent((ev) => ({ ...ev, leadMessage: e.target.value }))}
                      rows={3}
                      className="w-full border border-emerald-200 rounded-xl px-3 py-2 text-xs bg-white resize-none outline-none focus:border-emerald-400"
                    />
                    <div className="flex gap-1 mt-1.5 flex-wrap">
                      {[
                        { l: "תזכורת", m: `שלום ${newEvent.leadName}!\n\nתזכורת — יש לנו פגישה ב-${new Date(newEvent.date).toLocaleDateString("he-IL")} בשעה ${newEvent.time}.\n\nנשמח לראותך!` },
                        { l: "אישור", m: `שלום ${newEvent.leadName}!\n\nפגישתנו מאושרת ל-${new Date(newEvent.date).toLocaleDateString("he-IL")} בשעה ${newEvent.time}.\n\nאם יש שינוי — עדכן מראש. תודה!` },
                      ].map((t) => (
                        <button key={t.l} onClick={() => setNewEvent((ev) => ({ ...ev, leadMessage: t.m }))} className="px-2.5 py-1 bg-white border border-emerald-200 rounded-lg text-[10px] text-emerald-700 font-medium hover:bg-emerald-50 transition-colors">
                          {t.l}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="flex gap-2">
              <button onClick={saveEvent} disabled={!newEvent.title || saving} className="flex-[2] py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-sm disabled:opacity-40 transition-colors flex items-center justify-center gap-2">
                {saving ? <><Loader2 size={14} className="animate-spin" /> שומר...</> : "שמור"}
              </button>
              <button onClick={() => setShowModal(false)} className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl text-sm font-medium transition-colors">ביטול</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
