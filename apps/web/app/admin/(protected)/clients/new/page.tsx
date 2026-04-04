"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowRight, Loader2, ChevronDown } from "lucide-react";

function slugify(str: string) {
  return str
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

type FieldErr = Record<string, string>;

function SetupSuccessOverlay({ clientId, clientName, setupActions, slug }: {
  clientId: string;
  clientName: string;
  setupActions: string[];
  slug: string;
}) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const portalUrl = `${appUrl}/client/${slug}`;
  const pageUrl = `${appUrl}/${slug}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60" dir="rtl">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8">
        <div className="text-center mb-6">
          <div className="text-5xl mb-3">🎉</div>
          <h2 className="text-xl font-bold text-gray-900">הלקוח נוסף!</h2>
          <p className="text-gray-500 text-sm mt-1">{clientName} מוכן לפעולה</p>
        </div>
        <div className="bg-gray-50 rounded-xl p-4 mb-5">
          <p className="text-xs font-semibold text-gray-500 mb-3">הנה מה שהכנתי אוטומטית:</p>
          <ul className="space-y-2">
            {setupActions.map((action, i) => (
              <li key={i} className="flex items-center gap-2 text-sm text-gray-700">
                <span className="text-green-500">✅</span>
                {action}
              </li>
            ))}
            <li className="flex items-center gap-2 text-sm text-gray-700">
              <span className="text-green-500">✅</span>
              פורטל לקוח מוכן <span className="text-gray-400">(סיסמה: portal123)</span>
            </li>
          </ul>
        </div>
        <div className="space-y-2 mb-6">
          <div className="flex items-center gap-2 bg-indigo-50 rounded-lg px-3 py-2">
            <span className="text-xs text-gray-500 flex-1 truncate">🔗 פורטל: {portalUrl}</span>
            <button
              onClick={() => navigator.clipboard.writeText(portalUrl)}
              className="text-xs text-indigo-600 font-medium hover:text-indigo-700"
            >העתק</button>
          </div>
          <div className="flex items-center gap-2 bg-indigo-50 rounded-lg px-3 py-2">
            <span className="text-xs text-gray-500 flex-1 truncate">🌐 דף: {pageUrl}</span>
            <button
              onClick={() => navigator.clipboard.writeText(pageUrl)}
              className="text-xs text-indigo-600 font-medium hover:text-indigo-700"
            >העתק</button>
          </div>
        </div>
        <a
          href={`/admin/clients/${clientId}/builder/wizard`}
          className="block w-full bg-gradient-to-l from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-center font-bold py-3.5 rounded-xl transition-colors shadow-lg shadow-indigo-500/20"
        >
          🧙 בנה דף נחיתה עכשיו →
        </a>
        <a
          href={`/admin/clients/${clientId}`}
          className="block w-full text-center text-sm text-gray-400 hover:text-gray-600 mt-2 py-2"
        >
          דלג — אבנה אחר כך
        </a>
      </div>
    </div>
  );
}

function Field({
  label, required, error, hint, children,
}: {
  label: string; required?: boolean; error?: string; hint?: string; children: React.ReactNode;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label}
        {required && <span className="text-red-500 mr-1">*</span>}
      </label>
      {hint && <p className="text-xs text-gray-400 mb-1">{hint}</p>}
      {children}
      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
    </div>
  );
}

const inputCls = (err?: string) =>
  `w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 transition-colors ${
    err ? "border-red-300 bg-red-50" : "border-gray-200 bg-white"
  }`;

const selectCls = (err?: string) =>
  `w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 bg-white transition-colors ${
    err ? "border-red-300" : "border-gray-200"
  }`;

type SetupResult = { clientId: string; clientName: string; setupActions: string[]; slug: string };

export default function NewClientPage() {
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<FieldErr>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [setupResult, setSetupResult] = useState<SetupResult | null>(null);

  const [form, setForm] = useState({
    name: "",
    slug: "",
    email: "",
    phone: "",
    industry: "",
    plan: "BASIC",
    primaryColor: "#6366f1",
    monthlyBudget: "",
    reportEmail: "",
    reportFrequency: "WEEKLY",
    whatsappNumber: "",
    n8nWebhookUrl: "",
    facebookPixelId: "",
    googleAdsId: "",
    portalPassword: "",
  });

  const [slugManual, setSlugManual] = useState(false);

  useEffect(() => {
    if (!slugManual) {
      setForm((f) => ({ ...f, slug: slugify(f.name) }));
    }
  }, [form.name, slugManual]);

  function set(key: keyof typeof form, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
    setErrors((e) => ({ ...e, [key]: "" }));
  }

  function validate(): boolean {
    const errs: FieldErr = {};
    if (!form.name.trim()) errs.name = "שם העסק הוא שדה חובה";
    if (!form.email.trim()) errs.email = "אימייל הוא שדה חובה";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errs.email = "כתובת אימייל לא תקינה";
    if (!form.slug.trim()) errs.slug = "Slug הוא שדה חובה";
    else if (!/^[a-z0-9-]+$/.test(form.slug)) errs.slug = "Slug יכול להכיל רק אותיות אנגלית קטנות, מספרים ומקפים";
    if (form.n8nWebhookUrl && !/^https?:\/\/.+/.test(form.n8nWebhookUrl))
      errs.n8nWebhookUrl = "כתובת URL לא תקינה";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    setServerError(null);

    try {
      const res = await fetch("/api/clients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          slug: form.slug,
          email: form.email,
          phone: form.phone || undefined,
          industry: form.industry || undefined,
          plan: form.plan,
          primaryColor: form.primaryColor,
          monthlyBudget: form.monthlyBudget ? Number(form.monthlyBudget) : undefined,
          reportEmail: form.reportEmail || undefined,
          reportFrequency: form.reportFrequency,
          whatsappNumber: form.whatsappNumber || undefined,
          n8nWebhookUrl: form.n8nWebhookUrl || undefined,
          facebookPixelId: form.facebookPixelId || undefined,
          googleAdsId: form.googleAdsId || undefined,
          portalPassword: form.portalPassword || undefined,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setSetupResult({
          clientId: data.client.id,
          clientName: data.client.name,
          setupActions: data.setupActions ?? [],
          slug: data.client.slug,
        });
      } else {
        const data = await res.json();
        if (res.status === 409) setServerError(data.error);
        else if (data.error?.fieldErrors) {
          const fe: FieldErr = {};
          for (const [k, v] of Object.entries(data.error.fieldErrors as Record<string, string[]>)) {
            fe[k] = v[0] ?? "";
          }
          setErrors(fe);
        } else {
          setServerError("אירעה שגיאה. נסה שוב.");
        }
      }
    } catch {
      setServerError("שגיאת חיבור");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
    {setupResult && (
      <SetupSuccessOverlay
        clientId={setupResult.clientId}
        clientName={setupResult.clientName}
        setupActions={setupResult.setupActions}
        slug={setupResult.slug}
      />
    )}
    <div className="max-w-3xl" dir="rtl">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Link href="/admin/clients" className="text-gray-400 hover:text-gray-600 transition-colors">
          <ArrowRight size={18} />
        </Link>
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">לקוח חדש</h1>
          <p className="text-sm text-gray-500 mt-0.5">הוסף לקוח/עסק חדש למערכת</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">

        {/* Section: Basic Info */}
        <section className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 space-y-4">
          <h2 className="font-semibold text-gray-900 text-sm uppercase tracking-wide text-gray-500">פרטים בסיסיים</h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="שם העסק" required error={errors.name}>
              <input
                value={form.name}
                onChange={(e) => set("name", e.target.value)}
                placeholder="חברת ישראל בע&quot;מ"
                className={inputCls(errors.name)}
              />
            </Field>

            <Field label="Slug (כתובת URL)" required error={errors.slug} hint="משמש בכתובת הטופס הציבורי">
              <div className="flex gap-2">
                <input
                  value={form.slug}
                  onChange={(e) => { setSlugManual(true); set("slug", e.target.value.toLowerCase()); }}
                  placeholder="israel-company"
                  dir="ltr"
                  className={`${inputCls(errors.slug)} flex-1`}
                />
                {slugManual && (
                  <button
                    type="button"
                    onClick={() => { setSlugManual(false); set("slug", slugify(form.name)); }}
                    className="text-xs text-gray-400 hover:text-gray-600 whitespace-nowrap"
                  >
                    איפוס
                  </button>
                )}
              </div>
              {form.slug && <p className="text-xs text-gray-400 mt-1">/{form.slug}/intake</p>}
            </Field>

            <Field label="תחום עיסוק" error={errors.industry}>
              <select value={form.industry} onChange={(e) => set("industry", e.target.value)} className={selectCls()}>
                <option value="">בחר תחום...</option>
                <option value="ROOFING">גגות</option>
                <option value="ALUMINUM">אלומיניום</option>
                <option value="COSMETICS">קוסמטיקה</option>
                <option value="CLEANING">ניקיון</option>
                <option value="REAL_ESTATE">נדל&quot;ן</option>
                <option value="AVIATION">תעופה</option>
                <option value="TOURISM">תיירות</option>
                <option value="FINANCE">פיננסים</option>
                <option value="LEGAL">משפטי</option>
                <option value="MEDICAL">רפואה</option>
                <option value="FOOD">מזון ומסעדנות</option>
                <option value="FITNESS">כושר ובריאות</option>
                <option value="EDUCATION">חינוך</option>
                <option value="GENERAL">כללי</option>
                <option value="OTHER">אחר</option>
              </select>
            </Field>

            <Field label="תוכנית" error={errors.plan}>
              <select value={form.plan} onChange={(e) => set("plan", e.target.value)} className={selectCls()}>
                <option value="BASIC">Basic</option>
                <option value="PRO">Pro</option>
                <option value="AGENCY">Agency</option>
              </select>
            </Field>
          </div>

          <div className="flex items-center gap-3">
            <Field label="צבע מותג" error={errors.primaryColor}>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={form.primaryColor}
                  onChange={(e) => set("primaryColor", e.target.value)}
                  className="h-9 w-16 rounded-lg border border-gray-200 cursor-pointer p-0.5"
                />
                <span className="text-sm text-gray-500 font-mono">{form.primaryColor}</span>
              </div>
            </Field>
          </div>
        </section>

        {/* Section: Contact */}
        <section className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 space-y-4">
          <h2 className="font-semibold text-gray-900 text-sm uppercase tracking-wide text-gray-500">פרטי יצירת קשר</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="אימייל" required error={errors.email}>
              <input
                type="email"
                dir="ltr"
                value={form.email}
                onChange={(e) => set("email", e.target.value)}
                placeholder="contact@business.com"
                className={inputCls(errors.email)}
              />
            </Field>
            <Field label="טלפון" error={errors.phone}>
              <input
                type="tel"
                dir="ltr"
                value={form.phone}
                onChange={(e) => set("phone", e.target.value)}
                placeholder="050-0000000"
                className={inputCls()}
              />
            </Field>
            <Field label="וואטסאפ (לעדכונים אוטומטיים)" error={errors.whatsappNumber}>
              <input
                type="tel"
                dir="ltr"
                value={form.whatsappNumber}
                onChange={(e) => set("whatsappNumber", e.target.value)}
                placeholder="972501234567"
                className={inputCls()}
              />
            </Field>
          </div>
        </section>

        {/* Section: Budget & Reports */}
        <section className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 space-y-4">
          <h2 className="font-semibold text-gray-900 text-sm uppercase tracking-wide text-gray-500">תקציב ודוחות</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="תקציב חודשי (₪)" error={errors.monthlyBudget}>
              <input
                type="number"
                min="0"
                value={form.monthlyBudget}
                onChange={(e) => set("monthlyBudget", e.target.value)}
                placeholder="5000"
                className={inputCls()}
              />
            </Field>
            <Field label="תדירות דוחות">
              <select value={form.reportFrequency} onChange={(e) => set("reportFrequency", e.target.value)} className={selectCls()}>
                <option value="WEEKLY">שבועי</option>
                <option value="MONTHLY">חודשי</option>
                <option value="BOTH">שניהם</option>
              </select>
            </Field>
            <Field label="אימייל לדוחות" error={errors.reportEmail} hint="לאן לשלוח דוחות אוטומטיים">
              <input
                type="email"
                dir="ltr"
                value={form.reportEmail}
                onChange={(e) => set("reportEmail", e.target.value)}
                placeholder="reports@business.com"
                className={inputCls(errors.reportEmail)}
              />
            </Field>
          </div>
        </section>

        {/* Section: Integrations */}
        <section className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 space-y-4">
          <h2 className="font-semibold text-gray-900 text-sm uppercase tracking-wide text-gray-500">אינטגרציות</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="n8n Webhook URL" error={errors.n8nWebhookUrl} hint="לאוטומציות">
              <input
                dir="ltr"
                value={form.n8nWebhookUrl}
                onChange={(e) => set("n8nWebhookUrl", e.target.value)}
                placeholder="https://n8n.example.com/webhook/..."
                className={inputCls(errors.n8nWebhookUrl)}
              />
            </Field>
            <Field label="Facebook Pixel ID" error={errors.facebookPixelId}>
              <input
                dir="ltr"
                value={form.facebookPixelId}
                onChange={(e) => set("facebookPixelId", e.target.value)}
                placeholder="1234567890"
                className={inputCls()}
              />
            </Field>
            <Field label="Google Ads ID" error={errors.googleAdsId}>
              <input
                dir="ltr"
                value={form.googleAdsId}
                onChange={(e) => set("googleAdsId", e.target.value)}
                placeholder="AW-XXXXXXXXXX"
                className={inputCls()}
              />
            </Field>
          </div>
        </section>

        {/* Section: Client Portal */}
        <section className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 space-y-4">
          <div>
            <h2 className="font-semibold text-gray-900 text-sm uppercase tracking-wide text-gray-500">פורטל לקוח</h2>
            <p className="text-xs text-gray-400 mt-0.5">סיסמה לכניסת הלקוח לפורטל צפייה בנתונים — /client/{form.slug || "slug"}</p>
          </div>
          <div className="max-w-sm">
            <Field label="סיסמת פורטל" error={errors.portalPassword} hint="לפחות 6 תווים. ניתן לשנות בהגדרות הלקוח.">
              <input
                type="password"
                dir="ltr"
                value={form.portalPassword}
                onChange={(e) => set("portalPassword", e.target.value)}
                placeholder="••••••••"
                className={inputCls(errors.portalPassword)}
              />
            </Field>
          </div>
        </section>

        {serverError && (
          <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700">
            {serverError}
          </div>
        )}

        {/* Submit */}
        <div className="flex gap-3">
          <button
            type="submit"
            disabled={loading}
            className="flex items-center gap-2 bg-indigo-500 hover:bg-indigo-600 disabled:opacity-60 text-white text-sm font-medium px-6 py-2.5 rounded-lg transition-colors"
          >
            {loading && <Loader2 size={15} className="animate-spin" />}
            {loading ? "שומר..." : "צור לקוח"}
          </button>
          <Link
            href="/admin/clients"
            className="border border-gray-200 text-gray-600 text-sm font-medium px-6 py-2.5 rounded-lg hover:bg-gray-50 transition-colors"
          >
            ביטול
          </Link>
        </div>
      </form>
    </div>
    </>
  );
}
