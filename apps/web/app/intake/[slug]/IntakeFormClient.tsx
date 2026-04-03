"use client";

import { useState } from "react";

interface Props {
  clientSlug: string;
  clientName: string;
  primaryColor: string;
}

// ─── Hebrew options ───────────────────────────────────────────────────────────

const BUSINESS_TYPES = [
  "קמעונאות",
  "שירותים",
  "מסעדנות / מזון",
  "בריאות ורפואה",
  'נדל"ן',
  "טכנולוגיה",
  "חינוך",
  'עמותה / מלכ"ר',
  "אחר",
];

const MAIN_GOALS = [
  "יצירת לידים חדשים",
  "הגדלת מכירות",
  "חיזוק המותג",
  "גיוס עוקבים ברשתות",
  "השקת מוצר / שירות חדש",
  "אחר",
];

const BUDGET_RANGES = [
  "עד ₪2,000",
  "₪2,000 – ₪5,000",
  "₪5,000 – ₪10,000",
  "₪10,000 – ₪20,000",
  "₪20,000+",
  "עדיין לא יודע/ת",
];

const MARKETING_CHANNELS = [
  "SEO / קידום אורגני",
  "פרסום ממומן בגוגל",
  "פייסבוק / אינסטגרם",
  "טיקטוק",
  "וואטסאפ",
  "אימייל מרקטינג",
  "הפניות / פה לאוזן",
  "לא משתמשים כרגע",
];

const PREFERRED_CONTACTS = ["וואטסאפ", "שיחת טלפון", "אימייל"];

const STEPS = ["פרטי קשר", "פרטי העסק", "שיווק ומטרות", "סיום ושליחה"];

// ─── Form state type ──────────────────────────────────────────────────────────

type FormData = {
  fullName: string;
  phone: string;
  email: string;
  businessName: string;
  preferredContact: string;
  businessType: string;
  operatingAreas: string;
  targetAudience: string;
  description: string;
  uniqueSellingPoint: string;
  mainGoal: string;
  marketingChannels: string;
  painPoints: string;
  budgetRange: string;
  notes: string;
};

const EMPTY: FormData = {
  fullName: "", phone: "", email: "", businessName: "", preferredContact: "",
  businessType: "", operatingAreas: "", targetAudience: "", description: "", uniqueSellingPoint: "",
  mainGoal: "", marketingChannels: "", painPoints: "", budgetRange: "", notes: "",
};

type FieldErrors = Partial<Record<keyof FormData, string>>;

// ─── Shared input styles ──────────────────────────────────────────────────────

const BASE = [
  "block w-full rounded-xl border px-4 py-3 text-sm bg-white",
  "focus:outline-none focus:ring-2 focus:ring-offset-0 transition-all",
  "placeholder:text-gray-400 shadow-sm",
].join(" ");

const NORMAL = "border-gray-200 focus:border-blue-400 focus:ring-blue-400/20";
const ERROR  = "border-red-300 focus:border-red-400 focus:ring-red-400/20";

// ─── Small helper components ──────────────────────────────────────────────────

function Label({
  text, required, hint, error,
}: {
  text: string; required?: boolean; hint?: string; error?: string;
}) {
  return (
    <div className="flex flex-col gap-0.5 mb-1.5">
      <span className="text-sm font-semibold text-gray-700">
        {text}
        {required && <span className="text-red-500 font-normal mr-1"> *</span>}
      </span>
      {hint && <span className="text-xs text-gray-400">{hint}</span>}
      {error && <span className="text-xs text-red-600">{error}</span>}
    </div>
  );
}

