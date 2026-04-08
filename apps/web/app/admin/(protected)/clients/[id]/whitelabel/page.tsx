"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowRight, CheckCircle, XCircle, Loader2 } from "lucide-react";

interface WhitelabelSettings {
  brandName:           string;
  brandLogo:           string;
  brandPrimaryColor:   string;
  brandSecondaryColor: string;
  customDomain:        string;
  whitelabelEnabled:   boolean;
  portalTitle:         string;
  portalWelcome:       string;
  portalFooter:        string;
}

const DEFAULTS: WhitelabelSettings = {
  brandName:           "",
  brandLogo:           "",
  brandPrimaryColor:   "#6366f1",
  brandSecondaryColor: "#8b5cf6",
  customDomain:        "",
  whitelabelEnabled:   false,
  portalTitle:         "",
  portalWelcome:       "",
  portalFooter:        "",
};

export default function WhitelabelPage() {
  const params = useParams();
  const clientId = params.id as string;

  const [settings, setSettings] = useState<WhitelabelSettings>(DEFAULTS);
  const [loading, setLoading]   = useState(true);
  const [saving, setSaving]     = useState(false);
  const [saved, setSaved]       = useState(false);
  const [error, setError]       = useState<string | null>(null);

  // Domain verification state
  const [verifying, setVerifying]     = useState(false);
  const [domainVerified, setDomainVerified] = useState<boolean | null>(null);

  const fetchSettings = useCallback(async () => {
    try {
      const res = await fetch(`/api/clients/${clientId}/whitelabel`);
      if (!res.ok) throw new Error("שגיאה בטעינת הנתונים");
      const data = await res.json();
      setSettings({
        ...DEFAULTS,
        ...data.whitelabel,
        brandPrimaryColor:   data.whitelabel.brandPrimaryColor   ?? DEFAULTS.brandPrimaryColor,
        brandSecondaryColor: data.whitelabel.brandSecondaryColor ?? DEFAULTS.brandSecondaryColor,
        brandName:           data.whitelabel.brandName           ?? "",
        brandLogo:           data.whitelabel.brandLogo           ?? "",
        customDomain:        data.whitelabel.customDomain        ?? "",
        portalTitle:         data.whitelabel.portalTitle         ?? "",
        portalWelcome:       data.whitelabel.portalWelcome       ?? "",
        portalFooter:        data.whitelabel.portalFooter        ?? "",
      });
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "שגיאה לא ידועה");
    } finally {
      setLoading(false);
    }
  }, [clientId]);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    setSaved(false);
    try {
      const res = await fetch(`/api/clients/${clientId}/whitelabel`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });
      if (!res.ok) throw new Error("שגיאה בשמירת ההגדרות");
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "שגיאה לא ידועה");
    } finally {
      setSaving(false);
    }
  };

  const handleVerifyDomain = async () => {
    if (!settings.customDomain.trim()) return;
    setVerifying(true);
    setDomainVerified(null);
    try {
      const res = await fetch("/api/whitelabel/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clientId, domain: settings.customDomain }),
      });
      const data = await res.json();
      setDomainVerified(data.verified === true);
    } catch {
      setDomainVerified(false);
    } finally {
      setVerifying(false);
    }
  };

  const update = (field: keyof WhitelabelSettings, value: string | boolean) => {
    setSettings((prev) => ({ ...prev, [field]: value }));
  };

  if (loading) return null; // loading.tsx handles this

  return (
    <div className="space-y-8 max-w-3xl" dir="rtl">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href={`/admin/clients/${clientId}`} className="text-slate-400 hover:text-slate-600">
          <ArrowRight size={18} />
        </Link>
        <div>
          <h1 className="text-xl font-semibold text-slate-900">הגדרות White-label</h1>
          <p className="text-sm text-slate-500 mt-0.5">התאם את המיתוג של הפורטל ללקוח</p>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm">
          {error}
        </div>
      )}

      {/* ── Section 1: מיתוג בסיסי ── */}
      <section className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100">
          <h2 className="font-semibold text-slate-900">מיתוג בסיסי</h2>
          <p className="text-xs text-slate-500 mt-0.5">שם המותג, לוגו וצבעים שיופיעו בפורטל הלקוח</p>
        </div>
        <div className="p-6 space-y-5">
          {/* whitelabelEnabled toggle */}
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-800">הפעל White-label</p>
              <p className="text-xs text-slate-500 mt-0.5">הצג מיתוג מותאם אישית בפורטל הלקוח</p>
            </div>
            <button
              type="button"
              onClick={() => update("whitelabelEnabled", !settings.whitelabelEnabled)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
                settings.whitelabelEnabled ? "bg-blue-600" : "bg-slate-200"
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                  settings.whitelabelEnabled ? "translate-x-6" : "translate-x-1"
                }`}
              />
            </button>
          </div>

          {/* brandName */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              שם המותג
              <span className="text-slate-400 font-normal mr-1.5">— יחליף את &apos;MarketingOS&apos;</span>
            </label>
            <input
              type="text"
              value={settings.brandName}
              onChange={(e) => update("brandName", e.target.value)}
              placeholder="שם החברה שלך"
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* brandLogo */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">לוגו URL</label>
            <input
              type="url"
              value={settings.brandLogo}
              onChange={(e) => update("brandLogo", e.target.value)}
              placeholder="https://example.com/logo.png"
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {settings.brandLogo && (
              <div className="mt-2">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={settings.brandLogo}
                  alt="תצוגה מקדימה של הלוגו"
                  className="h-12 object-contain rounded border border-slate-100 p-1"
                  onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                />
              </div>
            )}
          </div>

          {/* Colors */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">צבע ראשי</label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={settings.brandPrimaryColor}
                  onChange={(e) => update("brandPrimaryColor", e.target.value)}
                  className="h-9 w-12 cursor-pointer rounded border border-slate-200 p-0.5"
                />
                <input
                  type="text"
                  value={settings.brandPrimaryColor}
                  onChange={(e) => update("brandPrimaryColor", e.target.value)}
                  className="flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">צבע משני</label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={settings.brandSecondaryColor}
                  onChange={(e) => update("brandSecondaryColor", e.target.value)}
                  className="h-9 w-12 cursor-pointer rounded border border-slate-200 p-0.5"
                />
                <input
                  type="text"
                  value={settings.brandSecondaryColor}
                  onChange={(e) => update("brandSecondaryColor", e.target.value)}
                  className="flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Preview box */}
          <div>
            <p className="text-xs text-slate-500 mb-2 font-medium">ככה ייראה הפורטל שלך</p>
            <div
              className="rounded-xl border border-slate-200 overflow-hidden"
              style={{ fontFamily: "inherit" }}
            >
              {/* Mock portal header */}
              <div
                className="px-4 py-3 flex items-center gap-3"
                style={{ backgroundColor: settings.brandPrimaryColor }}
              >
                {settings.brandLogo ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={settings.brandLogo}
                    alt="לוגו"
                    className="h-7 object-contain"
                    onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                  />
                ) : (
                  <div className="h-7 w-7 rounded-lg bg-white bg-opacity-30" />
                )}
                <span className="text-white font-semibold text-sm">
                  {settings.brandName || "שם המותג"}
                </span>
              </div>
              {/* Mock portal body */}
              <div className="bg-slate-50 px-4 py-3 flex gap-2">
                <div
                  className="h-7 rounded-lg px-3 flex items-center text-white text-xs font-medium"
                  style={{ backgroundColor: settings.brandPrimaryColor }}
                >
                  דף הבית
                </div>
                <div className="h-7 rounded-lg px-3 flex items-center text-slate-500 text-xs">לידים</div>
                <div className="h-7 rounded-lg px-3 flex items-center text-slate-500 text-xs">דוחות</div>
              </div>
              <div className="bg-white px-4 py-3 border-t border-slate-100">
                <div className="h-3 w-32 rounded" style={{ backgroundColor: settings.brandSecondaryColor, opacity: 0.4 }} />
                <div className="h-2 w-48 bg-slate-100 rounded mt-2" />
                <div className="h-2 w-36 bg-slate-100 rounded mt-1.5" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Section 2: דומיין מותאם ── */}
      <section className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100">
          <h2 className="font-semibold text-slate-900">דומיין מותאם</h2>
          <p className="text-xs text-slate-500 mt-0.5">חבר דומיין משלך לפורטל הלקוח</p>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">דומיין</label>
            <input
              type="text"
              value={settings.customDomain}
              onChange={(e) => update("customDomain", e.target.value)}
              placeholder="crm.yoursite.co.il"
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              dir="ltr"
            />
          </div>

          {/* DNS instructions */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-sm text-slate-600 space-y-1">
            <p className="font-medium text-slate-700 mb-2">הוראות חיבור DNS:</p>
            <p>1. פתח את ה-DNS שלך</p>
            <p>2. הוסף CNAME: <code className="bg-slate-200 px-1 rounded text-xs" dir="ltr">crm → marketingos.co.il</code></p>
            <p>3. לחץ &quot;אמת דומיין&quot;</p>
          </div>

          {/* Verify button + status */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleVerifyDomain}
              disabled={verifying || !settings.customDomain.trim()}
              className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {verifying && <Loader2 size={14} className="animate-spin" />}
              אמת דומיין
            </button>

            {domainVerified === true && (
              <span className="inline-flex items-center gap-1.5 text-sm font-medium text-green-700 bg-green-50 border border-green-200 rounded-full px-3 py-1">
                <CheckCircle size={14} />
                מחובר
              </span>
            )}
            {domainVerified === false && (
              <span className="inline-flex items-center gap-1.5 text-sm font-medium text-red-700 bg-red-50 border border-red-200 rounded-full px-3 py-1">
                <XCircle size={14} />
                לא מחובר
              </span>
            )}
          </div>
        </div>
      </section>

      {/* ── Section 3: תוכן מותאם ── */}
      <section className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100">
          <h2 className="font-semibold text-slate-900">תוכן מותאם</h2>
          <p className="text-xs text-slate-500 mt-0.5">טקסטים שיופיעו בפורטל הלקוח</p>
        </div>
        <div className="p-6 space-y-5">
          {/* portalTitle */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">כותרת פורטל</label>
            <input
              type="text"
              value={settings.portalTitle}
              onChange={(e) => update("portalTitle", e.target.value)}
              placeholder="ברוכים הבאים לפורטל שלנו"
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* portalWelcome */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">הודעת ברוכים הבאים</label>
            <textarea
              value={settings.portalWelcome}
              onChange={(e) => update("portalWelcome", e.target.value)}
              placeholder="שלום! כאן תוכלו לעקוב אחר כל הלידים והנתונים שלכם."
              rows={3}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
          </div>

          {/* portalFooter */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Footer text</label>
            <input
              type="text"
              value={settings.portalFooter}
              onChange={(e) => update("portalFooter", e.target.value)}
              placeholder="© 2025 שם החברה. כל הזכויות שמורות."
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </section>

      {/* Save button */}
      <div className="flex items-center justify-end gap-3 pb-8">
        {saved && (
          <span className="text-sm text-green-600 font-medium flex items-center gap-1">
            <CheckCircle size={14} />
            נשמר בהצלחה
          </span>
        )}
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-6 py-2.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {saving && <Loader2 size={14} className="animate-spin" />}
          {saving ? "שומר..." : "שמור הגדרות"}
        </button>
      </div>
    </div>
  );
}
