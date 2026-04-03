"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  ArrowRight,
  ArrowLeft,
  Loader2,
  Check,
  Copy,
  ExternalLink,
  Share2,
  Sparkles,
} from "lucide-react";

interface Props {
  client: {
    id: string;
    name: string;
    slug: string;
    industry: string;
    pagePublished: boolean;
    phone: string;
  };
  appUrl: string;
}

const INDUSTRY_LABELS: Record<string, string> = {
  ROOFING: "גגות ואלומיניום",
  ALUMINUM: "אלומיניום",
  COSMETICS: "קוסמטיקה ויופי",
  CLEANING: "ניקיון",
  REAL_ESTATE: 'נדל"ן',
  AVIATION: "תעופה",
  TOURISM: "תיירות",
  FINANCE: "פיננסים",
  LEGAL: "משפטי",
  MEDICAL: "רפואה",
  FOOD: "מזון ומסעדנות",
  FITNESS: "כושר ובריאות",
  EDUCATION: "חינוך",
  GENERAL: "כללי",
  OTHER: "אחר",
};

const AGE_OPTIONS = ["18-25", "25-35", "35-50", "50+", "כל הגילאים"];

const CTA_OPTIONS = [
  "שלח פרטים",
  "קבע תור",
  "קבל הצעת מחיר",
  "הזמן עכשיו",
  "דבר איתנו",
  "הרשם חינם",
];

const PROGRESS_MESSAGES = [
  "מנתח את העסק שלך...",
  "יוצר כותרת מנצחת...",
  "בונה את הבלוקים...",
  "מעצב את הצבעים...",
  "מוכן! 🎉",
];

