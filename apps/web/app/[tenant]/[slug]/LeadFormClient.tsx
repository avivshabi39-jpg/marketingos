"use client";

import { useState } from "react";
import { Loader2, CheckCircle2, Phone, User, Mail, MapPin, MessageSquare, Home, DollarSign, Copy, Check } from "lucide-react";

// ── שדות דינמיים לפי ענף ──────────────────────────────────────────────────────
type FieldDef = {
  id:          string;
  label:       string;
  type:        "text" | "tel" | "email" | "textarea" | "select";
  required:    boolean;
  placeholder?: string;
  options?:    string[];
  icon?:       React.ElementType;
};

function getFieldsByIndustry(industry: string | null): FieldDef[] {
  const base: FieldDef[] = [
    { id: "fullName", label: "שם מלא",    type: "text", required: true,  placeholder: "ישראל ישראלי",         icon: User  },
    { id: "phone",    label: "טלפון",     type: "tel",  required: true,  placeholder: "050-000-0000",          icon: Phone },
  ];

  switch (industry) {
    case "ROOFING":
    case "ALUMINUM":
      return [
        ...base,
        { id: "city",    label: "עיר",              type: "text",     required: false, placeholder: "תל אביב", icon: MapPin },
        { id: "service", label: "מה השירות הדרוש?", type: "select",   required: false,
          options: ["גג ביטומן", "גג רעפים", "גג שטוח", "תיקון גג", "גג סולארי", "חלונות אלומיניום", "דלתות אלומיניום", "סגירת מרפסת", "אחר"] },
        { id: "notes",   label: "פרטים נוספים",     type: "textarea", required: false, placeholder: "ספר לנו קצת על הפרויקט..." },
      ];

    case "COSMETICS":
      return [
        ...base,
        { id: "email",     label: "אימייל",                   type: "email",   required: false, placeholder: "you@example.com", icon: Mail },
        { id: "treatment", label: "איזה טיפול מעניין אותך?", type: "select",  required: false,
          options: ["עיצוב גבות", "הסרת שיער", "טיפול פנים", "מניקור/פדיקור", "הארכת ריסים", "שיזוף מלאכותי", "אחר"] },
        { id: "notes", label: "פרטים נוספים", type: "textarea", required: false, placeholder: "תאר/י את הטיפול שמעניין אותך..." },
      ];

    case "CLEANING":
      return [
        ...base,
        { id: "city",         label: "עיר",           type: "text",   required: false, placeholder: "תל אביב", icon: MapPin },
        { id: "propertySize", label: "גודל הנכס",     type: "select", required: false,
          options: ["עד 50 מ\"ר", "50-100 מ\"ר", "100-150 מ\"ר", "150-200 מ\"ר", "200+ מ\"ר"] },
        { id: "service",      label: "סוג הניקיון",   type: "select", required: false,
          options: ["ניקיון שוטף", "ניקיון לפני כניסה", "ניקיון אחרי שיפוץ", "ניקיון משרדים", "ניקיון תעשייתי", "אחר"] },
        { id: "notes", label: "פרטים נוספים", type: "textarea", required: false, placeholder: "ספר לנו על הנכס..." },
      ];

    case "REAL_ESTATE":
      return [
        ...base,
        { id: "email",  label: "אימייל",     type: "email",  required: false, placeholder: "you@example.com", icon: Mail },
        { id: "budget", label: "תקציב",      type: "select", required: false, icon: DollarSign,
          options: ["עד ₪1M", "₪1M-₪1.5M", "₪1.5M-₪2M", "₪2M-₪3M", "₪3M+"] },
        { id: "rooms",  label: "כמה חדרים?", type: "select", required: false, icon: Home,
          options: ["1-2 חדרים", "3 חדרים", "4 חדרים", "5+ חדרים", "פנטהאוז"] },
        { id: "city",   label: "עיר מועדפת", type: "text",   required: false, placeholder: "תל אביב, רמת גן...", icon: MapPin },
        { id: "notes",  label: "פרטים נוספים", type: "textarea", required: false, placeholder: "ספר לנו מה אתה מחפש..." },
      ];

    default:
      return [
        ...base,
        { id: "email",   label: "אימייל",       type: "email",    required: false, placeholder: "you@example.com", icon: Mail },
        { id: "message", label: "הודעה",         type: "textarea", required: false, placeholder: "כיצד נוכל לעזור לך?", icon: MessageSquare },
      ];
  }
}

