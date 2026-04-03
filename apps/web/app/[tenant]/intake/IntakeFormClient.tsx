"use client";

import { useState } from "react";

interface Props {
  clientSlug: string;
  clientName: string;
  primaryColor: string;
}

const QUESTIONS = [
  { id: "businessName",     label: "מה שם העסק שלך ובאיזה תחום אתה פועל?",          type: "text",     placeholder: "לדוגמה: גיא גגות — קבלן גגות ואלומיניום" },
  { id: "targetAudience",   label: "מי הלקוח האידיאלי שלך?",                          type: "textarea", placeholder: "גיל, מיקום, בעיה שחווה, מה הוא מחפש..." },
  { id: "problemSolved",    label: "מה הבעיה הכי גדולה שאתה פותר ללקוח?",            type: "textarea", placeholder: "הבעיה שגורמת לאנשים לחפש את השירות שלך..." },
  { id: "monthlyDeals",     label: "כמה עסקאות אתה סוגר בממוצע בחודש?",              type: "text",     placeholder: "לדוגמה: 5–10 עסקאות בחודש" },
  { id: "budgetRange",      label: "מה התקציב החודשי שלך לשיווק?",                    type: "select",   options: ["עד ₪2,000", "₪2,000–₪5,000", "₪5,000–₪10,000", "₪10,000–₪20,000", "₪20,000+", "עדיין לא יודע/ת"] },
  { id: "marketingSuccess", label: "מה עבד לך בשיווק עד היום?",                       type: "textarea", placeholder: "ערוצים, סוגי קמפיינים, תוכן שעבד..." },
  { id: "marketingFailure", label: "מה ניסית ולא עבד, ולמה לדעתך?",                  type: "textarea", placeholder: "מה עשית ולא הביא תוצאות..." },
  { id: "mainCompetitors",  label: "מי המתחרים הראשיים שלך?",                         type: "textarea", placeholder: "שמות חברות, מה הם עושים טוב..." },
  { id: "uniqueSellingPoint", label: "מה מייחד אותך מהמתחרים?",                       type: "textarea", placeholder: "למה לקוח יבחר דווקא בך..." },
  { id: "goals",            label: "מה המטרה שלך בחודש הקרוב?",                       type: "textarea", placeholder: "לידים, מכירות, הגדלת מודעות, לקוחות חדשים..." },
] as const;

type QuestionId = (typeof QUESTIONS)[number]["id"];
type FormData = Record<QuestionId | "fullName" | "email" | "phone", string>;

const INITIAL: FormData = {
  fullName: "", email: "", phone: "",
  businessName: "", targetAudience: "", problemSolved: "", monthlyDeals: "",
  budgetRange: "", marketingSuccess: "", marketingFailure: "",
  mainCompetitors: "", uniqueSellingPoint: "", goals: "",
};

// Contact (0) + 10 questions (1–10) + review (11)
const TOTAL_STEPS = 12;

const inputBase =
  "block w-full rounded-xl border border-gray-200 px-4 py-3 text-sm bg-white " +
  "focus:outline-none focus:ring-2 focus:ring-offset-0 transition-all placeholder:text-gray-400 shadow-sm";
const inputNormal = "focus:border-indigo-400 focus:ring-indigo-400/20";
const inputErr    = "border-red-300 focus:border-red-400 focus:ring-red-400/20 bg-red-50";

function Wrap({ label, error, children }: {
  label: string; error?: string; children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm font-semibold text-gray-700">{label}</label>
      {children}
      {error && <p className="text-xs text-red-600 mt-0.5">{error}</p>}
    </div>
  );
}

