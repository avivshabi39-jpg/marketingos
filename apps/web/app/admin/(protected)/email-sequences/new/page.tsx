"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowRight, Loader2, Mail, Zap } from "lucide-react";
import toast from "react-hot-toast";

type ClientOption = { id: string; name: string };

const TRIGGER_OPTIONS = [
  { value: "new_lead", label: "ליד חדש" },
  { value: "won_lead", label: "ליד שנסגר" },
  { value: "no_reply_3days", label: "ללא תגובה 3 ימים" },
];

const TEMPLATES = {
  new_lead: {
    name: "ליד חדש",
    trigger: "new_lead" as const,
    steps: [
      { delay_days: 0, subject: "תודה על פנייתך!", body: "שלום {name},\n\nתודה שפנית אלינו! נחזור אליך בהקדם.\n\nבברכה" },
      { delay_days: 2, subject: "קיבלת את הצעת המחיר?", body: "שלום {name},\n\nשלחנו לך הצעת מחיר לפני יומיים. האם קיבלת?\n\nנשמח לענות על שאלות." },
      { delay_days: 7, subject: "עדיין מעוניין?", body: "שלום {name},\n\nאנחנו כאן אם תרצה להמשיך. מחירים מיוחדים הזדמנות זו בלבד." },
    ],
  },
  won_lead: {
    name: "לקוח שנסגר",
    trigger: "won_lead" as const,
    steps: [
      { delay_days: 0, subject: "ברוכים הבאים!", body: "שלום {name},\n\nברוכים הבאים למשפחה! שמחים שבחרת בנו." },
      { delay_days: 7, subject: "איך הולך?", body: "שלום {name},\n\nשבוע עבר מאז ההתחלה — הכל בסדר?" },
      { delay_days: 30, subject: "חוות דעת", body: "שלום {name},\n\nנשמח לשמוע כיצד הייתה החוויה. האם תוכל לכתוב ביקורת גוגל קצרה?" },
    ],
  },
  no_reply: {
    name: "פולו-אפ חם",
    trigger: "no_reply_3days" as const,
    steps: [
      { delay_days: 0, subject: "שמחנו לדבר איתך", body: "שלום {name},\n\nשמחנו לדבר איתך היום. מצרפים סיכום." },
      { delay_days: 1, subject: "שאלה אחת קטנה", body: "שלום {name},\n\nיש לך שאלות? אנחנו כאן לעזור." },
      { delay_days: 3, subject: "מבצע מיוחד לך", body: "שלום {name},\n\nמבצע מיוחד רק לך — השבוע בלבד." },
    ],
  },
};

type TemplateKey = keyof typeof TEMPLATES;

const TEMPLATE_CARDS: { key: TemplateKey; label: string; description: string }[] = [
  { key: "new_lead", label: "ליד חדש", description: "3 מיילים: קבלת פנים, פולו-אפ, ריענון" },
  { key: "no_reply", label: "פולו-אפ חם", description: "3 מיילים: סיכום, שאלה, מבצע" },
  { key: "won_lead", label: "לקוח שנסגר", description: "3 מיילים: ברוכים הבאים, בדיקה, ביקורת" },
];

export default function NewSequencePage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [trigger, setTrigger] = useState("new_lead");
  const [clientId, setClientId] = useState("");
  const [clients, setClients] = useState<ClientOption[]>([]);
  const [loadingClients, setLoadingClients] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<TemplateKey | null>(null);

  useEffect(() => {
    fetch("/api/clients?page=1")
      .then((r) => (r.ok ? r.json() : null))
      .then((d: { clients?: ClientOption[] } | null) => {
        if (d?.clients) {
          setClients(d.clients);
          if (d.clients.length > 0) setClientId(d.clients[0].id);
        }
      })
      .catch(() => {})
      .finally(() => setLoadingClients(false));
  }, []);

  function applyTemplate(key: TemplateKey) {
    const tpl = TEMPLATES[key];
    setSelectedTemplate(key);
    setName(tpl.name);
    setTrigger(tpl.trigger);
  }

  async function handleCreate() {
    if (!name.trim()) { toast.error("הכנס שם לרצף"); return; }
    if (!clientId) { toast.error("בחר לקוח"); return; }

    const steps = selectedTemplate ? TEMPLATES[selectedTemplate].steps : [];

    setSaving(true);
    try {
      const res = await fetch("/api/email-sequences", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clientId, name: name.trim(), trigger, steps }),
      });

      if (!res.ok) {
        const d = await res.json().catch(() => ({})) as { error?: string };
        toast.error(d.error ?? "שגיאה ביצירה");
        return;
      }

      const data = await res.json() as { sequence?: { id: string } };
      toast.success("הרצף נוצר!");
      router.push(`/admin/email-sequences/${data.sequence?.id}`);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6" dir="rtl">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link
          href="/admin/email-sequences"
          className="text-slate-400 hover:text-slate-600 transition"
        >
          <ArrowRight size={20} />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Mail size={22} className="text-blue-500" /> רצף מייל חדש
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">הגדר רצף אוטומטי חדש</p>
        </div>
      </div>

      {/* Template picker */}
      <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-5">
        <p className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-1.5">
          <Zap size={14} className="text-amber-500" /> התחל מתבנית מוכנה
        </p>
        <div className="grid grid-cols-3 gap-3">
          {TEMPLATE_CARDS.map((tpl) => (
            <button
              key={tpl.key}
              onClick={() => applyTemplate(tpl.key)}
              className={`border rounded-lg p-3 text-right transition ${
                selectedTemplate === tpl.key
                  ? "border-blue-500 bg-blue-50"
                  : "border-slate-200 hover:border-blue-300 hover:bg-slate-50"
              }`}
            >
              <p className="text-sm font-semibold text-slate-800">{tpl.label}</p>
              <p className="text-xs text-slate-500 mt-0.5">{tpl.description}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Form */}
      <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-5 space-y-4">
        <div>
          <label className="text-sm font-medium text-slate-700 block mb-1">שם הרצף</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="לדוגמה: ליד חדש — נדלן"
            className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-300 outline-none"
          />
        </div>

        <div>
          <label className="text-sm font-medium text-slate-700 block mb-1">טריגר</label>
          <select
            value={trigger}
            onChange={(e) => setTrigger(e.target.value)}
            className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-300 outline-none bg-white"
          >
            {TRIGGER_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-sm font-medium text-slate-700 block mb-1">לקוח</label>
          {loadingClients ? (
            <div className="flex items-center gap-2 text-sm text-slate-400">
              <Loader2 size={14} className="animate-spin" /> טוען לקוחות...
            </div>
          ) : (
            <select
              value={clientId}
              onChange={(e) => setClientId(e.target.value)}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-300 outline-none bg-white"
            >
              {clients.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          )}
        </div>

        <div className="flex gap-3 pt-2 justify-end">
          <Link
            href="/admin/email-sequences"
            className="px-4 py-2 text-sm text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50 transition"
          >
            ביטול
          </Link>
          <button
            onClick={handleCreate}
            disabled={saving || loadingClients}
            className="flex items-center gap-2 px-5 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition"
          >
            {saving ? <Loader2 size={14} className="animate-spin" /> : null}
            צור רצף
          </button>
        </div>
      </div>
    </div>
  );
}