// ── Props ──────────────────────────────────────────────────────────────────────
interface Props {
  client: { id: string; name: string; slug: string; primaryColor: string; industry: string | null; whatsappNumber: string | null };
  form:   { id: string; name: string; thankYouMessage: string | null; redirectUrl: string | null };
  utmParams: {
    utm_source:   string | null;
    utm_medium:   string | null;
    utm_campaign: string | null;
    utm_content:  string | null;
    utm_term:     string | null;
  };
}

export function LeadFormClient({ client, form, utmParams }: Props) {
  const fields  = getFieldsByIndustry(client.industry);
  const [values,  setValues]  = useState<Record<string, string>>({});
  const [errors,  setErrors]  = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [done,    setDone]    = useState(false);
  const [serverError, setServerError] = useState("");
  const [copied,  setCopied]  = useState(false);

  function handleChange(id: string, value: string) {
    setValues((prev) => ({ ...prev, [id]: value }));
    if (errors[id]) setErrors((prev) => { const n = { ...prev }; delete n[id]; return n; });
  }

  function validate(): boolean {
    const newErrors: Record<string, string> = {};
    for (const field of fields) {
      if (field.required && !values[field.id]?.trim()) {
        newErrors[field.id] = `${field.label} הוא שדה חובה`;
      }
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    setServerError("");

    try {
      const fullName = values.fullName ?? "";
      const [firstName = "", ...rest] = fullName.trim().split(" ");
      const lastName = rest.join(" ") || "-";

      const payload = {
        firstName,
        lastName,
        phone:       values.phone       ?? null,
        email:       values.email       ?? null,
        clientId:    client.id,
        source:      utmParams.utm_source ?? "organic",
        utmSource:   utmParams.utm_source   ?? undefined,
        utmMedium:   utmParams.utm_medium   ?? undefined,
        utmCampaign: utmParams.utm_campaign ?? undefined,
        utmContent:  utmParams.utm_content  ?? undefined,
        utmTerm:     utmParams.utm_term     ?? undefined,
        metadata: {
          formId:    form.id,
          ...Object.fromEntries(
            Object.entries(values).filter(([k]) => !["fullName", "phone", "email"].includes(k))
          ),
        },
      };

      const res = await fetch("/api/leads", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json();
        setServerError(data.error ?? "שגיאה בשליחת הטופס. נסה שנית.");
        return;
      }

      setDone(true);

      // Redirect אם מוגדר
      if (form.redirectUrl) {
        setTimeout(() => { window.location.href = form.redirectUrl!; }, 2500);
      }
    } catch {
      setServerError("שגיאת חיבור לשרת. נסה שנית.");
    } finally {
      setLoading(false);
    }
  }

  const color = client.primaryColor || "#6366f1";

  function copyPageUrl() {
    const url = typeof window !== "undefined" ? window.location.href : "";
    navigator.clipboard.writeText(url).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  // ── Success screen ──
  if (done) {
    const waText = encodeURIComponent(`שלום, מילאתי את הטופס ב-${client.name}`);
    const waLink = client.whatsappNumber
      ? `https://wa.me/${client.whatsappNumber.replace(/[^0-9]/g, "")}?text=${waText}`
      : null;

    return (
      <div dir="rtl" className="min-h-screen flex items-center justify-center px-4 bg-slate-50">
        <div className="text-center space-y-5 max-w-sm w-full">
          <CheckCircle2 size={64} className="mx-auto" style={{ color }} />
          <h2 className="text-2xl font-bold text-slate-900">
            {form.thankYouMessage ?? "תודה! ניצור איתך קשר בהקדם."}
          </h2>
          <p className="text-slate-500 text-sm">
            {values.fullName && `שלום ${values.fullName.split(" ")[0]}!`} קיבלנו את הפנייה שלך.
          </p>

          <div className="flex flex-col gap-3 pt-2">
            {waLink && (
              <a
                href={waLink}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 bg-green-500 hover:bg-green-600 text-white font-semibold rounded-xl py-3 text-sm transition-colors shadow"
              >
                <MessageSquare size={16} />
                רוצה מענה מהיר? שלח לנו וואצאפ
              </a>
            )}
            <button
              onClick={copyPageUrl}
              className="flex items-center justify-center gap-2 border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 font-medium rounded-xl py-2.5 text-sm transition-colors"
            >
              {copied ? <Check size={15} className="text-green-600" /> : <Copy size={15} />}
              {copied ? "הקישור הועתק!" : "שתף את הטופס"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Form ──
  return (
    <div dir="rtl" className="min-h-screen bg-slate-50 flex flex-col">
      {/* Header */}
      <div className="py-8 text-center" style={{ background: color }}>
        <div className="w-14 h-14 rounded-2xl bg-white/20 flex items-center justify-center mx-auto mb-3">
          <span className="text-white font-bold text-xl">{client.name[0]}</span>
        </div>
        <h1 className="text-xl font-bold text-white">{client.name}</h1>
        <p className="text-white/80 text-sm mt-1">{form.name}</p>
      </div>

      {/* Form card */}
      <div className="flex-1 flex items-start justify-center px-4 py-8">
        <div className="w-full max-w-md bg-white rounded-2xl shadow-lg p-6 space-y-5">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">מלא את הפרטים שלך</h2>
            <p className="text-slate-500 text-sm mt-0.5">ונחזור אליך בהקדם</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {fields.map((field) => {
              const Icon = field.icon;
              return (
                <div key={field.id}>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">
                    {field.label}
                    {field.required && <span className="text-red-500 mr-1">*</span>}
                  </label>

                  {field.type === "textarea" ? (
                    <textarea
                      value={values[field.id] ?? ""}
                      onChange={(e) => handleChange(field.id, e.target.value)}
                      placeholder={field.placeholder}
                      rows={3}
                      className={`w-full rounded-xl border px-4 py-2.5 text-sm focus:outline-none focus:ring-2 resize-none ${
                        errors[field.id]
                          ? "border-red-300 focus:ring-red-300"
                          : "border-slate-200 focus:ring-blue-300"
                      }`}
                    />
                  ) : field.type === "select" && field.options ? (
                    <select
                      value={values[field.id] ?? ""}
                      onChange={(e) => handleChange(field.id, e.target.value)}
                      className={`w-full rounded-xl border px-4 py-2.5 text-sm focus:outline-none focus:ring-2 bg-white ${
                        errors[field.id]
                          ? "border-red-300 focus:ring-red-300"
                          : "border-slate-200 focus:ring-blue-300"
                      }`}
                    >
                      <option value="">בחר...</option>
                      {field.options.map((opt) => (
                        <option key={opt} value={opt}>{opt}</option>
                      ))}
                    </select>
                  ) : (
                    <div className="relative">
                      {Icon && (
                        <div className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
                          <Icon size={16} />
                        </div>
                      )}
                      <input
                        type={field.type}
                        value={values[field.id] ?? ""}
                        onChange={(e) => handleChange(field.id, e.target.value)}
                        placeholder={field.placeholder}
                        dir={field.type === "email" || field.type === "tel" ? "ltr" : "rtl"}
                        className={`w-full rounded-xl border px-4 py-2.5 text-sm focus:outline-none focus:ring-2 ${
                          Icon ? "pr-10" : ""
                        } ${
                          errors[field.id]
                            ? "border-red-300 focus:ring-red-300"
                            : "border-slate-200 focus:ring-blue-300"
                        }`}
                      />
                    </div>
                  )}

                  {errors[field.id] && (
                    <p className="text-red-500 text-xs mt-1">{errors[field.id]}</p>
                  )}
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
              className="w-full flex items-center justify-center gap-2 text-white font-semibold rounded-xl py-3.5 text-sm transition-all shadow-lg disabled:opacity-60"
              style={{ backgroundColor: color }}
            >
              {loading ? (
                <><Loader2 size={16} className="animate-spin" /> שולח...</>
              ) : (
                "שלח פנייה"
              )}
            </button>

            <p className="text-center text-slate-400 text-xs">
              הפרטים שלך מאובטחים ולא יועברו לצדדים שלישיים
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