function SummaryRow({ label, value }: { label: string; value: string | null | undefined }) {
  if (!value) return null;
  return (
    <div className="flex justify-between items-start gap-4 py-2 border-b border-gray-100 last:border-0 text-sm">
      <span className="text-gray-500 flex-shrink-0">{label}</span>
      <span className="text-gray-900 font-medium text-left break-words max-w-[60%]">{value}</span>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function IntakeFormClient({ clientSlug, clientName, primaryColor }: Props) {
  const [step, setStep]             = useState(0);
  const [form, setForm]             = useState<FormData>(EMPTY);
  const [agreed, setAgreed]         = useState(false);
  const [errors, setErrors]         = useState<FieldErrors>({});
  const [serverError, setServerError] = useState("");
  const [loading, setLoading]       = useState(false);
  const [submitted, setSubmitted]   = useState(false);

  function field<K extends keyof FormData>(key: K, val: string) {
    setForm((p) => ({ ...p, [key]: val }));
    if (errors[key]) setErrors((p) => ({ ...p, [key]: undefined }));
  }

  function toggleChannel(ch: string) {
    const cur = form.marketingChannels
      ? form.marketingChannels.split(",").map((s) => s.trim()).filter(Boolean)
      : [];
    const next = cur.includes(ch) ? cur.filter((s) => s !== ch) : [...cur, ch];
    field("marketingChannels", next.join(", "));
  }

  function validate(): boolean {
    if (step !== 0) return true;
    const e: FieldErrors = {};
    if (!form.fullName.trim())     e.fullName     = "שם מלא הוא שדה חובה";
    if (!form.businessName.trim()) e.businessName = "שם העסק הוא שדה חובה";
    if (!form.email.trim())        e.email        = "אימייל הוא שדה חובה";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
      e.email = "כתובת אימייל לא תקינה";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function next() { if (validate()) setStep((s) => s + 1); }
  function back() { setStep((s) => s - 1); setErrors({}); setServerError(""); }

  async function submit() {
    if (!agreed) {
      setServerError("יש לסמן את תיבת ההסכמה לפני השליחה.");
      return;
    }
    setServerError("");
    setLoading(true);
    try {
      const res = await fetch(`/api/intake/${clientSlug}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        setSubmitted(true);
      } else {
        const data = await res.json().catch(() => ({}));
        setServerError(
          data.error?.fieldErrors ? "יש למלא את כל שדות החובה." : "אירעה שגיאה. אנא נסה שוב."
        );
      }
    } catch {
      setServerError("אירעה שגיאת רשת. אנא בדוק את החיבור ונסה שוב.");
    } finally {
      setLoading(false);
    }
  }

  const channels = form.marketingChannels
    ? form.marketingChannels.split(",").map((s) => s.trim()).filter(Boolean)
    : [];

  // ── Success ──────────────────────────────────────────────────────────────

  if (submitted) {
    return (
      <div dir="rtl" className="min-h-screen bg-gradient-to-br from-gray-50 to-white flex items-center justify-center p-6">
        <div className="text-center max-w-sm px-4">
          <div
            className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 text-white text-3xl shadow-lg"
            style={{ backgroundColor: primaryColor }}
          >
            ✓
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-3">תודה רבה!</h1>
          <p className="text-gray-500 leading-relaxed">
            הטופס נשלח בהצלחה.
            <br />
            צוות <strong className="text-gray-800">{clientName}</strong> יצור איתך קשר בהקדם.
          </p>
        </div>
      </div>
    );
  }

  // ── Page ─────────────────────────────────────────────────────────────────

  return (
    <div dir="rtl" className="min-h-screen bg-gray-50">

      {/* ───── Branded hero ────────────────────────────────────────────── */}
      <div
        className="relative overflow-hidden"
        style={{ backgroundColor: primaryColor }}
      >
        {/* subtle decorative circles */}
        <div className="absolute -top-16 -left-16 w-56 h-56 rounded-full bg-white/10 pointer-events-none" />
        <div className="absolute top-4 left-32 w-24 h-24 rounded-full bg-white/10 pointer-events-none" />
        <div className="absolute -bottom-12 right-6 w-40 h-40 rounded-full bg-white/10 pointer-events-none" />

        <div className="relative max-w-xl mx-auto px-6 py-14 text-center text-white">
          <div className="w-16 h-16 rounded-full bg-white/20 border-2 border-white/40 flex items-center justify-center mx-auto mb-5 text-2xl font-bold">
            {clientName[0]}
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold mb-2">{clientName}</h1>
          <p className="text-white/80 text-sm sm:text-base">
            ברוכים הבאים — נשמח לשמוע עליכם ולהתחיל לעבוד יחד
          </p>
        </div>
      </div>

      {/* ───── Step bar ────────────────────────────────────────────────── */}
      <div className="bg-white border-b border-gray-100 shadow-sm sticky top-0 z-20">
        <div className="max-w-xl mx-auto px-6 py-4">
          <div className="flex items-center gap-0">
            {STEPS.map((label, i) => (
              <div key={i} className="flex items-center flex-1">
                {/* Circle */}
                <div className="flex flex-col items-center gap-1 flex-shrink-0">
                  <div
                    className={[
                      "w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-all duration-300",
                      i < step
                        ? "text-white border-transparent"
                        : i === step
                        ? "text-white border-transparent shadow-sm"
                        : "bg-white text-gray-300 border-gray-200",
                    ].join(" ")}
                    style={i <= step ? { backgroundColor: primaryColor, borderColor: primaryColor } : {}}
                  >
                    {i < step ? "✓" : i + 1}
                  </div>
                  <span
                    className={[
                      "text-xs whitespace-nowrap hidden sm:block leading-none",
                      i === step ? "font-semibold text-gray-800" : "text-gray-400",
                    ].join(" ")}
                  >
                    {label}
                  </span>
                </div>
                {/* Connecting line */}
                {i < STEPS.length - 1 && (
                  <div className="flex-1 h-0.5 mx-2 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{ width: i < step ? "100%" : "0%", backgroundColor: primaryColor }}
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
          <p className="text-xs text-gray-400 mt-2">שלב {step + 1} מתוך {STEPS.length}</p>
        </div>
      </div>

      {/* ───── Form card ───────────────────────────────────────────────── */}
      <div className="max-w-xl mx-auto px-4 py-8 pb-20">
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">

          {/* Card title */}
          <div className="px-6 pt-7 pb-2 border-b border-gray-50">
            <h2 className="text-lg font-bold text-gray-900">{STEPS[step]}</h2>
          </div>

          <div className="px-6 py-6 space-y-6">

            {/* ╔══════════════════════════════════╗
                ║  שלב 1 — פרטי קשר               ║
                ╚══════════════════════════════════╝ */}
            {step === 0 && (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label text="שם מלא" required error={errors.fullName} />
                    <input
                      value={form.fullName}
                      onChange={(e) => field("fullName", e.target.value)}
                      placeholder="ישראל ישראלי"
                      className={`${BASE} ${errors.fullName ? ERROR : NORMAL}`}
                    />
                  </div>
                  <div>
                    <Label text="שם העסק" required error={errors.businessName} />
                    <input
                      value={form.businessName}
                      onChange={(e) => field("businessName", e.target.value)}
                      placeholder="שם החברה / העסק"
                      className={`${BASE} ${errors.businessName ? ERROR : NORMAL}`}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label text="אימייל" required error={errors.email} />
                    <input
                      type="email"
                      dir="ltr"
                      value={form.email}
                      onChange={(e) => field("email", e.target.value)}
                      placeholder="you@example.com"
                      className={`${BASE} text-left ${errors.email ? ERROR : NORMAL}`}
                    />
                  </div>
                  <div>
                    <Label text="טלפון" />
                    <input
                      type="tel"
                      dir="ltr"
                      value={form.phone}
                      onChange={(e) => field("phone", e.target.value)}
                      placeholder="050-0000000"
                      className={`${BASE} text-left ${NORMAL}`}
                    />
                  </div>
                </div>

                <div>
                  <Label text="דרך יצירת קשר מועדפת" />
                  <div className="flex flex-wrap gap-2 mt-1">
                    {PREFERRED_CONTACTS.map((c) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => field("preferredContact", c)}
                        className={[
                          "px-4 py-2 rounded-full text-sm font-medium border transition-all",
                          form.preferredContact === c
                            ? "text-white border-transparent shadow-sm"
                            : "text-gray-600 border-gray-200 bg-white hover:border-gray-400",
                        ].join(" ")}
                        style={form.preferredContact === c ? { backgroundColor: primaryColor, borderColor: primaryColor } : {}}
                      >
                        {c}
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}

            {/* ╔══════════════════════════════════╗
                ║  שלב 2 — פרטי העסק              ║
                ╚══════════════════════════════════╝ */}
            {step === 1 && (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label text="תחום העסק" />
                    <select
                      value={form.businessType}
                      onChange={(e) => field("businessType", e.target.value)}
                      className={`${BASE} ${NORMAL}`}
                    >
                      <option value="">בחר תחום...</option>
                      {BUSINESS_TYPES.map((t) => (
                        <option key={t} value={t}>{t}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <Label text="אזורי פעילות" />
                    <input
                      value={form.operatingAreas}
                      onChange={(e) => field("operatingAreas", e.target.value)}
                      placeholder="תל אביב, כל הארץ, אונליין..."
                      className={`${BASE} ${NORMAL}`}
                    />
                  </div>
                </div>

                <div>
                  <Label text="קהל היעד" hint="מי הלקוח האידיאלי שלך?" />
                  <textarea
                    rows={3}
                    value={form.targetAudience}
                    onChange={(e) => field("targetAudience", e.target.value)}
                    placeholder="גיל, מגזר, אזור גיאוגרפי, תחומי עניין..."
                    className={`${BASE} ${NORMAL} resize-none`}
                  />
                </div>

                <div>
                  <Label text="השירות / המוצר המרכזי" />
                  <textarea
                    rows={3}
                    value={form.description}
                    onChange={(e) => field("description", e.target.value)}
                    placeholder="תאר את השירות או המוצר הראשי שאתם מציעים..."
                    className={`${BASE} ${NORMAL} resize-none`}
                  />
                </div>

                <div>
                  <Label text="מה מבדל אתכם מהמתחרים?" />
                  <textarea
                    rows={3}
                    value={form.uniqueSellingPoint}
                    onChange={(e) => field("uniqueSellingPoint", e.target.value)}
                    placeholder="הדבר שגורם ללקוחות לבחור דווקא בכם..."
                    className={`${BASE} ${NORMAL} resize-none`}
                  />
                </div>
              </>
            )}

            {/* ╔══════════════════════════════════╗
                ║  שלב 3 — שיווק ומטרות           ║
                ╚══════════════════════════════════╝ */}
            {step === 2 && (
              <>
                <div>
                  <Label text="מה המטרה העיקרית שלכם כרגע?" />
                  <div className="grid grid-cols-2 gap-2 mt-1">
                    {MAIN_GOALS.map((g) => (
                      <button
                        key={g}
                        type="button"
                        onClick={() => field("mainGoal", g)}
                        className={[
                          "px-3 py-3 rounded-xl text-sm font-medium border text-right transition-all",
                          form.mainGoal === g
                            ? "text-white border-transparent shadow-sm"
                            : "text-gray-700 border-gray-200 bg-white hover:border-gray-300",
                        ].join(" ")}
                        style={form.mainGoal === g ? { backgroundColor: primaryColor, borderColor: primaryColor } : {}}
                      >
                        {g}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <Label text="באילו ערוצי שיווק אתם משתמשים כיום?" hint="בחרו את כל מה שרלוונטי" />
                  <div className="grid grid-cols-2 gap-2 mt-1">
                    {MARKETING_CHANNELS.map((c) => {
                      const on = channels.includes(c);
                      return (
                        <button
                          key={c}
                          type="button"
                          onClick={() => toggleChannel(c)}
                          className={[
                            "px-3 py-3 rounded-xl text-sm font-medium border text-right flex items-center gap-2 transition-all",
                            on
                              ? "text-white border-transparent shadow-sm"
                              : "text-gray-700 border-gray-200 bg-white hover:border-gray-300",
                          ].join(" ")}
                          style={on ? { backgroundColor: primaryColor, borderColor: primaryColor } : {}}
                        >
                          <span
                            className={[
                              "w-4 h-4 rounded border-2 flex-shrink-0 flex items-center justify-center text-xs font-bold",
                              on ? "bg-white/30 border-white/60 text-white" : "border-gray-300",
                            ].join(" ")}
                          >
                            {on && "✓"}
                          </span>
                          {c}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <Label text="מה הכאב / האתגר המרכזי שלכם כרגע?" />
                  <textarea
                    rows={3}
                    value={form.painPoints}
                    onChange={(e) => field("painPoints", e.target.value)}
                    placeholder="מה הבעיה הכי גדולה שאתם רוצים לפתור..."
                    className={`${BASE} ${NORMAL} resize-none`}
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label text="תקציב שיווק משוער" hint="אופציונלי" />
                    <select
                      value={form.budgetRange}
                      onChange={(e) => field("budgetRange", e.target.value)}
                      className={`${BASE} ${NORMAL}`}
                    >
                      <option value="">בחר טווח...</option>
                      {BUDGET_RANGES.map((b) => (
                        <option key={b} value={b}>{b}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <Label text="הערות נוספות" hint="אופציונלי" />
                  <textarea
                    rows={3}
                    value={form.notes}
                    onChange={(e) => field("notes", e.target.value)}
                    placeholder="כל מידע נוסף שחשוב לך לשתף איתנו..."
                    className={`${BASE} ${NORMAL} resize-none`}
                  />
                </div>
              </>
            )}

            {/* ╔══════════════════════════════════╗
                ║  שלב 4 — סיום ושליחה            ║
                ╚══════════════════════════════════╝ */}
            {step === 3 && (
              <>
                {/* Summary */}
                <div>
                  <p className="text-sm font-bold text-gray-700 mb-3">סיכום הפרטים שלך</p>
                  <div className="bg-gray-50 rounded-xl border border-gray-100 px-5 py-2">
                    <SummaryRow label="שם מלא"        value={form.fullName} />
                    <SummaryRow label="שם העסק"       value={form.businessName} />
                    <SummaryRow label="אימייל"         value={form.email} />
                    <SummaryRow label="טלפון"          value={form.phone} />
                    <SummaryRow label="דרך קשר"       value={form.preferredContact} />
                    <SummaryRow label="תחום"           value={form.businessType} />
                    <SummaryRow label="אזורי פעילות"  value={form.operatingAreas} />
                    <SummaryRow label="מטרה עיקרית"   value={form.mainGoal} />
                    <SummaryRow label="תקציב"          value={form.budgetRange} />
                    <SummaryRow label="ערוצי שיווק"    value={form.marketingChannels} />
                  </div>
                  {(!form.fullName && !form.businessName) && (
                    <p className="text-xs text-gray-400 mt-2 text-center">
                      חזרו לשלב הראשון כדי למלא את הפרטים
                    </p>
                  )}
                </div>

                {/* Agreement */}
                <label className="flex items-start gap-3 cursor-pointer group select-none">
                  <div className="relative mt-0.5 flex-shrink-0">
                    <input
                      type="checkbox"
                      className="sr-only"
                      checked={agreed}
                      onChange={(e) => {
                        setAgreed(e.target.checked);
                        if (serverError) setServerError("");
                      }}
                    />
                    <div
                      className={[
                        "w-5 h-5 rounded border-2 flex items-center justify-center transition-all",
                        agreed ? "border-transparent" : "border-gray-300 bg-white group-hover:border-gray-400",
                      ].join(" ")}
                      style={agreed ? { backgroundColor: primaryColor, borderColor: primaryColor } : {}}
                    >
                      {agreed && <span className="text-white text-xs font-bold leading-none">✓</span>}
                    </div>
                  </div>
                  <span className="text-sm text-gray-600 leading-relaxed">
                    אני מסכים/ה שהמידע שמסרתי ישמש לצורך יצירת קשר ומתן שירות שיווקי.
                  </span>
                </label>
              </>
            )}

          </div>

          {/* Server error */}
          {serverError && (
            <div className="mx-6 mb-4 text-sm text-red-700 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
              {serverError}
            </div>
          )}

          {/* ── Navigation ─────────────────────────────────────────────── */}
          <div className="px-6 pb-6 pt-4 border-t border-gray-100 flex items-center justify-between">
            {step > 0 ? (
              <button
                type="button"
                onClick={back}
                className="text-sm text-gray-500 hover:text-gray-800 font-medium transition-colors"
              >
                חזרה
              </button>
            ) : (
              <span />
            )}

            {step < STEPS.length - 1 ? (
              <button
                type="button"
                onClick={next}
                className="px-8 py-3 rounded-xl text-white text-sm font-semibold shadow-sm hover:opacity-90 transition-opacity active:scale-95"
                style={{ backgroundColor: primaryColor }}
              >
                המשך
              </button>
            ) : (
              <button
                type="button"
                onClick={submit}
                disabled={loading}
                className="px-8 py-3 rounded-xl text-white text-sm font-semibold shadow-sm hover:opacity-90 transition-opacity active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed flex items-center gap-2"
                style={{ backgroundColor: primaryColor }}
              >
                {loading && (
                  <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin flex-shrink-0" />
                )}
                שלח טופס
              </button>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