export function IntakeFormClient({ clientSlug, clientName, primaryColor }: Props) {
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<FormData>(INITIAL);
  const [agreed, setAgreed] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<string, string>>>({});
  const [submitted, setSubmitted] = useState(false);
  const [serverError, setServerError] = useState("");
  const [loading, setLoading] = useState(false);

  function setField(field: string, value: string) {
    setForm((p) => ({ ...p, [field]: value }));
    if (errors[field]) setErrors((p) => ({ ...p, [field]: undefined }));
  }

  function validate(): boolean {
    const errs: Partial<Record<string, string>> = {};
    if (step === 0) {
      if (!form.fullName.trim()) errs.fullName = "שם מלא הוא שדה חובה";
      if (!form.email.trim()) errs.email = "אימייל הוא שדה חובה";
      else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errs.email = "כתובת אימייל לא תקינה";
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  function goNext() { if (validate()) setStep((s) => s + 1); }
  function goBack() { setStep((s) => s - 1); setErrors({}); setServerError(""); }

  async function handleSubmit() {
    if (!agreed) { setServerError("יש לאשר את ההסכמה לפני השליחה."); return; }
    setServerError(""); setLoading(true);

    const { fullName, email, phone, businessName, targetAudience, uniqueSellingPoint, budgetRange, goals,
      problemSolved, monthlyDeals, marketingSuccess, marketingFailure, mainCompetitors } = form;

    const res = await fetch(`/api/intake/${clientSlug}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        fullName, email, phone,
        businessName,
        businessType: "",
        targetAudience,
        uniqueSellingPoint,
        budgetRange,
        goals,
        extraData: { problemSolved, monthlyDeals, marketingSuccess, marketingFailure, mainCompetitors },
      }),
    });

    if (res.ok) {
      setSubmitted(true);
    } else {
      const data = await res.json().catch(() => ({}));
      setServerError(data.error?.fieldErrors ? "יש למלא את כל שדות החובה." : "אירעה שגיאה. אנא נסה שוב.");
      setLoading(false);
    }
  }

  if (submitted) {
    return (
      <div dir="rtl" className="min-h-screen bg-gradient-to-b from-gray-50 to-white flex items-center justify-center p-6">
        <div className="text-center max-w-sm">
          <div
            className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 text-white text-3xl shadow-lg"
            style={{ backgroundColor: primaryColor }}
          >
            ✓
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-3">תודה רבה!</h2>
          <p className="text-gray-500 text-base leading-relaxed">
            הטופס נשלח בהצלחה.<br />
            <strong className="text-gray-700">{clientName}</strong> יצרו איתך קשר בקרב.
          </p>
        </div>
      </div>
    );
  }

  const qIndex = step - 1; // question index (0-9) for steps 1-10
  const currentQ = qIndex >= 0 && qIndex < QUESTIONS.length ? QUESTIONS[qIndex] : null;
  const isReview = step === TOTAL_STEPS - 1;
  const progressPct = Math.round((step / (TOTAL_STEPS - 1)) * 100);

  return (
    <div dir="rtl" className="min-h-screen bg-gray-50">

      {/* Header */}
      <div className="relative overflow-hidden" style={{ backgroundColor: primaryColor }}>
        <div className="absolute -top-12 -left-12 w-48 h-48 rounded-full bg-white/10" />
        <div className="absolute -bottom-10 right-8 w-36 h-36 rounded-full bg-white/10" />
        <div className="relative max-w-2xl mx-auto px-6 py-12 text-center text-white">
          <div className="w-14 h-14 rounded-full bg-white/20 border-2 border-white/40 flex items-center justify-center mx-auto mb-4 text-xl font-bold">
            {clientName[0]}
          </div>
          <h1 className="text-2xl font-bold mb-1">{clientName}</h1>
          <p className="text-white/80 text-sm">שאלון קבלת לקוח — 10 שאלות קצרות</p>
        </div>
      </div>

      {/* Progress bar */}
      <div className="bg-white border-b border-gray-100 shadow-sm sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-6 py-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-gray-700">
              {step === 0 ? "פרטי קשר" : isReview ? "סיכום ואישור" : `שאלה ${step} מתוך 10`}
            </span>
            <span className="text-xs text-gray-400">שלב {step + 1} מתוך {TOTAL_STEPS}</span>
          </div>
          <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{ width: `${progressPct}%`, backgroundColor: primaryColor }}
            />
          </div>
        </div>
      </div>

      {/* Form card */}
      <div className="max-w-2xl mx-auto px-4 py-8 pb-20">
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm">
          <div className="px-6 pt-7 pb-1">
            <h2 className="text-xl font-bold text-gray-900">
              {step === 0 ? "פרטי יצירת קשר" : isReview ? "סיכום ואישור" : currentQ?.label}
            </h2>
          </div>

          <div className="px-6 py-5 space-y-5">

            {/* Step 0: Contact */}
            {step === 0 && (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Wrap label="שם מלא *" error={errors.fullName}>
                    <input value={form.fullName} onChange={(e) => setField("fullName", e.target.value)}
                      placeholder="ישראל ישראלי" className={`${inputBase} ${errors.fullName ? inputErr : inputNormal}`} />
                  </Wrap>
                  <Wrap label="אימייל *" error={errors.email}>
                    <input type="email" dir="ltr" value={form.email} onChange={(e) => setField("email", e.target.value)}
                      placeholder="example@email.com" className={`${inputBase} text-left ${errors.email ? inputErr : inputNormal}`} />
                  </Wrap>
                </div>
                <Wrap label="טלפון">
                  <input type="tel" dir="ltr" value={form.phone} onChange={(e) => setField("phone", e.target.value)}
                    placeholder="050-0000000" className={`${inputBase} text-left ${inputNormal}`} />
                </Wrap>
              </>
            )}

            {/* Steps 1–10: Questions */}
            {step >= 1 && step <= 10 && currentQ && (
              currentQ.type === "textarea" ? (
                <textarea rows={5} value={(form as Record<string, string>)[currentQ.id] ?? ""}
                  onChange={(e) => setField(currentQ.id, e.target.value)}
                  placeholder={currentQ.placeholder}
                  className={`${inputBase} ${inputNormal} resize-none`} />
              ) : currentQ.type === "select" && "options" in currentQ ? (
                <select value={(form as Record<string, string>)[currentQ.id] ?? ""}
                  onChange={(e) => setField(currentQ.id, e.target.value)}
                  className={`${inputBase} ${inputNormal}`}>
                  <option value="">בחר...</option>
                  {([...(currentQ.options as readonly string[])]).map((o) => <option key={o} value={o}>{o}</option>)}
                </select>
              ) : (
                <input value={(form as Record<string, string>)[currentQ.id] ?? ""}
                  onChange={(e) => setField(currentQ.id, e.target.value)}
                  placeholder={currentQ.placeholder}
                  className={`${inputBase} ${inputNormal}`} />
              )
            )}

            {/* Step 11: Review */}
            {isReview && (
              <>
                <div className="bg-gray-50 rounded-xl border border-gray-100 p-5 space-y-2 max-h-72 overflow-y-auto">
                  <p className="text-sm font-bold text-gray-700 mb-3">סיכום הטופס</p>
                  {([
                    ["שם מלא", form.fullName],
                    ["אימייל", form.email],
                    ["טלפון", form.phone],
                    ...QUESTIONS.map((q) => [q.label.replace("?", ""), (form as Record<string, string>)[q.id] ?? ""] as [string, string]),
                  ] as [string, string][]).filter(([, v]) => v).map(([label, value]) => (
                    <div key={label} className="flex items-start justify-between gap-4 py-1.5 border-b border-gray-100 last:border-0">
                      <span className="text-xs text-gray-500 flex-shrink-0 max-w-[40%]">{label}</span>
                      <span className="text-xs text-gray-900 font-medium text-left break-words max-w-[55%]">{value}</span>
                    </div>
                  ))}
                </div>

                <label className="flex items-start gap-3 cursor-pointer group select-none">
                  <div className="relative mt-0.5 flex-shrink-0">
                    <input type="checkbox" className="sr-only" checked={agreed}
                      onChange={(e) => { setAgreed(e.target.checked); if (serverError) setServerError(""); }} />
                    <div
                      className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${agreed ? "border-transparent" : "border-gray-300 bg-white group-hover:border-gray-400"}`}
                      style={agreed ? { backgroundColor: primaryColor, borderColor: primaryColor } : {}}>
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

          {serverError && (
            <div className="mx-6 mb-3 text-sm text-red-700 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
              {serverError}
            </div>
          )}

          <div className="px-6 pb-6 pt-4 mt-2 border-t border-gray-100 flex items-center justify-between">
            {step > 0 ? (
              <button type="button" onClick={goBack}
                className="text-sm text-gray-500 hover:text-gray-800 font-medium transition-colors">
                חזרה
              </button>
            ) : <div />}

            {!isReview ? (
              <button type="button" onClick={goNext}
                className="px-8 py-3 rounded-xl text-white text-sm font-semibold shadow-sm hover:opacity-90 transition-opacity active:scale-95"
                style={{ backgroundColor: primaryColor }}>
                {step === 0 ? "התחל" : step === 10 ? "לסיכום" : "הבא"}
              </button>
            ) : (
              <button type="button" onClick={handleSubmit} disabled={loading}
                className="px-8 py-3 rounded-xl text-white text-sm font-semibold shadow-sm hover:opacity-90 transition-opacity active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed flex items-center gap-2"
                style={{ backgroundColor: primaryColor }}>
                {loading && <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />}
                שלח טופס
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
