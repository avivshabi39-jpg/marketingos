"use client";

import { useState, useEffect } from "react";
import { Calendar, Plus, Phone, User, Home, CheckCircle2, XCircle, Clock, Trash2 } from "lucide-react";

type Appointment = {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  notes: string | null;
  scheduledAt: string;
  status: string;
  client: { name: string; slug: string };
  lead: { firstName: string; lastName: string } | null;
  property: { title: string; slug: string } | null;
};

type FilterType = "today" | "week" | "all";

const STATUS_LABELS: Record<string, string> = {
  PENDING: "ממתין",
  CONFIRMED: "מאושר",
  DONE: "בוצע",
  CANCELLED: "בוטל",
};

const STATUS_COLORS: Record<string, string> = {
  PENDING:   "bg-yellow-100 text-yellow-800",
  CONFIRMED: "bg-green-100 text-green-800",
  DONE:      "bg-blue-100 text-blue-800",
  CANCELLED: "bg-red-100 text-red-700",
};

function startOfDay(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function isToday(d: Date) {
  return startOfDay(d).getTime() === startOfDay(new Date()).getTime();
}

function isTomorrow(d: Date) {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  return startOfDay(d).getTime() === startOfDay(tomorrow).getTime();
}

function formatGroupHeader(date: Date): string {
  if (isToday(date)) {
    return `📅 היום — ${date.toLocaleDateString("he-IL", { weekday: "long", day: "numeric", month: "numeric" })}`;
  }
  if (isTomorrow(date)) {
    return `📅 מחר — ${date.toLocaleDateString("he-IL", { weekday: "long", day: "numeric", month: "numeric" })}`;
  }
  return `📅 ${date.toLocaleDateString("he-IL", { weekday: "long", day: "numeric", month: "numeric", year: "numeric" })}`;
}

function groupByDate(appointments: Appointment[]): { dateKey: string; label: string; items: Appointment[] }[] {
  const map = new Map<string, { label: string; items: Appointment[] }>();
  for (const appt of appointments) {
    const d = new Date(appt.scheduledAt);
    const key = startOfDay(d).toISOString();
    if (!map.has(key)) {
      map.set(key, { label: formatGroupHeader(d), items: [] });
    }
    map.get(key)!.items.push(appt);
  }
  return Array.from(map.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([dateKey, val]) => ({ dateKey, ...val }));
}

function filterAppointments(appointments: Appointment[], filter: FilterType): Appointment[] {
  const now = new Date();
  const todayStart = startOfDay(now);
  const weekEnd = new Date(todayStart);
  weekEnd.setDate(weekEnd.getDate() + 7);

  return appointments.filter((appt) => {
    const d = new Date(appt.scheduledAt);
    if (filter === "today") return startOfDay(d).getTime() === todayStart.getTime();
    if (filter === "week") return d >= todayStart && d < weekEnd;
    return true;
  });
}

export default function AppointmentsPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);
  const [filter, setFilter] = useState<FilterType>("week");
  const [showForm, setShowForm] = useState(false);
  const [clients, setClients] = useState<{ id: string; name: string }[]>([]);
  const [form, setForm] = useState({
    clientId: "", name: "", phone: "", email: "", notes: "", scheduledAt: "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/appointments")
      .then((r) => r.json())
      .then((d) => setAppointments(d.appointments ?? []))
      .finally(() => setLoading(false));

    fetch("/api/clients?limit=200")
      .then((r) => r.json())
      .then((d) => setClients(d.clients ?? []));
  }, []);

  async function updateStatus(id: string, status: string) {
    setUpdating(id);
    const res = await fetch(`/api/appointments/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    if (res.ok) {
      const { appointment } = await res.json();
      setAppointments((prev) => prev.map((a) => a.id === id ? { ...a, status: appointment.status } : a));
    }
    setUpdating(null);
  }

  async function deleteAppointment(id: string) {
    if (!confirm("למחוק את הביקור?")) return;
    await fetch(`/api/appointments/${id}`, { method: "DELETE" });
    setAppointments((prev) => prev.filter((a) => a.id !== id));
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!form.clientId || !form.name || !form.scheduledAt) {
      setError("נא למלא לקוח, שם ותאריך");
      return;
    }
    setSaving(true);
    setError("");
    const res = await fetch("/api/appointments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, scheduledAt: new Date(form.scheduledAt).toISOString() }),
    });
    if (res.ok) {
      const refreshed = await fetch("/api/appointments").then((r) => r.json());
      setAppointments(refreshed.appointments ?? []);
      setShowForm(false);
      setForm({ clientId: "", name: "", phone: "", email: "", notes: "", scheduledAt: "" });
    } else {
      setError("שגיאה בשמירה");
    }
    setSaving(false);
  }

  const todayCount = appointments.filter((a) => {
    const d = new Date(a.scheduledAt);
    return isToday(d) && a.status !== "CANCELLED" && a.status !== "DONE";
  }).length;

  const filtered = filterAppointments(appointments, filter);
  const groups = groupByDate(filtered);

  const FILTERS: { key: FilterType; label: string }[] = [
    { key: "today", label: "היום" },
    { key: "week",  label: "השבוע" },
    { key: "all",   label: "הכל"   },
  ];

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6" dir="rtl">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Calendar size={24} className="text-blue-600" /> ניהול תורים
          </h1>
          {todayCount > 0 && (
            <p className="text-sm text-blue-600 font-medium mt-0.5">
              {todayCount} תורים היום
            </p>
          )}
        </div>
        <div className="flex items-center gap-3">
          {/* Filter buttons */}
          <div className="flex bg-gray-100 rounded-lg p-1 gap-1">
            {FILTERS.map((f) => (
              <button
                key={f.key}
                onClick={() => setFilter(f.key)}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  filter === f.key
                    ? "bg-white text-gray-900 shadow-sm"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
          <button
            onClick={() => setShowForm((v) => !v)}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            <Plus size={16} /> ביקור חדש
          </button>
        </div>
      </div>

      {/* Create form */}
      {showForm && (
        <form onSubmit={handleCreate} className="bg-white border border-gray-200 rounded-xl p-5 space-y-4 shadow-sm">
          <h2 className="font-semibold text-gray-800">קביעת ביקור חדש</h2>
          {error && <p className="text-red-500 text-sm">{error}</p>}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-gray-600 block mb-1">לקוח *</label>
              <select
                value={form.clientId}
                onChange={(e) => setForm({ ...form, clientId: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="">בחר לקוח</option>
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600 block mb-1">שם לקוח *</label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="ישראל ישראלי"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600 block mb-1">טלפון</label>
              <input
                type="tel"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                placeholder="050-0000000"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600 block mb-1">תאריך ושעה *</label>
              <input
                type="datetime-local"
                value={form.scheduledAt}
                onChange={(e) => setForm({ ...form, scheduledAt: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <div className="sm:col-span-2">
              <label className="text-xs font-medium text-gray-600 block mb-1">הערות</label>
              <textarea
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                rows={3}
                placeholder="פרטים נוספים..."
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              />
            </div>
          </div>
          <div className="flex gap-3 justify-end">
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800"
            >
              ביטול
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg disabled:opacity-50"
            >
              {saving ? "שומר..." : "שמור ביקור"}
            </button>
          </div>
        </form>
      )}

      {/* Content */}
      {loading ? (
        <div className="text-center py-16 text-gray-400">טוען ביקורים...</div>
      ) : groups.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border border-gray-200">
          <Calendar size={48} className="mx-auto text-gray-300 mb-3" />
          <p className="text-gray-500 font-medium">
            {filter === "today" ? "אין ביקורים היום" : filter === "week" ? "אין ביקורים השבוע" : "אין ביקורים עדיין"}
          </p>
          <p className="text-gray-400 text-sm mt-1">קבע ביקור ראשון למעלה</p>
        </div>
      ) : (
        <div className="space-y-6">
          {groups.map(({ dateKey, label, items }) => {
            const groupDate = new Date(dateKey);
            const isTodayGroup = isToday(groupDate);
            return (
              <section key={dateKey}>
                <h2 className={`text-sm font-semibold mb-3 ${isTodayGroup ? "text-blue-700" : "text-gray-500"}`}>
                  {label}
                  {isTodayGroup && (
                    <span className="mr-2 text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-medium">
                      היום
                    </span>
                  )}
                </h2>
                <div className="space-y-2">
                  {items.map((appt) => (
                    <AppointmentCard
                      key={appt.id}
                      appt={appt}
                      updating={updating}
                      isToday={isTodayGroup}
                      onStatus={updateStatus}
                      onDelete={deleteAppointment}
                    />
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}

function AppointmentCard({
  appt,
  updating,
  isToday: isTodayCard,
  onStatus,
  onDelete,
}: {
  appt: Appointment;
  updating: string | null;
  isToday: boolean;
  onStatus: (id: string, status: string) => void;
  onDelete: (id: string) => void;
}) {
  const date = new Date(appt.scheduledAt);
  const isDisabled = updating === appt.id;

  return (
    <div
      className={`bg-white border rounded-xl p-4 flex flex-col sm:flex-row sm:items-center gap-4 shadow-sm transition-colors ${
        isTodayCard && appt.status === "PENDING"
          ? "border-blue-200 ring-1 ring-blue-100"
          : "border-gray-200"
      }`}
    >
      {/* Time badge */}
      <div className={`flex-shrink-0 w-14 text-center rounded-lg py-2 ${isTodayCard ? "bg-blue-50" : "bg-gray-50"}`}>
        <p className={`text-sm font-bold leading-tight ${isTodayCard ? "text-blue-700" : "text-gray-700"}`}>
          {date.toLocaleTimeString("he-IL", { hour: "2-digit", minute: "2-digit" })}
        </p>
      </div>

      <div className="flex-1 space-y-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[appt.status] ?? "bg-gray-100 text-gray-600"}`}>
            {STATUS_LABELS[appt.status] ?? appt.status}
          </span>
          <span className="text-sm font-semibold text-gray-900 flex items-center gap-1">
            <User size={13} className="text-gray-400" /> {appt.name}
          </span>
        </div>
        <div className="flex items-center gap-4 text-xs text-gray-500 flex-wrap">
          {appt.phone && (
            <a href={`tel:${appt.phone}`} className="flex items-center gap-1 hover:text-blue-600">
              <Phone size={12} /> {appt.phone}
            </a>
          )}
          {appt.property && (
            <span className="flex items-center gap-1">
              <Home size={12} /> {appt.property.title}
            </span>
          )}
          <span className="text-gray-400">{appt.client.name}</span>
        </div>
        {appt.notes && (
          <p className="text-xs text-gray-500 bg-gray-50 rounded px-2 py-1 mt-1 line-clamp-2">{appt.notes}</p>
        )}
      </div>

      <div className="flex items-center gap-2 shrink-0">
        {appt.status === "PENDING" && (
          <>
            <button
              onClick={() => onStatus(appt.id, "CONFIRMED")}
              disabled={isDisabled}
              className="flex items-center gap-1 text-xs bg-green-500 hover:bg-green-600 text-white px-3 py-1.5 rounded-lg font-medium transition-colors disabled:opacity-50"
            >
              <CheckCircle2 size={13} /> אשר
            </button>
            <button
              onClick={() => onStatus(appt.id, "CANCELLED")}
              disabled={isDisabled}
              className="flex items-center gap-1 text-xs bg-red-500 hover:bg-red-600 text-white px-3 py-1.5 rounded-lg font-medium transition-colors disabled:opacity-50"
            >
              <XCircle size={13} /> בטל
            </button>
          </>
        )}
        {appt.status === "CONFIRMED" && (
          <>
            <span className="text-xs font-semibold text-green-600 flex items-center gap-1">
              <CheckCircle2 size={13} /> אושר
            </span>
            <button
              onClick={() => onStatus(appt.id, "DONE")}
              disabled={isDisabled}
              className="flex items-center gap-1 text-xs bg-blue-50 hover:bg-blue-100 text-blue-700 px-2 py-1.5 rounded-lg font-medium transition-colors disabled:opacity-50"
            >
              בוצע
            </button>
            <button
              onClick={() => onStatus(appt.id, "CANCELLED")}
              disabled={isDisabled}
              className="flex items-center gap-1 text-xs bg-red-50 hover:bg-red-100 text-red-600 px-2 py-1.5 rounded-lg font-medium transition-colors disabled:opacity-50"
            >
              <XCircle size={13} /> בטל
            </button>
          </>
        )}
        {appt.status === "CANCELLED" && (
          <span className="text-xs font-semibold text-red-500 flex items-center gap-1">
            <XCircle size={13} /> בוטל
          </span>
        )}
        {appt.status === "DONE" && (
          <span className="text-xs font-semibold text-blue-600 flex items-center gap-1">
            <CheckCircle2 size={13} /> בוצע
          </span>
        )}
        <button
          onClick={() => onDelete(appt.id)}
          className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
        >
          <Trash2 size={14} />
        </button>
      </div>
    </div>
  );
}
