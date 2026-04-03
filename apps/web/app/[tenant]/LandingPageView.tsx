"use client";

import { useState, useRef } from "react";
import {
  Loader2, CheckCircle2, Phone, User, Mail, MapPin,
  MessageSquare, Home, DollarSign, Copy, Check,
} from "lucide-react";
import { PageViewTracker } from "@/components/PageViewTracker";
import { LiveChat } from "@/components/LiveChat";

// ── Types ────────────────────────────────────────────────────────────────────

type ClientData = {
  id: string;
  name: string;
  slug: string;
  phone: string | null;
  primaryColor: string;
  industry: string | null;
  whatsappNumber: string | null;
  landingPageTitle: string | null;
  landingPageSubtitle: string | null;
  landingPageCta: string | null;
  landingPageColor: string | null;
  landingPageLogo: string | null;
  landingPageActive: boolean;
};

// ── Field definitions by industry ───────────────────────────────────────────

type FieldDef = {
  id: string;
  label: string;
  type: "text" | "tel" | "email" | "textarea" | "select";
  required: boolean;
  placeholder?: string;
  options?: string[];
  icon?: React.ElementType;
};

function getFields(industry: string | null): FieldDef[] {
  const base: FieldDef[] = [
    { id: "fullName", label: "שם מלא",  type: "text", required: true,  placeholder: "ישראל ישראלי", icon: User  },
    { id: "phone",    label: "טלפון",   type: "tel",  required: true,  placeholder: "050-0000000",  icon: Phone },
  ];
  switch (industry) {
    case "ROOFING":
    case "ALUMINUM":
      return [...base,
        { id: "city",    label: "עיר",              type: "text",   required: false, placeholder: "תל אביב", icon: MapPin },
        { id: "service", label: "איזה שירות דרוש?", type: "select", required: false,
          options: ["גג ביטומן", "גג רעפים", "גג שטוח", "תיקון גג", "חלונות אלומיניום", "דלתות אלומיניום", "סגירת מרפסת", "אחר"] },
      ];
    case "COSMETICS":
      return [...base,
        { id: "treatment", label: "איזה טיפול מעניין אותך?", type: "select", required: false,
          options: ["עיצוב גבות", "הסרת שיער", "טיפול פנים", "מניקור/פדיקור", "הארכת ריסים", "אחר"] },
      ];
    case "CLEANING":
      return [...base,
        { id: "city",         label: "עיר",         type: "text",   required: false, placeholder: "תל אביב", icon: MapPin },
        { id: "propertySize", label: "גודל הנכס",   type: "select", required: false,
          options: ["עד 50 מ\"ר", "50-100 מ\"ר", "100-150 מ\"ר", "150+ מ\"ר"] },
      ];
    case "REAL_ESTATE":
      return [...base,
        { id: "budget", label: "תקציב",      type: "select", required: false, icon: DollarSign,
          options: ["עד ₪1M", "₪1M-₪1.5M", "₪1.5M-₪2M", "₪2M-₪3M", "₪3M+"] },
        { id: "rooms",  label: "כמה חדרים?", type: "select", required: false, icon: Home,
          options: ["1-2 חדרים", "3 חדרים", "4 חדרים", "5+ חדרים", "פנטהאוז"] },
      ];
    default:
      return [...base,
        { id: "email",   label: "אימייל",  type: "email",    required: false, placeholder: "you@example.com", icon: Mail },
        { id: "message", label: "הודעה",   type: "textarea", required: false, placeholder: "כיצד נוכל לעזור?", icon: MessageSquare },
      ];
  }
}

// ── Main component ────────────────────────────────────────────────────────────

