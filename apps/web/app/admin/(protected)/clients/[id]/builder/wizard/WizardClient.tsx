"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Loader2, Check, Copy, ExternalLink, Share2, Sparkles } from "lucide-react";

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

const TARGET_OPTIONS = [
  "בעלי בתים",
  "עסקים",
  "זוגות",
  "הורים לילדים",
  "סטודנטים",
  "בני 50+",
];

const PRICE_OPTIONS = [
  "עד ₪500",
  "₪500-2,000",
  "₪2,000-5,000",
  "מעל ₪5,000",
  "לפי הצעת מחיר",
];

const ACTION_OPTIONS = [
  { id: "call", label: "📞 אתקשר אליו" },
  { id: "whatsapp", label: "💬 אשלח וואצאפ" },
  { id: "meeting", label: "📅 יקבע פגישה" },
  { id: "email", label: "📧 יקבל מייל" },
];

const PROGRESS_MESSAGES = [
  "מנתח את העסק שלך...",
  "כותב כותרת מנצחת...",
  "בונה את הבלוקים...",
  "מוסיף המלצות...",
  "מעצב צבעים לפי ענף...",
  "הדף מוכן! 🎉",
];

export function WizardClient({ client, appUrl }: Props) {
  // Steps: 0=briefing, 1=building, 2=preview, 3=live
  const [step, setStep] = useState(0);

  // Briefing fields
  const [services, setServices] = useState("");
  const [targetAudience, setTargetAudience] = useState<string[]>([]);
  const [problemSolved, setProblemSolved] = useState("");
  const [priceRange, setPriceRange] = useState("");
  const [nextAction, setNextAction] = useState("call");
  const [testimonial, setTestimonial] = useState("");

  // Build state
  const [building, setBuilding] = useState(false);
  const [progressIdx, setProgressIdx] = useState(0);
  const [buildError, setBuildError] = useState("");

  // Preview state
  const [pageColor, setPageColor] = useState("#6366f1");
  const [pageTitle, setPageTitle] = useState("");
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);

  const pageUrl = `${appUrl}/${client.slug}`;

  function toggleTarget(opt: string) {
    setTargetAudience((prev) =>
      prev.includes(opt) ? prev.filter((x) => x !== opt) : [...prev, opt]
    );
  }

  // Build the page via AI
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
            businessName: client.name,
            industry: client.industry,
            services,
            targetAudience: targetAudience.join(", "),
            problemSolved,
            priceRange,
            nextAction,
            testimonial,
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

      setPageTitle(data.landingPageTitle ?? client.name);
      setPageColor(data.landingPageColor ?? "#6366f1");
      setProgressIdx(PROGRESS_MESSAGES.length - 1);

      setTimeout(() => {
        setBuilding(false);
        setStep(2);
      }, 1000);
    } catch {
      clearInterval(interval);
      setBuildError("שגיאת חיבור — נסה שוב");
      setBuilding(false);
    }
  }, [client.id, client.name, client.industry, services, targetAudience, problemSolved, priceRange, nextAction, testimonial]);

  useEffect(() => {
    if (step === 1 && !building && !buildError) {
      buildPage();
    }
  }, [step, building, buildError, buildPage]);

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

  const canBuild = services.trim().length > 0 && problemSolved.trim().length > 0;

  // Progress bar
  const stepLabels = ["שאלות", "AI בונה", "תצוגה", "מוכן!"];
  const activeStep = step === 0 ? 0 : step;

  return (
    <div className="min-h-screen bg-gray-50" dir="rtl">
      {/* Progress bar */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center justify-between mb-3">
            <h1 className="text-lg font-bold text-gray-900">🧙 אשף בניית דף נחיתה</h1>
            <span className="text-sm text-gray-400">שלב {activeStep + 1} מתוך {stepLabels.length}</span>
          </div>
          <div className="flex gap-2">
            {stepLabels.map((label, i) => (
              <div key={label} className="flex-1">
                <div className={`h-1.5 rounded-full transition-all ${i <= activeStep ? "bg-indigo-500" : "bg-gray-200"}`} />
                <p className={`text-[10px] mt-1 text-center ${i === activeStep ? "text-indigo-600 font-medium" : "text-gray-400"}`}>
                  {label}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-6 py-8">

        {/* ─── STEP 0: BRIEFING ─── */}
        {step === 0 && (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <div className="text-5xl mb-3">👋</div>
              <h2 className="text-2xl font-bold text-gray-900">נכיר אותך לפני שנבנה את הדף</h2>
              <p className="text-gray-500 mt-1 text-sm">6 שאלות קצרות ← AI בונה דף מקצועי מושלם</p>
            </div>

            {/* Q1: Services */}
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">1. מה אתה מוכר או נותן? *</label>
              <textarea
                value={services}
                onChange={(e) => setServices(e.target.value)}
                rows={3}
                placeholder="למשל: שירותי ניקיון לבתים ומשרדים באזור המרכז, כולל ניקוי ספות וחלונות"
                className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400 outline-none resize-none"
              />
            </div>

            {/* Q2: Target audience */}
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">2. מי הלקוח שלך? (בחר כמה שמתאים)</label>
              <div className="flex flex-wrap gap-2">
                {TARGET_OPTIONS.map((opt) => (
                  <button
                    key={opt}
                    onClick={() => toggleTarget(opt)}
                    className={`px-4 py-2 rounded-full text-sm font-medium border-2 transition-all ${
                      targetAudience.includes(opt)
                        ? "border-indigo-500 bg-indigo-50 text-indigo-700"
                        : "border-gray-200 bg-white text-gray-600 hover:border-gray-300"
                    }`}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </div>

            {/* Q3: Problem */}
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">3. איזו בעיה אתה פותר? *</label>
              <textarea
                value={problemSolved}
                onChange={(e) => setProblemSolved(e.target.value)}
                rows={2}
                placeholder="למשל: חיסכון בזמן, נקיון יסודי שאחרים לא עושים, מחירים שקופים..."
                className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400 outline-none resize-none"
              />
            </div>

            {/* Q4: Price */}
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">4. כמה עולה השירות שלך?</label>
              <div className="flex flex-wrap gap-2">
                {PRICE_OPTIONS.map((opt) => (
                  <button
                    key={opt}
                    onClick={() => setPriceRange(opt)}
                    className={`px-4 py-2 rounded-full text-sm font-medium border-2 transition-all ${
                      priceRange === opt
                        ? "border-indigo-500 bg-indigo-50 text-indigo-700"
                        : "border-gray-200 bg-white text-gray-600 hover:border-gray-300"
                    }`}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </div>

            {/* Q5: Next action */}
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">5. מה קורה אחרי שלקוח משאיר פרטים?</label>
              <div className="flex flex-wrap gap-2">
                {ACTION_OPTIONS.map((opt) => (
                  <button
                    key={opt.id}
                    onClick={() => setNextAction(opt.id)}
                    className={`px-4 py-2 rounded-full text-sm font-medium border-2 transition-all ${
                      nextAction === opt.id
                        ? "border-indigo-500 bg-indigo-50 text-indigo-700"
                        : "border-gray-200 bg-white text-gray-600 hover:border-gray-300"
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Q6: Testimonial (optional) */}
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">6. יש לך המלצה מלקוח? (לא חובה)</label>
              <textarea
                value={testimonial}
                onChange={(e) => setTestimonial(e.target.value)}
                rows={2}
                placeholder={`"השירות היה מדהים, מומלץ בחום!" — דוד כהן, תל אביב`}
                className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400 outline-none resize-none opacity-80 focus:opacity-100"
              />
            </div>

            {/* Build button */}
            <button
              onClick={() => setStep(1)}
              disabled={!canBuild}
              className="w-full flex items-center justify-center gap-2 py-4 rounded-xl text-base font-bold transition-all disabled:opacity-40 bg-gradient-to-l from-indigo-600 to-purple-600 text-white shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/30"
            >
              <Sparkles size={18} />
              בנה לי דף מקצועי!
            </button>
          </div>
        )}

        {/* ─── STEP 1: AI BUILDING ─── */}
        {step === 1 && (
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
                    className={`flex items-center gap-3 transition-all duration-500 ${i <= progressIdx ? "opacity-100" : "opacity-20"}`}
                  >
                    {i < progressIdx ? (
                      <Check size={18} className="text-green-500 flex-shrink-0" />
                    ) : i === progressIdx ? (
                      <Loader2 size={18} className="text-indigo-500 animate-spin flex-shrink-0" />
                    ) : (
                      <div className="w-[18px] h-[18px] rounded-full border-2 border-gray-300 flex-shrink-0" />
                    )}
                    <span className={`text-sm ${i <= progressIdx ? "text-gray-700" : "text-gray-400"}`}>{msg}</span>
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
                  onClick={() => { setBuildError(""); buildPage(); }}
                  className="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl px-6 py-3 text-sm transition-colors"
                >
                  נסה שוב
                </button>
                <button onClick={() => setStep(0)} className="block mx-auto text-sm text-gray-500 hover:text-gray-700">
                  ← חזרה לשאלות
                </button>
              </div>
            )}
          </div>
        )}

        {/* ─── STEP 2: PREVIEW + EDIT ─── */}
        {step === 2 && (
          <div className="space-y-6">
            <div className="text-center mb-4">
              <h2 className="text-2xl font-bold text-gray-900">👀 הנה הדף שלך!</h2>
              <p className="text-gray-500 mt-1">אהבת? אפשר לשנות כל דבר</p>
            </div>

            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="h-[350px] overflow-hidden relative bg-gray-100">
                <iframe
                  src={`${pageUrl}?t=${Date.now()}`}
                  className="border-none pointer-events-none"
                  style={{ width: "250%", height: "250%", transform: "scale(0.4)", transformOrigin: "top right" }}
                  title="תצוגה מקדימה"
                />
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-gray-200 p-5 space-y-4">
              <h3 className="font-semibold text-gray-900 text-sm">עריכה מהירה</h3>
              <div>
                <label className="block text-xs text-gray-500 mb-1">🎨 צבע ראשי</label>
                <div className="flex items-center gap-3">
                  <input type="color" value={pageColor} onChange={(e) => setPageColor(e.target.value)} className="w-10 h-10 rounded-lg border border-gray-200 cursor-pointer" />
                  <input value={pageColor} onChange={(e) => setPageColor(e.target.value)} className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm font-mono" dir="ltr" />
                  <button onClick={() => saveQuickEdit("landingPageColor", pageColor)} disabled={saving} className="bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg px-3 py-2 text-xs font-medium transition-colors disabled:opacity-50">
                    {saving ? "..." : "שמור"}
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">✏️ כותרת ראשית</label>
                <div className="flex items-center gap-3">
                  <input value={pageTitle} onChange={(e) => setPageTitle(e.target.value)} className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm" />
                  <button onClick={() => saveQuickEdit("landingPageTitle", pageTitle)} disabled={saving} className="bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg px-3 py-2 text-xs font-medium transition-colors disabled:opacity-50">
                    {saving ? "..." : "שמור"}
                  </button>
                </div>
              </div>
              <Link href={`/admin/clients/${client.id}/builder`} className="text-indigo-600 hover:text-indigo-700 text-sm font-medium">
                רוצה שינויים גדולים? → פתח בונה מתקדם
              </Link>
            </div>

            <button
              onClick={() => setStep(3)}
              className="w-full flex items-center justify-center gap-2 bg-green-600 hover:bg-green-500 text-white font-bold rounded-xl py-3.5 text-sm transition-colors"
            >
              <Check size={16} />
              זה מושלם! המשך
            </button>
          </div>
        )}

        {/* ─── STEP 3: LIVE! ─── */}
        {step === 3 && (
          <div className="text-center py-8 space-y-8">
            <div className="text-7xl mb-2">🎉</div>
            <h2 className="text-3xl font-bold text-gray-900">הדף שלך חי!</h2>
            <p className="text-gray-500">שתף את הקישור והתחל לקבל לידים</p>

            <div className="bg-white border border-gray-200 rounded-xl p-4 flex items-center gap-3 max-w-lg mx-auto">
              <p className="text-sm font-mono text-gray-600 flex-1 truncate text-left" dir="ltr">{pageUrl}</p>
              <button onClick={copyUrl} className="flex items-center gap-1 bg-indigo-600 text-white rounded-lg px-3 py-2 text-xs font-medium hover:bg-indigo-500 transition-colors">
                {copied ? <Check size={14} /> : <Copy size={14} />}
                {copied ? "הועתק!" : "העתק"}
              </button>
            </div>

            <div className="flex items-center justify-center gap-3 flex-wrap">
              <a href={`https://wa.me/?text=${encodeURIComponent(`בואו לראות: ${pageUrl}`)}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 bg-green-600 text-white rounded-xl px-5 py-2.5 text-sm font-medium hover:bg-green-500 transition-colors">
                <Share2 size={14} />
                שתף בוואצאפ
              </a>
              <a href={pageUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 bg-gray-100 text-gray-700 rounded-xl px-5 py-2.5 text-sm font-medium hover:bg-gray-200 transition-colors">
                <ExternalLink size={14} />
                צפה בדף
              </a>
            </div>

            <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-4 max-w-sm mx-auto">
              <p className="text-indigo-700 text-sm font-medium">📊 0 לידים עד כה — שתף את הדף כדי להתחיל!</p>
            </div>

            <div className="flex flex-col gap-3 max-w-sm mx-auto">
              <Link href={`/admin/clients/${client.id}`} className="flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl py-3 text-sm transition-colors">
                פתח לוח בקרה
              </Link>
              <Link href={`/admin/clients/${client.id}/builder`} className="text-center text-sm text-gray-500 hover:text-gray-700">
                ערוך דף בבונה המתקדם →
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
