"use client";

import { useState, useEffect, useRef } from "react";
import {
  Sparkles,
  Wand2,
  Loader2,
  CheckCircle2,
  ExternalLink,
  Pencil,
  RefreshCw,
} from "lucide-react";
import toast from "react-hot-toast";

type Client = { id: string; name: string };

type BuildResult = {
  ok: boolean;
  slug: string;
  previewUrl: string;
  landingPageTitle?: string;
  landingPageSubtitle?: string;
  landingPageCta?: string;
  landingPageColor?: string;
  seoTitle?: string;
  seoDescription?: string;
  blocksCount?: number;
  clientId: string;
};

const EXAMPLE_PROMPTS = [
  "קבלן גגות באזור המרכז, מתמחה בגגות רעפים ופח, 15 שנות ניסיון",
  "קליניקת יופי וקוסמטיקה בתל אביב, טיפולי פנים וגוף מתקדמים",
  "חברת ניקיון לבתים ומשרדים, צוות אמין, מחירים תחרותיים",
];

const LOADING_STEPS = [
  "מנתח את העסק",
  "בונה דף",
  "מתאים עיצוב",
];

export default function AiAgentPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [clientId, setClientId] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);
  const [dots, setDots] = useState(".");
  const [result, setResult] = useState<BuildResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const stepTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const dotsTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Fetch clients on mount
  useEffect(() => {
    fetch("/api/clients?limit=100")
      .then((r) => r.json())
      .then((d) => {
        const list: Client[] = d.clients ?? [];
        setClients(list);
        if (list[0]) setClientId(list[0].id);
      })
      .catch(() => {});
  }, []);

  // Animate loading steps
  useEffect(() => {
    if (!loading) {
      if (stepTimerRef.current) clearTimeout(stepTimerRef.current);
      if (dotsTimerRef.current) clearInterval(dotsTimerRef.current);
      setLoadingStep(0);
      setDots(".");
      return;
    }

    setLoadingStep(0);
    setDots(".");

    // Advance step every 1.5s
    let step = 0;
    const advance = () => {
      step = step + 1;
      if (step < LOADING_STEPS.length) {
        setLoadingStep(step);
        stepTimerRef.current = setTimeout(advance, 1500);
      }
    };
    stepTimerRef.current = setTimeout(advance, 1500);

    // Animate dots
    dotsTimerRef.current = setInterval(() => {
      setDots((prev) => (prev.length >= 3 ? "." : prev + "."));
    }, 400);

    return () => {
      if (stepTimerRef.current) clearTimeout(stepTimerRef.current);
      if (dotsTimerRef.current) clearInterval(dotsTimerRef.current);
    };
  }, [loading]);

  async function handleBuild() {
    if (!clientId) { toast.error("בחר לקוח"); return; }
    if (!description.trim()) { toast.error("הכנס תיאור עסק"); return; }

    setError(null);
    setResult(null);
    setLoading(true);

    try {
      const res = await fetch("/api/ai/build-page", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ description, clientId }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "שגיאה לא ידועה");
        toast.error(data.error ?? "שגיאה ביצירת הדף");
        return;
      }

      setResult({ ...data, clientId });
      toast.success("הדף נבנה בהצלחה! 🎉");
    } catch {
      setError("שגיאת רשת, נסה שוב");
      toast.error("שגיאת רשת");
    } finally {
      setLoading(false);
    }
  }

  function handleReset() {
    setResult(null);
    setError(null);
    setDescription("");
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6 py-2" dir="rtl">
      {/* Header */}
      <div className="flex items-start gap-3">
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Wand2 size={24} className="text-indigo-500" />
            בנה את דף הנחיתה שלך ✨
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            ספר לי על העסק שלך ואני אבנה לך דף מקצועי בשניות
          </p>
        </div>
      </div>

      {/* Success result */}
      {result ? (
        <div className="space-y-5">
          {/* Success banner */}
          <div className="bg-green-50 border border-green-200 rounded-2xl p-4 flex items-center gap-3">
            <CheckCircle2 size={22} className="text-green-500 flex-shrink-0" />
            <div>
              <p className="font-semibold text-green-800">הדף נבנה בהצלחה! 🎉</p>
              {result.blocksCount && (
                <p className="text-xs text-green-600 mt-0.5">
                  {result.blocksCount} בלוקים נוצרו ופורסמו
                </p>
              )}
            </div>
          </div>

          {/* Page details */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 space-y-3">
            {result.landingPageTitle && (
              <div>
                <p className="text-xs font-medium text-gray-400 mb-0.5">כותרת ראשית</p>
                <p className="font-bold text-gray-900 text-lg leading-snug">{result.landingPageTitle}</p>
              </div>
            )}
            {result.landingPageSubtitle && (
              <div>
                <p className="text-xs font-medium text-gray-400 mb-0.5">כותרת משנה</p>
                <p className="text-gray-600 text-sm">{result.landingPageSubtitle}</p>
              </div>
            )}
            {result.landingPageCta && (
              <div>
                <p className="text-xs font-medium text-gray-400 mb-0.5">כפתור קריאה לפעולה</p>
                <span
                  className="inline-block text-sm font-semibold text-white px-4 py-2 rounded-lg"
                  style={{ backgroundColor: result.landingPageColor ?? "#6366f1" }}
                >
                  {result.landingPageCta}
                </span>
              </div>
            )}
          </div>

          {/* Mini preview */}
          <div className="flex flex-col items-center gap-2">
            <p className="text-xs font-medium text-gray-500 self-start">תצוגה מקדימה</p>
            <div
              className="bg-white rounded-xl border border-gray-200 shadow-xl overflow-hidden mx-auto"
              style={{ width: 390, height: 600 }}
            >
              <div className="w-full h-full relative overflow-hidden">
                <iframe
                  src={result.previewUrl}
                  title="תצוגה מקדימה של הדף"
                  style={{
                    width: `${100 / 0.55}%`,
                    height: `${100 / 0.55}%`,
                    transform: "scale(0.55)",
                    transformOrigin: "top right",
                    pointerEvents: "none",
                    border: "none",
                  }}
                />
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="grid grid-cols-3 gap-3">
            <a
              href={result.previewUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 bg-white border border-gray-200 hover:border-indigo-300 text-gray-700 hover:text-indigo-700 font-medium py-2.5 px-3 rounded-xl transition text-sm shadow-sm"
            >
              <ExternalLink size={15} />
              צפה בדף
            </a>
            <a
              href={`/admin/clients/${result.clientId}/builder`}
              className="flex items-center justify-center gap-2 bg-indigo-50 border border-indigo-200 hover:bg-indigo-100 text-indigo-700 font-medium py-2.5 px-3 rounded-xl transition text-sm shadow-sm"
            >
              <Pencil size={15} />
              ערוך בbuilder
            </a>
            <button
              onClick={handleReset}
              className="flex items-center justify-center gap-2 bg-white border border-gray-200 hover:border-gray-300 text-gray-600 hover:text-gray-800 font-medium py-2.5 px-3 rounded-xl transition text-sm shadow-sm"
            >
              <RefreshCw size={15} />
              בנה שוב
            </button>
          </div>
        </div>
      ) : (
        <>
          {/* Main form card */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 space-y-5">
            {/* Client selector */}
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1.5">
                בחר לקוח
              </label>
              <select
                value={clientId}
                onChange={(e) => setClientId(e.target.value)}
                disabled={loading}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-white focus:ring-2 focus:ring-indigo-300 outline-none disabled:opacity-60 transition"
              >
                <option value="">בחר לקוח...</option>
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Description textarea */}
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1.5">
                תאר את העסק
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={5}
                disabled={loading}
                placeholder="לדוגמה: אני מוכר גגות בתל אביב, קהל יעד בעלי בתים, מחיר ממוצע 5,000 ₪. יש לי 10 שנות ניסיון..."
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-indigo-300 outline-none resize-none disabled:opacity-60 transition leading-relaxed"
              />
              <p className="text-xs text-gray-400 mt-1">
                ככל שהתיאור מפורט יותר, כך הדף יהיה ממוקד יותר
              </p>
            </div>

            {/* Loading steps */}
            {loading && (
              <div className="bg-indigo-50 rounded-xl p-4 space-y-2">
                {LOADING_STEPS.map((step, i) => (
                  <div
                    key={i}
                    className={`flex items-center gap-2 text-sm transition-all ${
                      i < loadingStep
                        ? "text-green-600 font-medium"
                        : i === loadingStep
                        ? "text-indigo-700 font-semibold"
                        : "text-gray-400"
                    }`}
                  >
                    {i < loadingStep ? (
                      <CheckCircle2 size={15} className="text-green-500 flex-shrink-0" />
                    ) : i === loadingStep ? (
                      <Loader2 size={15} className="animate-spin text-indigo-500 flex-shrink-0" />
                    ) : (
                      <span className="w-[15px] h-[15px] rounded-full border-2 border-gray-300 flex-shrink-0" />
                    )}
                    {i === loadingStep ? `${step}${dots}` : step}
                  </div>
                ))}
              </div>
            )}

            {/* Error */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            )}

            {/* Build button */}
            <button
              onClick={handleBuild}
              disabled={loading || !clientId || !description.trim()}
              className="w-full flex items-center justify-center gap-2 bg-gradient-to-l from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-xl transition shadow-sm"
            >
              {loading ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  בונה את הדף...
                </>
              ) : (
                <>
                  <Sparkles size={18} />
                  בנה עכשיו ✨
                </>
              )}
            </button>
          </div>

          {/* Example prompts */}
          <div className="space-y-3">
            <p className="text-sm font-medium text-gray-600">דוגמאות לתיאור עסק</p>
            <div className="flex flex-wrap gap-2">
              {EXAMPLE_PROMPTS.map((prompt, i) => (
                <button
                  key={i}
                  onClick={() => setDescription(prompt)}
                  disabled={loading}
                  className="text-xs bg-white border border-gray-200 hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-700 text-gray-600 px-3 py-2 rounded-xl transition disabled:opacity-50 text-right leading-relaxed"
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
