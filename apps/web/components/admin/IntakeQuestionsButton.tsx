"use client";

import { useState } from "react";
import { Eye, X } from "lucide-react";

const CLIENT_ONBOARDING_QUESTIONS = [
  { section: "פרטי העסק", questions: [
    "שם העסק המלא",
    "תחום הפעילות העיקרי",
    "כמה שנים העסק פעיל?",
    "מספר עובדים",
    "מה ייחודיות העסק שלך?",
  ]},
  { section: "קהל יעד", questions: [
    "מי הלקוח האידיאלי שלך?",
    "מה הבעיה שהלקוח מנסה לפתור?",
    "באילו ערוצים הלקוחות מגלים אותך?",
    "מה מניע לקוח לבחור בך?",
  ]},
  { section: "תקציב ויעדים", questions: [
    "תקציב חודשי לפרסום?",
    "יעד לידים חודשי?",
    "עלות ליד מקסימלית?",
  ]},
  { section: "מתחרים", questions: [
    "מי 3 המתחרים הראשיים?",
    "מה חוזקות המתחרים?",
    "במה אתה טוב יותר מהם?",
  ]},
  { section: "מוצרים ושירותים", questions: [
    "רשום שירותים/מוצרים ראשיים",
    "מה השירות הכי רווחי?",
    "האם יש מבצעים/עונתיות?",
  ]},
  { section: "נוכחות דיגיטלית", questions: [
    "כתובת אתר",
    "קישור לפייסבוק/אינסטגרם",
    "האם יש ביקורות גוגל?",
  ]},
  { section: "שיווק עכשווי", questions: [
    "מה עשית עד היום ומה עבד?",
    "מה לא עבד ולמה?",
  ]},
  { section: "ציפיות", questions: [
    "מה הציפייה מהקמפיין הראשון?",
    "משהו חשוב שלא שאלנו?",
  ]},
];

const LANDING_PAGE_QUESTIONS = [
  { section: "פרטי הסוכן", questions: [
    "שם הסוכן המלא",
    "שנות ניסיון בנדל\"ן",
    "התמחות (דירות/בתים/מסחרי)",
    "אזורי פעילות עיקריים",
    "מה מייחד אותך כסוכן?",
    "כמה עסקאות סגרת השנה?",
    "לוגו/תמונת פרופיל",
    "טלפון ווטסאפ",
    "קהל יעד (קונים/מוכרים/שניהם)",
    "סוג נכסים מועדף",
  ]},
];

export function IntakeQuestionsButton({ formType }: { formType: "CLIENT_ONBOARDING" | "LANDING_PAGE" }) {
  const [open, setOpen] = useState(false);

  const sections = formType === "CLIENT_ONBOARDING" ? CLIENT_ONBOARDING_QUESTIONS : LANDING_PAGE_QUESTIONS;
  const totalQuestions = sections.reduce((s, sec) => s + sec.questions.length, 0);
  const typeLabel = formType === "CLIENT_ONBOARDING" ? "טופס קבלת לקוח" : "טופס אפיון לאתר";

  let counter = 0;

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-1 text-xs text-gray-500 hover:text-indigo-600 border border-gray-200 hover:border-indigo-300 rounded-lg px-2 py-1.5 transition"
      >
        <Eye size={12} />
        {totalQuestions} שאלות
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 overflow-y-auto" onClick={() => setOpen(false)}>
          <div
            className="bg-white rounded-2xl shadow-2xl w-full max-w-lg my-4 relative"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 bg-white rounded-t-2xl border-b border-gray-100 px-6 py-4 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-gray-900">{typeLabel}</h3>
                <p className="text-xs text-gray-500">{totalQuestions} שאלות</p>
              </div>
              <button onClick={() => setOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X size={18} />
              </button>
            </div>

            <div className="p-6 space-y-5 max-h-[70vh] overflow-y-auto">
              {sections.map((sec) => (
                <div key={sec.section}>
                  <h4 className="text-xs font-bold text-indigo-600 uppercase tracking-wide mb-3">
                    {sec.section}
                  </h4>
                  <div className="space-y-2">
                    {sec.questions.map((q) => {
                      counter++;
                      return (
                        <div key={q} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                          <span className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-600 text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                            {counter}
                          </span>
                          <p className="text-sm text-gray-700">{q}</p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
