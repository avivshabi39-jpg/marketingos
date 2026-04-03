"use client";

import { useState, useRef } from "react";
import { Loader2, Check, ExternalLink, Upload, X, Image as ImageIcon, Sparkles } from "lucide-react";
import { CopyLinkButton } from "./CopyLinkButton";

interface Props {
  client: {
    id: string;
    slug: string;
    primaryColor: string;
    landingPageTitle:    string | null;
    landingPageSubtitle: string | null;
    landingPageCta:      string | null;
    landingPageColor:    string | null;
    landingPageLogo:     string | null;
    landingPageActive:   boolean;
    whatsappTemplate:    string | null;
    autoReplyActive:     boolean;
  };
}

export function LandingPageEditor({ client }: Props) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "";
  const publicUrl = `${appUrl}/${client.slug}`;

  const [form, setForm] = useState({
    landingPageTitle:    client.landingPageTitle    ?? "",
    landingPageSubtitle: client.landingPageSubtitle ?? "",
    landingPageCta:      client.landingPageCta      ?? "השאר פרטים",
    landingPageColor:    client.landingPageColor    ?? client.primaryColor,
    landingPageLogo:     client.landingPageLogo     ?? "",
    landingPageActive:   client.landingPageActive,
    whatsappTemplate:    client.whatsappTemplate    ?? "שלום {name}! קיבלנו את פנייתך ונחזור אליך בהקדם 😊",
    autoReplyActive:     client.autoReplyActive,
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiWaLoading, setAiWaLoading] = useState(false);
  const [aiGenerated, setAiGenerated] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  async function handleSave() {
    setSaving(true);
    setSaved(false);
    try {
      const res = await fetch(`/api/clients/${client.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          landingPageTitle:    form.landingPageTitle    || null,
          landingPageSubtitle: form.landingPageSubtitle || null,
          landingPageCta:      form.landingPageCta      || null,
          landingPageColor:    form.landingPageColor    || null,
          landingPageLogo:     form.landingPageLogo     || null,
          landingPageActive:   form.landingPageActive,
          whatsappTemplate:    form.whatsappTemplate    || null,
          autoReplyActive:     form.autoReplyActive,
        }),
      });
      if (res.ok) { setSaved(true); setTimeout(() => setSaved(false), 2500); }
    } finally {
      setSaving(false);
    }
  }

  async function handleUpload(file: File) {
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      if (res.ok) {
        const data = await res.json() as { url?: string };
        setForm(f => ({ ...f, landingPageLogo: data.url ?? "" }));
      }
    } finally {
      setUploading(false);
    }
  }

  async function handleAiContent() {
    setAiLoading(true);
    setAiError(null);
    setAiGenerated(false);
    try {
      const res = await fetch("/api/ai/landing-page", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clientId: client.id }),
      });
      const data = await res.json() as {
        title?: string;
        subtitle?: string;
        benefits?: string[];
        cta?: string;
        error?: string;
      };
      if (!res.ok) {
        setAiError(data.error ?? "שגיאה ביצירת תוכן, נסה שוב");
        return;
      }
      setForm(f => ({
        ...f,
        landingPageTitle:    data.title    ?? f.landingPageTitle,
        landingPageSubtitle: data.subtitle ?? f.landingPageSubtitle,
        landingPageCta:      data.cta      ?? f.landingPageCta,
      }));
      setAiGenerated(true);
      setTimeout(() => setAiGenerated(false), 4000);
    } finally {
      setAiLoading(false);
    }
  }

  async function handleAiWhatsapp() {
    setAiWaLoading(true);
    setAiError(null);
    try {
      const res = await fetch("/api/ai/whatsapp-message", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clientName: client.slug, service: "השירות שלנו" }),
      });
      const data = await res.json() as { message?: string; error?: string };
      if (!res.ok) {
        setAiError(data.error ?? "שגיאה ביצירת הודעה");
        return;
      }
      setForm(f => ({ ...f, whatsappTemplate: data.message ?? f.whatsappTemplate }));
    } finally {
      setAiWaLoading(false);
    }
  }

  const color = form.landingPageColor || client.primaryColor;

  return (
    <div className="space-y-8 max-w-xl" dir="rtl">
      {/* Status + live link */}
      <div className="flex items-center justify-between bg-gray-50 rounded-xl px-4 py-3 border border-gray-100">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setForm(f => ({ ...f, landingPageActive: !f.landingPageActive }))}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${form.landingPageActive ? "bg-green-500" : "bg-gray-300"}`}
          >
            <span className={`inline-block h-4 w-4 rounded-full bg-white shadow transition-transform ${form.landingPageActive ? "translate-x-6" : "translate-x-1"}`} />
          </button>
          <span className="text-sm font-medium text-gray-700">
            {form.landingPageActive ? "דף פעיל" : "דף מושבת"}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <CopyLinkButton url={publicUrl} label="העתק קישור" />
          <a href={`/${client.slug}`} target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-xs text-indigo-500 hover:text-indigo-700 font-medium">
            <ExternalLink size={13} /> צפה בדף
          </a>
        </div>
      </div>

      {/* QR */}
      <div className="flex justify-center">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={`https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${encodeURIComponent(publicUrl)}`}
          alt="QR"
          className="w-24 h-24 rounded-xl border border-gray-200"
        />
      </div>

      {/* Content fields */}
      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-gray-900 text-sm">תוכן הדף</h3>
          <button
            onClick={handleAiContent}
            disabled={aiLoading}
            className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 rounded-lg transition-colors disabled:opacity-60"
          >
            {aiLoading
              ? <><Loader2 size={12} className="animate-spin" /> מייצר תוכן...</>
              : <><Sparkles size={12} /> ✨ צור תוכן אוטומטי</>
            }
          </button>
        </div>

        {aiGenerated && (
          <div className="flex items-center gap-2 bg-green-50 border border-green-200 text-green-700 rounded-lg px-3 py-2 text-xs">
            <Check size={13} />
            תוכן נוצר על ידי AI — ניתן לערוך
          </div>
        )}
        {aiError && (
          <p className="text-xs text-red-500 bg-red-50 rounded-lg px-3 py-2">{aiError}</p>
        )}

        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1.5">כותרת ראשית</label>
          <input
            value={form.landingPageTitle}
            onChange={e => setForm(f => ({ ...f, landingPageTitle: e.target.value }))}
            placeholder={`הכנס כותרת ל-${client.slug}`}
            className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1.5">כותרת משנה</label>
          <textarea
            rows={2}
            value={form.landingPageSubtitle}
            onChange={e => setForm(f => ({ ...f, landingPageSubtitle: e.target.value }))}
            placeholder="מלא את הטופס ונחזור אליך בהקדם"
            className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-indigo-400"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1.5">טקסט כפתור</label>
          <input
            value={form.landingPageCta}
            onChange={e => setForm(f => ({ ...f, landingPageCta: e.target.value }))}
            placeholder="השאר פרטים"
            className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
          />
        </div>
      </div>

      {/* Design */}
      <div className="space-y-5">
        <h3 className="font-semibold text-gray-900 text-sm">עיצוב</h3>

        <div className="flex items-center gap-3">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">צבע ראשי</label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={form.landingPageColor || client.primaryColor}
                onChange={e => setForm(f => ({ ...f, landingPageColor: e.target.value }))}
                className="w-10 h-10 rounded-lg border border-gray-200 cursor-pointer p-0.5"
              />
              <input
                type="text"
                value={form.landingPageColor || client.primaryColor}
                onChange={e => setForm(f => ({ ...f, landingPageColor: e.target.value }))}
                dir="ltr"
                className="w-28 rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
              />
            </div>
          </div>
          {/* Live color preview */}
          <div className="flex-1 flex justify-end">
            <div
              className="w-16 h-16 rounded-xl flex items-center justify-center text-white font-bold text-xl shadow-sm"
              style={{ background: color }}
            >
              {client.slug[0]?.toUpperCase()}
            </div>
          </div>
        </div>

        {/* Logo upload */}
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1.5">לוגו</label>
          <div className="flex items-center gap-3">
            {form.landingPageLogo ? (
              <div className="relative">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={form.landingPageLogo}
                  alt="לוגו"
                  className="w-14 h-14 rounded-xl object-contain border border-gray-200 bg-gray-50"
                />
                <button
                  onClick={() => setForm(f => ({ ...f, landingPageLogo: "" }))}
                  className="absolute -top-1.5 -left-1.5 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center"
                >
                  <X size={10} />
                </button>
              </div>
            ) : (
              <div className="w-14 h-14 rounded-xl border-2 border-dashed border-gray-200 flex items-center justify-center bg-gray-50">
                <ImageIcon size={20} className="text-gray-300" />
              </div>
            )}
            <div>
              <button
                onClick={() => fileRef.current?.click()}
                disabled={uploading}
                className="flex items-center gap-1.5 text-sm border border-gray-200 text-gray-700 px-3 py-2 rounded-lg hover:bg-gray-50 disabled:opacity-60"
              >
                {uploading ? <Loader2 size={13} className="animate-spin" /> : <Upload size={13} />}
                {uploading ? "מעלה..." : "העלה לוגו"}
              </button>
              <p className="text-xs text-gray-400 mt-1">PNG, JPG — עד 2MB</p>
            </div>
          </div>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={e => { const f = e.target.files?.[0]; if (f) handleUpload(f); }}
          />
        </div>
      </div>

      {/* WhatsApp auto-reply */}
      <div className="space-y-4 border-t border-gray-100 pt-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-gray-900 text-sm">הודעה אוטומטית לליד</h3>
            <p className="text-xs text-gray-500 mt-0.5">נשלחת ל-n8n בעת ליד חדש</p>
          </div>
          <button
            onClick={() => setForm(f => ({ ...f, autoReplyActive: !f.autoReplyActive }))}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${form.autoReplyActive ? "bg-green-500" : "bg-gray-300"}`}
          >
            <span className={`inline-block h-4 w-4 rounded-full bg-white shadow transition-transform ${form.autoReplyActive ? "translate-x-6" : "translate-x-1"}`} />
          </button>
        </div>

        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="block text-xs font-medium text-gray-600">תוכן ההודעה</label>
            <button
              onClick={handleAiWhatsapp}
              disabled={aiWaLoading}
              className="flex items-center gap-1 text-xs text-indigo-500 hover:text-indigo-700 font-medium disabled:opacity-60"
            >
              {aiWaLoading
                ? <><Loader2 size={11} className="animate-spin" /> יוצר...</>
                : <><Sparkles size={11} /> ✨ צור הודעה</>
              }
            </button>
          </div>
          <textarea
            rows={3}
            value={form.whatsappTemplate}
            onChange={e => setForm(f => ({ ...f, whatsappTemplate: e.target.value }))}
            placeholder="שלום {name}! קיבלנו את פנייתך ונחזור אליך בהקדם 😊"
            className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-indigo-400"
          />
          <p className="text-xs text-gray-400 mt-1">משתנים: {"{name}"} {"{phone}"}</p>
        </div>
      </div>

      {/* Save */}
      <button
        onClick={handleSave}
        disabled={saving}
        className="flex items-center gap-2 bg-indigo-500 hover:bg-indigo-600 disabled:opacity-60 text-white text-sm font-semibold px-6 py-3 rounded-xl transition-colors shadow"
      >
        {saving  ? <><Loader2 size={14} className="animate-spin" /> שומר...</>
         : saved  ? <><Check size={14} /> נשמר!</>
         : "שמור שינויים"}
      </button>
    </div>
  );
}
