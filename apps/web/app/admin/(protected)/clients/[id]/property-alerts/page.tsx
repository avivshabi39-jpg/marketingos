"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Bell, Plus, Trash2, Loader2, ArrowRight, User, Phone, MapPin, DollarSign, BedDouble, Send } from "lucide-react";
import toast from "react-hot-toast";

type Alert = {
  id: string;
  name: string;
  phone: string;
  budget: number | null;
  rooms: number | null;
  city: string | null;
  createdAt: string;
};

export default function PropertyAlertsPage() {
  const params = useParams();
  const clientId = params.id as string;

  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: "", phone: "", budget: "", rooms: "", city: "" });
  const [saving, setSaving] = useState(false);
  const [showSendAll, setShowSendAll] = useState(false);
  const [properties, setProperties] = useState<{ id: string; title: string; price: number }[]>([]);
  const [selectedPropertyId, setSelectedPropertyId] = useState("");
  const [sending, setSending] = useState(false);

  const load = useCallback(async () => {
    const res = await fetch(`/api/property-alerts?clientId=${clientId}`);
    if (res.ok) {
      const data = await res.json();
      setAlerts(data.alerts ?? []);
    }
    setLoading(false);
  }, [clientId]);

  useEffect(() => { load(); }, [load]);

  async function handleAdd() {
    if (!form.name || !form.phone) { toast.error("שם וטלפון חובה"); return; }
    setSaving(true);
    try {
      const res = await fetch("/api/property-alerts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientId,
          name: form.name,
          phone: form.phone,
          budget: form.budget ? Number(form.budget) : undefined,
          rooms: form.rooms ? Number(form.rooms) : undefined,
          city: form.city || undefined,
        }),
      });
      if (res.ok) {
        toast.success("מנוי נוסף בהצלחה");
        setForm({ name: "", phone: "", budget: "", rooms: "", city: "" });
        setShowForm(false);
        load();
      } else {
        toast.error("שגיאה בהוספת מנוי");
      }
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    await fetch(`/api/property-alerts/${id}`, { method: "DELETE" });
    toast.success("מנוי הוסר");
    load();
  }

  async function openSendAll() {
    const res = await fetch(`/api/properties?clientId=${clientId}&limit=50`);
    const data = await res.json();
    setProperties(data.properties ?? []);
    setShowSendAll(true);
  }

  async function handleSendAll() {
    if (!selectedPropertyId) return;
    setSending(true);
    try {
      const res = await fetch("/api/property-alerts/broadcast", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clientId, propertyId: selectedPropertyId }),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(`נשלחו ${data.sent ?? 0} הודעות`);
        setShowSendAll(false);
        setSelectedPropertyId("");
      } else {
        toast.error(data.error ?? "שגיאה");
      }
    } catch {
      toast.error("שגיאת חיבור");
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="space-y-6" dir="rtl">
      <div className="flex items-center gap-3">
        <Link href={`/admin/clients/${clientId}`} className="text-gray-400 hover:text-gray-600">
          <ArrowRight size={18} />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Bell size={22} className="text-amber-500" /> התראות נכסים
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">רשימת קונים פוטנציאלים לקבלת התראה כשמתווסף נכס מתאים</p>
        </div>
      </div>

      <div className="flex gap-3 flex-wrap">
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 text-sm bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition"
        >
          <Plus size={15} /> הוסף מנוי
        </button>
        {alerts.length > 0 && (
          <button
            onClick={openSendAll}
            className="flex items-center gap-2 text-sm bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition"
          >
            <Send size={15} /> שלח עדכון לכולם
          </button>
        )}
      </div>

      {showSendAll && (
        <div className="bg-white rounded-xl border border-green-200 p-5 shadow-sm">
          <h3 className="font-semibold text-gray-800 mb-3 text-sm">שלח עדכון נכס לכל המנויים</h3>
          <div className="flex gap-3">
            <select
              value={selectedPropertyId}
              onChange={(e) => setSelectedPropertyId(e.target.value)}
              className="flex-1 rounded-lg border border-gray-200 px-3 py-2 text-sm focus:ring-2 focus:ring-green-300 outline-none"
            >
              <option value="">בחר נכס...</option>
              {properties.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.title} — ₪{p.price.toLocaleString("he-IL")}
                </option>
              ))}
            </select>
            <button
              disabled={!selectedPropertyId || sending}
              onClick={handleSendAll}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg text-sm disabled:opacity-50 hover:bg-green-700"
            >
              {sending ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
              {sending ? "שולח..." : "שלח"}
            </button>
            <button
              onClick={() => setShowSendAll(false)}
              className="px-4 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50"
            >
              ביטול
            </button>
          </div>
          <p className="text-xs text-gray-400 mt-2">
            ישלח הודעת וואטסאפ ל-{alerts.length} מנויים שהנכס תואם לקריטריונים שלהם (סובלנות 20% על תקציב)
          </p>
        </div>
      )}

      {showForm && (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <h3 className="font-semibold text-gray-900 mb-4 text-sm">מנוי חדש</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              { key: "name", label: "שם מלא *", icon: User, placeholder: "ישראל ישראלי", type: "text" },
              { key: "phone", label: "טלפון *", icon: Phone, placeholder: "050-0000000", type: "tel" },
              { key: "city", label: "עיר", icon: MapPin, placeholder: "תל אביב", type: "text" },
              { key: "budget", label: "תקציב מקסימלי (₪)", icon: DollarSign, placeholder: "2500000", type: "number" },
              { key: "rooms", label: "מספר חדרים", icon: BedDouble, placeholder: "4", type: "number" },
            ].map(({ key, label, placeholder, type }) => (
              <div key={key}>
                <label className="text-xs font-medium text-gray-600 block mb-1">{label}</label>
                <input
                  type={type}
                  value={form[key as keyof typeof form]}
                  onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
                  placeholder={placeholder}
                  dir={type === "tel" || type === "number" ? "ltr" : "rtl"}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-300 outline-none"
                />
              </div>
            ))}
          </div>
          <div className="flex gap-3 mt-4">
            <button
              onClick={handleAdd}
              disabled={saving}
              className="flex items-center gap-2 text-sm bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition"
            >
              {saving ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
              הוסף מנוי
            </button>
            <button
              onClick={() => setShowForm(false)}
              className="text-sm text-gray-600 border border-gray-200 px-4 py-2 rounded-lg hover:bg-gray-50 transition"
            >
              ביטול
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 size={24} className="animate-spin text-gray-300" />
        </div>
      ) : alerts.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm flex flex-col items-center py-16">
          <Bell size={36} className="text-gray-200 mb-3" />
          <p className="text-sm text-gray-500">אין מנויים להתראות</p>
          <p className="text-xs text-gray-400 mt-1">הוסף קונים פוטנציאלים שיקבלו וואצאפ כשמתווסף נכס מתאים</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-5 py-3 border-b border-gray-50">
            <span className="text-sm font-medium text-gray-700">{alerts.length} מנויים פעילים</span>
          </div>
          <div className="divide-y divide-gray-50">
            {alerts.map((a) => (
              <div key={a.id} className="px-5 py-3 flex items-center gap-4">
                <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0">
                  <Bell size={14} className="text-amber-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900">{a.name}</p>
                  <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                    <span className="text-xs text-gray-400">{a.phone}</span>
                    {a.city && <span className="text-xs text-gray-400">📍 {a.city}</span>}
                    {a.budget && <span className="text-xs text-gray-400">💰 עד ₪{a.budget.toLocaleString()}</span>}
                    {a.rooms && <span className="text-xs text-gray-400">🛏 {a.rooms} חד׳</span>}
                  </div>
                </div>
                <span className="text-xs text-gray-300">{new Date(a.createdAt).toLocaleDateString("he-IL")}</span>
                <button
                  onClick={() => handleDelete(a.id)}
                  className="text-red-400 hover:text-red-600 transition flex-shrink-0"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
