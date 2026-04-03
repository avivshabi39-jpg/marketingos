"use client";

import { useState, useEffect, useCallback } from "react";
import { Mail, Plus, Trash2, Send, Edit3, Eye, Loader2, X, Check } from "lucide-react";
import toast from "react-hot-toast";

type Template = {
  id: string;
  name: string;
  subject: string;
  bodyHtml: string;
  type: string;
  updatedAt: string;
};

const TYPE_LABELS: Record<string, string> = {
  welcome: "ברוכים הבאים",
  followup: "פולו-אפ",
  report: "דוח שבועי",
  "property-alert": "התראת נכס",
  custom: "מותאם אישית",
};

const TYPE_COLORS: Record<string, string> = {
  welcome: "bg-green-50 text-green-700",
  followup: "bg-blue-50 text-blue-700",
  report: "bg-purple-50 text-purple-700",
  "property-alert": "bg-amber-50 text-amber-700",
  custom: "bg-gray-100 text-gray-600",
};

const DEFAULT_TEMPLATES = [
  {
    name: "ברוכים הבאים — ליד חדש",
    subject: "תודה שפנית ל{business}!",
    type: "welcome" as const,
    bodyHtml: `<div dir="rtl" style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px">
  <h1 style="color:#6366f1">שלום {name}!</h1>
  <p>תודה שפנית אלינו. קיבלנו את פנייתך ונחזור אליך בהקדם.</p>
  <p>לשאלות דחופות ניתן ליצור קשר בטלפון <strong>{phone}</strong></p>
  <hr style="border:none;border-top:1px solid #e5e7eb;margin:20px 0"/>
  <p style="color:#9ca3af;font-size:12px">הודעה זו נשלחה אוטומטית ממערכת MarketingOS</p>
</div>`,
  },
  {
    name: "פולו-אפ — 3 ימים",
    subject: "האם ראית את ההצעה שלנו? 🏠",
    type: "followup" as const,
    bodyHtml: `<div dir="rtl" style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px">
  <h2 style="color:#374151">היי {name}, זכרנו אותך!</h2>
  <p>פנית אלינו לפני מספר ימים — רצינו לבדוק אם יש שאלות שנוכל לענות עליהן.</p>
  <p>אנחנו כאן בשבילך 😊</p>
  <a href="#" style="display:inline-block;background:#6366f1;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:bold">צור קשר עכשיו</a>
  <hr style="border:none;border-top:1px solid #e5e7eb;margin:20px 0"/>
  <p style="color:#9ca3af;font-size:12px">לביטול קבלת הודעות <a href="#">לחץ כאן</a></p>
</div>`,
  },
  {
    name: "התראת נכס — נמצא התאמה",
    subject: "🏠 נמצא נכס מתאים עבורך!",
    type: "property-alert" as const,
    bodyHtml: `<div dir="rtl" style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px">
  <h2 style="color:#374151">שלום {name}!</h2>
  <p>מצאנו נכס שמתאים לדרישות שלך:</p>
  <div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:8px;padding:16px;margin:16px 0">
    <h3 style="margin:0 0 8px;color:#111827">{property}</h3>
    <p style="margin:0;font-size:24px;font-weight:bold;color:#6366f1">{price}</p>
  </div>
  <a href="#" style="display:inline-block;background:#6366f1;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:bold">צפה בנכס</a>
</div>`,
  },
];