export function WizardClient({ client, appUrl }: Props) {
  const [step, setStep] = useState(1);

  // Step 1 fields
  const [businessName, setBusinessName] = useState(client.name);
  const [industry] = useState(client.industry);
  const [city, setCity] = useState("");
  const [description, setDescription] = useState("");
  const [uniqueValue, setUniqueValue] = useState("");

  // Step 2 fields
  const [targetAge, setTargetAge] = useState("כל הגילאים");
  const [problem, setProblem] = useState("");
  const [priceRange, setPriceRange] = useState("");
  const [cta, setCta] = useState("שלח פרטים");

  // Step 3
  const [building, setBuilding] = useState(false);
  const [progressIdx, setProgressIdx] = useState(0);
  const [buildError, setBuildError] = useState("");

  // Step 4
  const [pageColor, setPageColor] = useState("#6366f1");
  const [pageTitle, setPageTitle] = useState("");
  const [saving, setSaving] = useState(false);

  // Step 5
  const [copied, setCopied] = useState(false);

  const pageUrl = `${appUrl}/${client.slug}`;

  // Step 3: Build page
  const buildPage = useCallback(async () => {
    setBuilding(true);
    setBuildError("");
    setProgressIdx(0);

    const interval = setInterval(() => {
      setProgressIdx((prev) => Math.min(prev + 1, PROGRESS_MESSAGES.length - 1));
    }, 1200);

    try {
      const res = await fetch("/api/ai/build-landing-page", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientId: client.id,
          wizardData: {
            businessName,
            industry: INDUSTRY_LABELS[industry] ?? industry,
            city,
            description,
            uniqueValue,
            targetAge,
            problem,
            priceRange,
            cta,
          },
        }),
      });

      const data = (await res.json()) as {
        ok?: boolean;
        error?: string;
        landingPageTitle?: string;
        landingPageColor?: string;
      };

      clearInterval(interval);

      if (!res.ok || !data.ok) {
        setBuildError(data.error ?? "שגיאה — נסה שוב");
        setBuilding(false);
        return;
      }

      setPageTitle(data.landingPageTitle ?? businessName);
      setPageColor(data.landingPageColor ?? "#6366f1");
      setProgressIdx(PROGRESS_MESSAGES.length - 1);

      setTimeout(() => {
        setBuilding(false);
        setStep(4);
      }, 1000);
    } catch {
      clearInterval(interval);
      setBuildError("שגיאת חיבור — נסה שוב");
      setBuilding(false);
    }
  }, [client.id, businessName, industry, city, description, uniqueValue, targetAge, problem, priceRange, cta]);

  useEffect(() => {
    if (step === 3 && !building && !buildError) {
      buildPage();
    }
  }, [step, building, buildError, buildPage]);

  // Step 4: Quick edit save
  async function saveQuickEdit(field: string, value: string) {
    setSaving(true);
    await fetch(`/api/clients/${client.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ [field]: value }),
    });
    setSaving(false);
  }

  function copyUrl() {
    navigator.clipboard.writeText(pageUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  // Step progress indicator
  const stepLabels = ["העסק", "הלקוח", "AI בונה", "תצוגה", "מוכן!"];

  return (
    <div className="min-h-screen bg-gray-50" dir="rtl">
      {/* Progress bar */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center justify-between mb-3">
            <h1 className="text-lg font-bold text-gray-900">🧙 אשף בניית דף נחיתה</h1>
            <span className="text-sm text-gray-400">שלב {step} מתוך 5</span>
          </div>
          <div className="flex gap-2">
            {stepLabels.map((label, i) => (
              <div key={label} className="flex-1">
                <div
                  className={`h-1.5 rounded-full transition-all ${
                    i + 1 <= step ? "bg-indigo-500" : "bg-gray-200"
                  }`}
                />
                <p
                  className={`text-[10px] mt-1 text-center ${
                    i + 1 === step ? "text-indigo-600 font-medium" : "text-gray-400"
                  }`}
                >
                  {label}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-6 py-8">
        {/* STEP 1: Business Info */}
        {step === 1 && (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <div className="text-4xl mb-3">🏢</div>
              <h2 className="text-2xl font-bold text-gray-900">ספר לנו על העסק שלך</h2>
              <p className="text-gray-500 mt-1">ענה על כמה שאלות ונבנה לך דף מושלם</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">שם העסק</label>
              <input
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400 outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">ענף</label>
              <div className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-600">
                {INDUSTRY_LABELS[industry] ?? industry}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">עיר / אזור פעילות</label>
              <input
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="למשל: תל אביב והמרכז"
                className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400 outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">מה אתה מציע? (2-3 משפטים)</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                placeholder="תאר את השירות או המוצר העיקרי שלך..."
                className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400 outline-none resize-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">מה מיוחד אצלך?</label>
              <textarea
                value={uniqueValue}
                onChange={(e) => setUniqueValue(e.target.value)}
                rows={2}
                placeholder="למה לבחור בך ולא במתחרים?"
                className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400 outline-none resize-none"
              />
            </div>

            <button
              onClick={() => setStep(2)}
              disabled={!businessName.trim() || !description.trim()}
              className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl py-3 text-sm transition-colors disabled:opacity-40"
            >
              הבא
              <ArrowLeft size={16} />
            </button>
          </div>
        )}

        {/* STEP 2: Target Customer */}
        {step === 2 && (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <div className="text-4xl mb-3">🎯</div>
              <h2 className="text-2xl font-bold text-gray-900">מי הלקוח האידיאלי שלך?</h2>
              <p className="text-gray-500 mt-1">ככל שנדע יותר — הדף יהיה יותר ממוקד</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">גיל קהל יעד</label>
              <div className="flex flex-wrap gap-2">
                {AGE_OPTIONS.map((age) => (
                  <button
                    key={age}
                    onClick={() => setTargetAge(age)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                      targetAge === age
                        ? "bg-indigo-600 text-white"
                        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                    }`}
                  >
                    {age}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">מה הבעיה שאתה פותר?</label>
              <textarea
                value={problem}
                onChange={(e) => setProblem(e.target.value)}
                rows={2}
                placeholder="למשל: לקוחות מתקשים למצוא קבלן אמין..."
                className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400 outline-none resize-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">טווח מחירים</label>
              <input
                value={priceRange}
                onChange={(e) => setPriceRange(e.target.value)}
                placeholder='למשל: 500-2,000 ₪ או "מהצעת מחיר"'
                className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400 outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">מה רצוי שהלקוח יעשה?</label>
              <div className="grid grid-cols-2 gap-2">
                {CTA_OPTIONS.map((opt) => (
                  <button
                    key={opt}
                    onClick={() => setCta(opt)}
                    className={`px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
                      cta === opt
                        ? "bg-indigo-600 text-white"
                        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                    }`}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setStep(1)}
                className="flex items-center gap-1 px-4 py-3 text-sm text-gray-600 hover:text-gray-800 transition-colors"
              >
                <ArrowRight size={16} />
                חזרה
              </button>
              <button
                onClick={() => setStep(3)}
                className="flex-1 flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl py-3 text-sm transition-colors"
              >
                <Sparkles size={16} />
                בנה את הדף עם AI
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: AI Building */}
        {step === 3 && (
          <div className="text-center py-16 space-y-8">
            <div className="text-6xl mb-4">
              {progressIdx === PROGRESS_MESSAGES.length - 1 ? "🎉" : "✨"}
            </div>
            <h2 className="text-2xl font-bold text-gray-900">
              {building ? "ה-AI בונה לך דף מושלם..." : buildError ? "משהו לא עבד" : "מוכן!"}
            </h2>

            {building && (
              <div className="max-w-sm mx-auto space-y-4">
                {PROGRESS_MESSAGES.map((msg, i) => (
                  <div
                    key={msg}
                    className={`flex items-center gap-3 transition-all duration-500 ${
                      i <= progressIdx ? "opacity-100" : "opacity-20"
                    }`}
                  >
                    {i < progressIdx ? (
                      <Check size={18} className="text-green-500 flex-shrink-0" />
                    ) : i === progressIdx ? (
                      <Loader2 size={18} className="text-indigo-500 animate-spin flex-shrink-0" />
                    ) : (
                      <div className="w-[18px] h-[18px] rounded-full border-2 border-gray-300 flex-shrink-0" />
                    )}
                    <span className={`text-sm ${i <= progressIdx ? "text-gray-700" : "text-gray-400"}`}>
                      {msg}
                    </span>
                  </div>
                ))}

                <div className="mt-6 h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-indigo-500 rounded-full transition-all duration-1000"
                    style={{ width: `${((progressIdx + 1) / PROGRESS_MESSAGES.length) * 100}%` }}
                  />
                </div>
              </div>
            )}

            {buildError && (
              <div className="space-y-4">
                <p className="text-red-500 text-sm">{buildError}</p>
                <button
                  onClick={() => {
                    setBuildError("");
                    buildPage();
                  }}
                  className="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl px-6 py-3 text-sm transition-colors"
                >
                  נסה שוב
                </button>
                <button
                  onClick={() => setStep(2)}
                  className="block mx-auto text-sm text-gray-500 hover:text-gray-700"
                >
                  ← חזרה לעריכה
                </button>
              </div>
            )}
          </div>
        )}

        {/* STEP 4: Preview & Edit */}
        {step === 4 && (
          <div className="space-y-6">
            <div className="text-center mb-4">
              <h2 className="text-2xl font-bold text-gray-900">👀 הנה הדף שלך!</h2>
              <p className="text-gray-500 mt-1">אהבת? אפשר לשנות כל דבר</p>
            </div>

            {/* Preview iframe */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="h-[350px] overflow-hidden relative bg-gray-100">
                <iframe
                  src={`${pageUrl}?t=${Date.now()}`}
                  className="border-none pointer-events-none"
                  style={{
                    width: "250%",
                    height: "250%",
                    transform: "scale(0.4)",
                    transformOrigin: "top right",
                  }}
                  title="תצוגה מקדימה"
                />
              </div>
            </div>

            {/* Quick edits */}
            <div className="bg-white rounded-2xl border border-gray-200 p-5 space-y-4">
              <h3 className="font-semibold text-gray-900 text-sm">עריכה מהירה</h3>

              <div>
                <label className="block text-xs text-gray-500 mb-1">🎨 צבע ראשי</label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={pageColor}
                    onChange={(e) => setPageColor(e.target.value)}
                    className="w-10 h-10 rounded-lg border border-gray-200 cursor-pointer"
                  />
                  <input
                    value={pageColor}
                    onChange={(e) => setPageColor(e.target.value)}
                    className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm font-mono"
                    dir="ltr"
                  />
                  <button
                    onClick={() => saveQuickEdit("landingPageColor", pageColor)}
                    disabled={saving}
                    className="bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg px-3 py-2 text-xs font-medium transition-colors disabled:opacity-50"
                  >
                    {saving ? "שומר..." : "שמור"}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs text-gray-500 mb-1">✏️ כותרת ראשית</label>
                <div className="flex items-center gap-3">
                  <input
                    value={pageTitle}
                    onChange={(e) => setPageTitle(e.target.value)}
                    className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm"
                  />
                  <button
                    onClick={() => saveQuickEdit("landingPageTitle", pageTitle)}
                    disabled={saving}
                    className="bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg px-3 py-2 text-xs font-medium transition-colors disabled:opacity-50"
                  >
                    {saving ? "שומר..." : "שמור"}
                  </button>
                </div>
              </div>

              <Link
                href={`/admin/clients/${client.id}/builder`}
                className="text-indigo-600 hover:text-indigo-700 text-sm font-medium"
              >
                רוצה שינויים גדולים? → פתח בונה מתקדם
              </Link>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setStep(5)}
                className="flex-1 flex items-center justify-center gap-2 bg-green-600 hover:bg-green-500 text-white font-bold rounded-xl py-3.5 text-sm transition-colors"
              >
                <Check size={16} />
                הדף מוכן! המשך
              </button>
            </div>
          </div>
        )}

        {/* STEP 5: Published! */}
        {step === 5 && (
          <div className="text-center py-8 space-y-8">
            <div className="text-7xl mb-2">🎉</div>
            <h2 className="text-3xl font-bold text-gray-900">הדף שלך חי!</h2>
            <p className="text-gray-500">שתף את הקישור והתחל לקבל לידים</p>

            {/* URL */}
            <div className="bg-white border border-gray-200 rounded-xl p-4 flex items-center gap-3 max-w-lg mx-auto">
              <p className="text-sm font-mono text-gray-600 flex-1 truncate text-left" dir="ltr">
                {pageUrl}
              </p>
              <button
                onClick={copyUrl}
                className="flex items-center gap-1 bg-indigo-600 text-white rounded-lg px-3 py-2 text-xs font-medium hover:bg-indigo-500 transition-colors"
              >
                {copied ? <Check size={14} /> : <Copy size={14} />}
                {copied ? "הועתק!" : "העתק"}
              </button>
            </div>

            {/* Share buttons */}
            <div className="flex items-center justify-center gap-3 flex-wrap">
              <a
                href={`https://wa.me/?text=${encodeURIComponent(`בואו לראות: ${pageUrl}`)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 bg-green-600 text-white rounded-xl px-5 py-2.5 text-sm font-medium hover:bg-green-500 transition-colors"
              >
                <Share2 size={14} />
                שתף בוואצאפ
              </a>
              <a
                href={pageUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 bg-gray-100 text-gray-700 rounded-xl px-5 py-2.5 text-sm font-medium hover:bg-gray-200 transition-colors"
              >
                <ExternalLink size={14} />
                צפה בדף
              </a>
            </div>

            {/* Stats teaser */}
            <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-4 max-w-sm mx-auto">
              <p className="text-indigo-700 text-sm font-medium">
                📊 0 לידים עד כה — שתף את הדף כדי להתחיל!
              </p>
            </div>

            {/* Actions */}
            <div className="flex flex-col gap-3 max-w-sm mx-auto">
              <Link
                href={`/admin/clients/${client.id}`}
                className="flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl py-3 text-sm transition-colors"
              >
                פתח לוח בקרה
              </Link>
              <Link
                href={`/admin/clients/${client.id}/builder`}
                className="text-center text-sm text-gray-500 hover:text-gray-700"
              >
                ערוך דף בבונה המתקדם →
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