export function LandingPageView({
  client,
  utmParams,
}: {
  client: ClientData;
  utmParams: {
    utm_source: string | null; utm_medium: string | null;
    utm_campaign: string | null; utm_content: string | null; utm_term: string | null;
  };
}) {
  const heroColor   = client.landingPageColor || client.primaryColor;
  const ctaText     = client.landingPageCta   || "השאר פרטים";
  const title       = client.landingPageTitle  || client.name;
  const subtitle    = client.landingPageSubtitle || "מלא את הטופס ונחזור אליך בהקדם";


  const fields = getFields(client.industry);
  const [values, setValues] = useState<Record<string, string>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [done,    setDone]    = useState(false);
  const [serverError, setServerError] = useState("");
  const [copied, setCopied] = useState(false);
  const formRef = useRef<HTMLDivElement>(null);

  function scrollToForm() {
    formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function validate() {
    const e: Record<string, string> = {};
    for (const f of fields) {
      if (f.required && !values[f.id]?.trim()) e[f.id] = `${f.label} הוא שדה חובה`;
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleSubmit(ev: React.FormEvent) {
    ev.preventDefault();
    if (!validate()) return;
    setLoading(true);
    setServerError("");
    try {
      const [firstName = "", ...rest] = (values.fullName ?? "").trim().split(" ");
      const lastName = rest.join(" ") || "-";
      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName,
          lastName,
          phone:       values.phone       || undefined,
          email:       values.email       || undefined,
          clientId:    client.id,
          source:      utmParams.utm_source ?? "organic",
          utmSource:   utmParams.utm_source   ?? undefined,
          utmMedium:   utmParams.utm_medium   ?? undefined,
          utmCampaign: utmParams.utm_campaign ?? undefined,
          utmContent:  utmParams.utm_content  ?? undefined,
          utmTerm:     utmParams.utm_term     ?? undefined,
          metadata: {
            page: "landing",
            ...Object.fromEntries(
              Object.entries(values).filter(([k]) => !["fullName","phone","email"].includes(k))
            ),
          },
        }),
      });
      if (!res.ok) {
        const d = await res.json();
        setServerError(d.error ?? "שגיאה בשליחת הטופס. נסה שנית.");
        return;
      }
      setDone(true);
    } catch {
      setServerError("שגיאת חיבור לשרת. נסה שנית.");
    } finally {
      setLoading(false);
    }
  }

  function copyUrl() {
    const url = typeof window !== "undefined" ? window.location.href : "";
    navigator.clipboard.writeText(url).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  // ── Success screen ────────────────────────────────────────────────────────
  if (done) {
    const waText = encodeURIComponent(`שלום, מילאתי את הטופס ב-${client.name}`);
    const waLink = client.whatsappNumber
      ? `https://wa.me/${client.whatsappNumber.replace(/[^0-9]/g,"")}?text=${waText}`
      : null;
    return (
      <div dir="rtl" className="min-h-screen flex items-center justify-center px-4" style={{ background: heroColor + "10" }}>
        <div className="text-center space-y-5 max-w-sm w-full">
          <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto" style={{ background: heroColor }}>
            <CheckCircle2 size={40} className="text-white" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900">תודה רבה!</h2>
          <p className="text-gray-600">קיבלנו את הפנייה שלך ונחזור אליך בהקדם.</p>
          <div className="space-y-3 pt-2">
            {waLink && (
              <a href={waLink} target="_blank" rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 text-white font-semibold rounded-xl py-3 text-sm shadow transition-opacity hover:opacity-90"
                style={{ background: "#25D366" }}
              >
                <MessageSquare size={16} /> רוצה מענה מהיר? שלח לנו וואצאפ
              </a>
            )}
            <button onClick={copyUrl}
              className="flex items-center justify-center gap-2 w-full border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 font-medium rounded-xl py-2.5 text-sm transition-colors"
            >
              {copied ? <Check size={15} className="text-green-600" /> : <Copy size={15} />}
              {copied ? "הקישור הועתק!" : "שתף את הטופס"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Main landing page ─────────────────────────────────────────────────────
  return (
    <div dir="rtl" className="min-h-screen flex flex-col">
      <PageViewTracker clientSlug={client.slug} page="landing" />
      {/* HERO */}
      <section
        className="relative flex flex-col items-center justify-center text-center px-6 py-20 sm:py-28"
        style={{ background: heroColor }}
      >
        {/* Logo or initials */}
        {client.landingPageLogo ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={client.landingPageLogo} alt={client.name} className="w-20 h-20 rounded-2xl object-contain mb-6 bg-white p-2" />
        ) : (
          <div className="w-20 h-20 rounded-2xl bg-white/20 flex items-center justify-center text-white font-bold text-3xl mb-6">
            {client.name[0]}
          </div>
        )}
        <h1 className="text-3xl sm:text-4xl font-bold text-white leading-tight max-w-xl">{title}</h1>
        <p className="mt-4 text-white/90 text-lg max-w-lg leading-relaxed">{subtitle}</p>
        <button
          onClick={scrollToForm}
          className="mt-8 px-8 py-4 bg-white font-bold text-base rounded-2xl shadow-lg hover:shadow-xl transition-all active:scale-95"
          style={{ color: heroColor }}
        >
          {ctaText}
        </button>
      </section>

      {/* FORM */}
      <section ref={formRef} className="flex-1 bg-gray-50 flex items-start justify-center px-4 py-12">
        <div className="w-full max-w-md bg-white rounded-2xl shadow-lg p-6 space-y-5">
          <div>
            <h2 className="text-xl font-bold text-gray-900">השאר פרטים ונחזור אליך בהקדם</h2>
            <p className="text-gray-500 text-sm mt-1">מלא את הטופס — ללא התחייבות</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {fields.map((field) => {
              const Icon = field.icon;
              return (
                <div key={field.id}>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    {field.label}
                    {field.required && <span className="text-red-500 mr-1">*</span>}
                  </label>
                  {field.type === "textarea" ? (
                    <textarea
                      rows={3}
                      value={values[field.id] ?? ""}
                      onChange={(e) => { setValues(p => ({...p, [field.id]: e.target.value})); }}
                      placeholder={field.placeholder}
                      className={`w-full rounded-xl border px-4 py-2.5 text-sm resize-none focus:outline-none focus:ring-2 ${errors[field.id] ? "border-red-300 focus:ring-red-300" : "border-gray-200 focus:ring-indigo-300"}`}
                    />
                  ) : field.type === "select" && field.options ? (
                    <select
                      value={values[field.id] ?? ""}
                      onChange={(e) => setValues(p => ({...p, [field.id]: e.target.value}))}
                      className={`w-full rounded-xl border px-4 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 ${errors[field.id] ? "border-red-300 focus:ring-red-300" : "border-gray-200 focus:ring-indigo-300"}`}
                    >
                      <option value="">בחר...</option>
                      {field.options.map(o => <option key={o} value={o}>{o}</option>)}
                    </select>
                  ) : (
                    <div className="relative">
                      {Icon && <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"><Icon size={16} /></div>}
                      <input
                        type={field.type}
                        value={values[field.id] ?? ""}
                        onChange={(e) => setValues(p => ({...p, [field.id]: e.target.value}))}
                        placeholder={field.placeholder}
                        dir={field.type === "email" || field.type === "tel" ? "ltr" : "rtl"}
                        className={`w-full rounded-xl border px-4 py-2.5 text-sm focus:outline-none focus:ring-2 ${Icon ? "pr-10" : ""} ${errors[field.id] ? "border-red-300 focus:ring-red-300" : "border-gray-200 focus:ring-indigo-300"}`}
                      />
                    </div>
                  )}
                  {errors[field.id] && <p className="text-red-500 text-xs mt-1">{errors[field.id]}</p>}
                </div>
              );
            })}

            {serverError && (
              <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3">
                <p className="text-red-600 text-sm">{serverError}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 text-white font-semibold rounded-xl py-4 text-base shadow-lg disabled:opacity-60 transition-opacity hover:opacity-90"
              style={{ background: heroColor }}
            >
              {loading ? <><Loader2 size={17} className="animate-spin" /> שולח...</> : ctaText}
            </button>
            <p className="text-center text-gray-400 text-xs">הפרטים שלך מוגנים ולא יועברו לצדדים שלישיים</p>
          </form>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-white border-t border-gray-100 py-6 px-6 text-center space-y-3">
        {client.phone && (
          <a href={`tel:${client.phone}`} className="flex items-center justify-center gap-2 text-gray-600 text-sm hover:text-gray-900">
            <Phone size={14} /> {client.phone}
          </a>
        )}
        {client.whatsappNumber && (
          <a
            href={`https://wa.me/${client.whatsappNumber.replace(/[^0-9]/g,"")}?text=${encodeURIComponent(`שלום ${client.name}`)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2 text-green-600 text-sm font-medium hover:text-green-700"
          >
            <MessageSquare size={14} /> שלח וואצאפ
          </a>
        )}
        <p className="text-xs text-gray-400">מופעל על ידי <span className="font-medium">MarketingOS</span></p>
      </footer>
      {client.whatsappNumber && (
        <LiveChat whatsappNumber={client.whatsappNumber} businessName={client.name} />
      )}
    </div>
  );
}