function TemplateEditor({
  initial,
  onSave,
  onClose,
}: {
  initial?: Partial<Template>;
  onSave: (t: Omit<Template, "id" | "updatedAt">) => Promise<void>;
  onClose: () => void;
}) {
  const [form, setForm] = useState({
    name: initial?.name ?? "",
    subject: initial?.subject ?? "",
    bodyHtml: initial?.bodyHtml ?? "",
    type: (initial?.type ?? "custom") as Template["type"],
  });
  const [saving, setSaving] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  async function handleSave() {
    if (!form.name || !form.subject || !form.bodyHtml) {
      toast.error("מלא את כל השדות");
      return;
    }
    setSaving(true);
    try {
      await onSave(form);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="font-bold text-gray-900">{initial?.id ? "ערוך תבנית" : "תבנית חדשה"}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={18} /></button>
        </div>

        <div className="flex-1 overflow-auto p-6 space-y-4" dir="rtl">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1">שם התבנית</label>
              <input
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-300 outline-none"
                placeholder="ברוכים הבאים"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1">סוג</label>
              <select
                value={form.type}
                onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-300 outline-none bg-white"
              >
                {Object.entries(TYPE_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1">נושא המייל</label>
            <input
              value={form.subject}
              onChange={(e) => setForm((f) => ({ ...f, subject: e.target.value }))}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-300 outline-none"
              placeholder="תודה שפנית אלינו!"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-sm font-medium text-gray-700">תוכן HTML</label>
              <div className="flex items-center gap-2 text-xs text-gray-400">
                <span>משתנים: {"{name}"} {"{phone}"} {"{property}"} {"{price}"}</span>
                <button
                  onClick={() => setShowPreview(!showPreview)}
                  className="flex items-center gap-1 text-indigo-500 hover:text-indigo-700"
                >
                  <Eye size={12} /> תצוגה מקדימה
                </button>
              </div>
            </div>
            {showPreview ? (
              <div
                className="w-full border border-gray-200 rounded-lg p-4 min-h-48 overflow-auto bg-white"
                dangerouslySetInnerHTML={{ __html: form.bodyHtml.replace(/<script[\s\S]*?<\/script>/gi, "").replace(/\son\w+\s*=/gi, " data-removed=") }}
              />
            ) : (
              <textarea
                value={form.bodyHtml}
                onChange={(e) => setForm((f) => ({ ...f, bodyHtml: e.target.value }))}
                rows={12}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-300 outline-none font-mono text-xs"
                dir="ltr"
              />
            )}
          </div>
        </div>

        <div className="px-6 py-4 border-t border-gray-100 flex gap-3 justify-end">
          <button onClick={onClose} className="px-4 py-2 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition">
            ביטול
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-4 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition"
          >
            {saving ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
            שמור
          </button>
        </div>
      </div>
    </div>
  );
}

export default function EmailTemplatesPage() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Partial<Template> | null>(null);
  const [testEmail, setTestEmail] = useState("");
  const [testingId, setTestingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    const res = await fetch("/api/email-templates");
    if (res.ok) {
      const data = await res.json();
      setTemplates(data.templates);
    }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  async function handleCreate(data: Omit<Template, "id" | "updatedAt">) {
    if (editing?.id) {
      const res = await fetch(`/api/email-templates/${editing.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (res.ok) { toast.success("התבנית עודכנה"); setEditing(null); load(); }
      else toast.error("שגיאה בשמירה");
    } else {
      const res = await fetch("/api/email-templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (res.ok) { toast.success("התבנית נוצרה"); setEditing(null); load(); }
      else toast.error("שגיאה ביצירה");
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("למחוק את התבנית?")) return;
    await fetch(`/api/email-templates/${id}`, { method: "DELETE" });
    toast.success("התבנית נמחקה");
    load();
  }

  async function handleSeedDefaults() {
    for (const t of DEFAULT_TEMPLATES) {
      await fetch("/api/email-templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(t),
      });
    }
    toast.success("תבניות ברירת המחדל נוצרו");
    load();
  }

  async function handleSendTest(id: string) {
    if (!testEmail) { toast.error("הכנס כתובת מייל לבדיקה"); return; }
    setTestingId(id);
    try {
      const res = await fetch(`/api/email-templates/${id}?action=send-test`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: testEmail }),
      });
      if (res.ok) toast.success(`מייל בדיקה נשלח ל-${testEmail}`);
      else {
        const d = await res.json();
        toast.error(d.error ?? "שגיאה בשליחה");
      }
    } finally {
      setTestingId(null);
    }
  }

  return (
    <div className="space-y-6" dir="rtl">
      {editing !== null && (
        <TemplateEditor
          initial={editing}
          onSave={handleCreate}
          onClose={() => setEditing(null)}
        />
      )}

      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Mail size={22} className="text-indigo-500" /> תבניות מייל
          </h1>
          <p className="text-sm text-gray-500 mt-1">ניהול תבניות מייל אוטומטיות</p>
        </div>
        <div className="flex gap-2">
          {templates.length === 0 && (
            <button
              onClick={handleSeedDefaults}
              className="flex items-center gap-2 text-sm border border-indigo-200 text-indigo-600 px-4 py-2 rounded-lg hover:bg-indigo-50 transition"
            >
              <Plus size={15} /> צור תבניות ברירת מחדל
            </button>
          )}
          <button
            onClick={() => setEditing({})}
            className="flex items-center gap-2 text-sm bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition"
          >
            <Plus size={15} /> תבנית חדשה
          </button>
        </div>
      </div>

      {/* Test email input */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 flex items-center gap-3">
        <Send size={16} className="text-gray-400 flex-shrink-0" />
        <input
          type="email"
          value={testEmail}
          onChange={(e) => setTestEmail(e.target.value)}
          placeholder="מייל לבדיקה: you@example.com"
          className="flex-1 text-sm outline-none"
          dir="ltr"
        />
        <span className="text-xs text-gray-400">הכנס מייל ולחץ על &quot;שלח בדיקה&quot; על כל תבנית</span>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 size={24} className="animate-spin text-gray-300" />
        </div>
      ) : templates.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm flex flex-col items-center py-16">
          <Mail size={36} className="text-gray-200 mb-3" />
          <p className="text-sm text-gray-500">אין תבניות עדיין</p>
          <p className="text-xs text-gray-400 mt-1">צור תבנית חדשה או השתמש בתבניות ברירת המחדל</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {templates.map((t) => (
            <div key={t.id} className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h3 className="font-semibold text-gray-900 text-sm">{t.name}</h3>
                  <p className="text-xs text-gray-500 mt-0.5 line-clamp-1 font-mono">{t.subject}</p>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0 ${TYPE_COLORS[t.type] ?? "bg-gray-100 text-gray-600"}`}>
                  {TYPE_LABELS[t.type] ?? t.type}
                </span>
              </div>
              <p className="text-xs text-gray-400">
                עודכן: {new Date(t.updatedAt).toLocaleDateString("he-IL")}
              </p>
              <div className="flex items-center gap-2 flex-wrap">
                <button
                  onClick={() => setEditing(t)}
                  className="flex items-center gap-1.5 text-xs border border-gray-200 text-gray-600 px-3 py-1.5 rounded-lg hover:bg-gray-50 transition"
                >
                  <Edit3 size={12} /> ערוך
                </button>
                <button
                  onClick={() => handleSendTest(t.id)}
                  disabled={testingId === t.id}
                  className="flex items-center gap-1.5 text-xs border border-indigo-200 text-indigo-600 px-3 py-1.5 rounded-lg hover:bg-indigo-50 transition disabled:opacity-50"
                >
                  {testingId === t.id ? <Loader2 size={12} className="animate-spin" /> : <Send size={12} />}
                  שלח בדיקה
                </button>
                <button
                  onClick={() => handleDelete(t.id)}
                  className="flex items-center gap-1.5 text-xs border border-red-100 text-red-500 px-3 py-1.5 rounded-lg hover:bg-red-50 transition mr-auto"
                >
                  <Trash2 size={12} /> מחק
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
