"use client";

import { useState } from "react";
import { Loader2, Check, Zap, Eye, EyeOff, Trash2 } from "lucide-react";
import toast from "react-hot-toast";
import { CopyLinkButton } from "./CopyLinkButton";

type Client = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  slug: string;
  primaryColor: string;
  isActive: boolean;
  industry: string | null;
  plan: string;
  monthlyBudget: number | null;
  reportEmail: string | null;
  reportFrequency: string;
  whatsappNumber: string | null;
  n8nWebhookUrl: string | null;
  facebookPixelId: string | null;
  facebookPageId: string | null;
  facebookAccessToken: string | null;
  googleAdsId: string | null;
  googleAnalyticsId: string | null;
  googleBusinessUrl: string | null;
  greenApiInstanceId: string | null;
  greenApiToken: string | null;
};

const inputCls = "w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 bg-white";
const selectCls = "w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 bg-white";

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      {hint && <p className="text-xs text-gray-400 mb-1">{hint}</p>}
      {children}
    </div>
  );
}

export function ClientSettingsForm({ client }: { client: Client }) {
  const [form, setForm] = useState({
    name: client.name,
    email: client.email,
    phone: client.phone ?? "",
    primaryColor: client.primaryColor,
    isActive: client.isActive,
    industry: client.industry ?? "",
    plan: client.plan,
    monthlyBudget: client.monthlyBudget?.toString() ?? "",
    reportEmail: client.reportEmail ?? "",
    reportFrequency: client.reportFrequency,
    whatsappNumber: client.whatsappNumber ?? "",
    n8nWebhookUrl: client.n8nWebhookUrl ?? "",
    facebookPixelId: client.facebookPixelId ?? "",
    facebookPageId: client.facebookPageId ?? "",
    facebookAccessToken: client.facebookAccessToken ?? "",
    googleAdsId: client.googleAdsId ?? "",
    googleAnalyticsId: client.googleAnalyticsId ?? "",
    googleBusinessUrl: client.googleBusinessUrl ?? "",
    greenApiInstanceId: client.greenApiInstanceId ?? "",
    greenApiToken: client.greenApiToken ?? "",
    portalPassword: "",
  });

  const [saving, setSaving] = useState(false);
  const [testingWebhook, setTestingWebhook] = useState(false);
  const [showPortalPw, setShowPortalPw] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  function set(key: keyof typeof form, value: string | boolean) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);

    try {
      const res = await fetch(`/api/clients/${client.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          email: form.email,
          phone: form.phone || null,
          primaryColor: form.primaryColor,
          isActive: form.isActive,
          industry: form.industry || null,
          plan: form.plan,
          monthlyBudget: form.monthlyBudget ? Number(form.monthlyBudget) : null,
          reportEmail: form.reportEmail || null,
          reportFrequency: form.reportFrequency,
          whatsappNumber: form.whatsappNumber || null,
          n8nWebhookUrl: form.n8nWebhookUrl || null,
          facebookPixelId: form.facebookPixelId || null,
          facebookPageId: form.facebookPageId || null,
          facebookAccessToken: form.facebookAccessToken || null,
          googleAdsId: form.googleAdsId || null,
          googleAnalyticsId: form.googleAnalyticsId || null,
          googleBusinessUrl: form.googleBusinessUrl || null,
          greenApiInstanceId: form.greenApiInstanceId || null,
          greenApiToken: form.greenApiToken || null,
          // רק אם הוזנה סיסמה חדשה
          ...(form.portalPassword ? { portalPassword: form.portalPassword } : {}),
        }),
      });

      if (res.ok) {
        setForm((f) => ({ ...f, portalPassword: "" }));
        toast.success("ההגדרות נשמרו בהצלחה!");
      } else {
        const data = await res.json();
        toast.error(data.error ?? "שגיאה בשמירה");
      }
    } catch {
      toast.error("שגיאת חיבור לשרת");
    } finally {
      setSaving(false);
    }
  }

  async function handleTestWebhook() {
    if (!form.n8nWebhookUrl) {
      toast.error("הכנס כתובת Webhook לפני הבדיקה");
      return;
    }
    setTestingWebhook(true);
    try {
      const res = await fetch(form.n8nWebhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          event: "webhook.test",
          timestamp: new Date().toISOString(),
          client: { id: client.id, name: client.name, slug: client.slug },
          data: { message: "בדיקת חיבור מ-MarketingOS" },
        }),
      });
      if (res.ok) {
        toast.success("הבדיקה עברה בהצלחה! ה-Webhook מחובר.");
      } else {
        toast.error(`הבדיקה נכשלה (${res.status})`);
      }
    } catch {
      toast.error("לא ניתן להגיע ל-Webhook — בדוק את הכתובת");
    } finally {
      setTestingWebhook(false);
    }
  }

  async function handleDelete() {
    setDeleteLoading(true);
    try {
      const res = await fetch(`/api/clients/${client.id}`, { method: "DELETE" });
      if (res.ok) {
        toast.success("הלקוח נמחק");
        window.location.href = "/admin/clients";
      } else {
        toast.error("שגיאה במחיקת הלקוח");
        setShowDeleteConfirm(false);
      }
    } catch {
      toast.error("שגיאת חיבור");
    } finally {
      setDeleteLoading(false);
    }
  }

  return (
    <form onSubmit={handleSave} className="space-y-6">
      {/* פרטים בסיסיים */}
      <section className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 space-y-4">
        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">פרטים בסיסיים</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="שם העסק">
            <input value={form.name} onChange={(e) => set("name", e.target.value)} className={inputCls} />
          </Field>
          <Field label="Slug (קריאה בלבד)">
            <input value={client.slug} readOnly className={`${inputCls} bg-gray-50 text-gray-400 cursor-not-allowed`} dir="ltr" />
          </Field>
          {(client as Client & { subdomain?: string | null }).subdomain && (
            <Field label="תת-דומיין" hint="כתובת הדף הנחיתה שלך">
              <div className="flex items-center gap-2">
                <input
                  value={`${(client as Client & { subdomain?: string | null }).subdomain}.${process.env.NEXT_PUBLIC_ROOT_DOMAIN ?? "localhost"}`}
                  readOnly
                  className={`${inputCls} bg-gray-50 text-gray-400 cursor-not-allowed flex-1`}
                  dir="ltr"
                />
                <CopyLinkButton
                  url={`https://${(client as Client & { subdomain?: string | null }).subdomain}.${process.env.NEXT_PUBLIC_ROOT_DOMAIN ?? "localhost"}`}
                  label=""
                />
              </div>
            </Field>
          )}
          <Field label="תחום עיסוק">
            <select value={form.industry} onChange={(e) => set("industry", e.target.value)} className={selectCls}>
              <option value="">—</option>
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
          <Field label="תוכנית">
            <select value={form.plan} onChange={(e) => set("plan", e.target.value)} className={selectCls}>
              <option value="BASIC">Basic</option>
              <option value="PRO">Pro</option>
              <option value="AGENCY">Agency</option>
            </select>
          </Field>
          <Field label="צבע מותג">
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
          <Field label="סטטוס">
            <label className="flex items-center gap-2 cursor-pointer mt-1">
              <input
                type="checkbox"
                checked={form.isActive}
                onChange={(e) => set("isActive", e.target.checked)}
                className="w-4 h-4 rounded border-gray-300 text-indigo-500 focus:ring-indigo-400"
              />
              <span className="text-sm text-gray-700">לקוח פעיל</span>
            </label>
          </Field>
        </div>
      </section>

      {/* יצירת קשר */}
      <section className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 space-y-4">
        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">יצירת קשר</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="אימייל">
            <input type="email" dir="ltr" value={form.email} onChange={(e) => set("email", e.target.value)} className={inputCls} />
          </Field>
          <Field label="טלפון">
            <input type="tel" dir="ltr" value={form.phone} onChange={(e) => set("phone", e.target.value)} className={inputCls} />
          </Field>
          <Field label="וואטסאפ">
            <input type="tel" dir="ltr" value={form.whatsappNumber} onChange={(e) => set("whatsappNumber", e.target.value)} placeholder="972501234567" className={inputCls} />
          </Field>
        </div>
      </section>

      {/* תקציב ודוחות */}
      <section className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 space-y-4">
        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">תקציב ודוחות</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="תקציב חודשי (₪)">
            <input type="number" min="0" value={form.monthlyBudget} onChange={(e) => set("monthlyBudget", e.target.value)} placeholder="5000" className={inputCls} />
          </Field>
          <Field label="תדירות דוחות">
            <select value={form.reportFrequency} onChange={(e) => set("reportFrequency", e.target.value)} className={selectCls}>
              <option value="WEEKLY">שבועי</option>
              <option value="MONTHLY">חודשי</option>
              <option value="BOTH">שניהם</option>
            </select>
          </Field>
          <Field label="אימייל לדוחות">
            <input type="email" dir="ltr" value={form.reportEmail} onChange={(e) => set("reportEmail", e.target.value)} className={inputCls} />
          </Field>
        </div>
      </section>

      {/* אינטגרציות */}
      <section className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 space-y-4">
        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">אינטגרציות</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <Field label="n8n Webhook URL" hint="אוטומציות — כל ליד חדש יישלח לכאן">
              <div className="flex gap-2">
                <input
                  dir="ltr"
                  value={form.n8nWebhookUrl}
                  onChange={(e) => set("n8nWebhookUrl", e.target.value)}
                  placeholder="https://n8n.example.com/webhook/..."
                  className={`${inputCls} flex-1`}
                />
                <button
                  type="button"
                  onClick={handleTestWebhook}
                  disabled={testingWebhook || !form.n8nWebhookUrl}
                  className="flex items-center gap-1.5 text-xs border border-gray-200 text-gray-600 px-3 py-2 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-40 whitespace-nowrap"
                >
                  {testingWebhook ? <Loader2 size={12} className="animate-spin" /> : <Zap size={12} />}
                  בדוק
                </button>
              </div>
            </Field>
          </div>
          <Field label="Facebook Pixel ID">
            <input dir="ltr" value={form.facebookPixelId} onChange={(e) => set("facebookPixelId", e.target.value)} className={inputCls} />
          </Field>
          <Field label="Facebook Page ID" hint="לקבלת לידים מ-Facebook Lead Ads">
            <input dir="ltr" value={form.facebookPageId} onChange={(e) => set("facebookPageId", e.target.value)} placeholder="123456789012345" className={inputCls} />
          </Field>
          <div className="sm:col-span-2">
            <Field label="Facebook Access Token" hint="Page Access Token מ-Meta for Developers — נדרש לקבלת פרטי לידים">
              <input dir="ltr" type="password" value={form.facebookAccessToken} onChange={(e) => set("facebookAccessToken", e.target.value)} placeholder="EAAxxxxx..." className={inputCls} />
            </Field>
          </div>
          <Field label="Google Ads ID">
            <input dir="ltr" value={form.googleAdsId} onChange={(e) => set("googleAdsId", e.target.value)} placeholder="AW-XXXXXXXXXX" className={inputCls} />
          </Field>
          <Field label="Google Analytics 4" hint="Measurement ID — G-XXXXXXXXXX">
            <input dir="ltr" value={form.googleAnalyticsId} onChange={(e) => set("googleAnalyticsId", e.target.value)} placeholder="G-XXXXXXXXXX" className={inputCls} />
          </Field>
          <Field label="Google Business קישור" hint="לשליחת בקשות לביקורות ב-Google">
            <input dir="ltr" value={form.googleBusinessUrl} onChange={(e) => set("googleBusinessUrl", e.target.value)} placeholder="https://g.page/r/..." className={inputCls} />
          </Field>
          <Field label="Green API — Instance ID" hint="וואצאפ ישיר ללא n8n — מ-app.green-api.com">
            <input dir="ltr" value={form.greenApiInstanceId} onChange={(e) => set("greenApiInstanceId", e.target.value)} placeholder="1101XXXXXXXX" className={inputCls} />
          </Field>
          <Field label="Green API — API Token">
            <input dir="ltr" type="password" value={form.greenApiToken} onChange={(e) => set("greenApiToken", e.target.value)} placeholder="xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx" className={inputCls} />
          </Field>
        </div>
      </section>

      {/* פורטל לקוח */}
      <section className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 space-y-4">
        <div>
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">פורטל לקוח</h3>
          <p className="text-xs text-gray-400 mt-0.5">הלקוח יתחבר עם ה-Slug שלו + הסיסמה לצפייה בנתונים</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <CopyLinkButton url={`/client/${client.slug}`} label="העתק קישור לפורטל" />
          <span className="text-xs text-gray-400 font-mono">/client/{client.slug}</span>
        </div>
        <div className="max-w-sm">
          <Field label="סיסמת פורטל חדשה" hint="השאר ריק כדי לא לשנות. לפחות 6 תווים.">
            <div className="relative">
              <input
                type={showPortalPw ? "text" : "password"}
                dir="ltr"
                value={form.portalPassword}
                onChange={(e) => set("portalPassword", e.target.value)}
                placeholder="••••••••"
                className={`${inputCls} pr-9`}
              />
              <button
                type="button"
                onClick={() => setShowPortalPw(!showPortalPw)}
                className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showPortalPw ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>
          </Field>
        </div>
      </section>

      {/* Save button */}
      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={saving}
          className="flex items-center gap-2 bg-indigo-500 hover:bg-indigo-600 disabled:opacity-60 text-white text-sm font-medium px-5 py-2.5 rounded-lg transition-colors"
        >
          {saving ? <Loader2 size={15} className="animate-spin" /> : <Check size={15} />}
          {saving ? "שומר..." : "שמור שינויים"}
        </button>
      </div>

      {/* Danger zone */}
      <section className="bg-white rounded-xl border border-red-100 shadow-sm p-6">
        <h3 className="text-sm font-semibold text-red-600 uppercase tracking-wide mb-3">אזור מסוכן</h3>
        {!showDeleteConfirm ? (
          <button
            type="button"
            onClick={() => setShowDeleteConfirm(true)}
            className="flex items-center gap-2 text-red-500 border border-red-200 text-sm font-medium px-4 py-2 rounded-lg hover:bg-red-50 transition-colors"
          >
            <Trash2 size={14} />
            מחק לקוח
          </button>
        ) : (
          <div className="space-y-3">
            <p className="text-sm text-red-700 bg-red-50 rounded-lg px-4 py-3 border border-red-200">
              ⚠️ האם אתה בטוח? מחיקת לקוח תמחק גם את כל הלידים, הדוחות והטפסים שלו. פעולה זו <strong>לא ניתנת לביטול</strong>.
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleDelete}
                disabled={deleteLoading}
                className="flex items-center gap-2 bg-red-500 hover:bg-red-600 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors disabled:opacity-60"
              >
                {deleteLoading && <Loader2 size={13} className="animate-spin" />}
                כן, מחק לקוח
              </button>
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(false)}
                className="border border-gray-200 text-gray-600 text-sm font-medium px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors"
              >
                ביטול
              </button>
            </div>
          </div>
        )}
      </section>
    </form>
  );
}
