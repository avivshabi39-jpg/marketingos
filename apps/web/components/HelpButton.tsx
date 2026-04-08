"use client";

import { useState } from "react";

const HELP: Record<string, { title: string; steps: string[] }> = {
  builder: {
    title: "איך לבנות דף נחיתה",
    steps: [
      "גרור בלוק מהספרייה השמאלית לאזור האמצע",
      "לחץ על הבלוק כדי לערוך את התוכן",
      "שנה צבעים ועיצוב בפאנל הימני",
      "לחץ 'שמור' ואז 'פרסם' כשמוכן",
    ],
  },
  leads: {
    title: "איך לנהל לידים",
    steps: [
      "לידים חדשים מגיעים לעמודה 'ליד חדש'",
      "גרור ליד לעמודה הבאה כשמתקדמים",
      "לחץ על ליד לראות פרטים מלאים",
      "ליד שנסגר → גרור ל'עסקה נסגרה ✅'",
    ],
  },
  clients: {
    title: "איך לנהל לקוחות",
    steps: [
      "לחץ '+' להוסיף לקוח חדש",
      "לחץ על לקוח לראות את הפרטים שלו",
      "כל לקוח מקבל דף נחיתה + פורטל משלו",
      "שתף את קישור הפורטל עם הלקוח",
    ],
  },
  snapshots: {
    title: "מה זה תבניות ענף",
    steps: [
      "תבניות הן חבילות מוכנות לפי ענף",
      "בחר תבנית מתאימה לסוג הלקוח",
      "לחץ 'החל על לקוח' ובחר לקוח",
      "הדף + הודעות + הגדרות נטענות אוטומטית",
    ],
  },
  reports: {
    title: "איך לעבוד עם דוחות",
    steps: [
      "לחץ 'צור דוח' לבחור לקוח ותקופה",
      "הדוח נוצר אוטומטית עם נתוני לידים",
      "לחץ 'שלח ללקוח' לשלוח במייל",
      "דוחות שבועיים נשלחים אוטומטית בכל יום שני",
    ],
  },
  appointments: {
    title: "ניהול תורים ופגישות",
    steps: [
      "לידים שקובעים פגישה מופיעים כאן",
      "לחץ 'אשר' לאישור פגישה",
      "לחץ 'בוצע' לסימון שהפגישה נערכה",
      "השתמש בפילטרים: היום / השבוע / הכל",
    ],
  },
};

export function HelpButton({ page }: { page: string }) {
  const [open, setOpen] = useState(false);
  const help = HELP[page];
  if (!help) return null;

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="w-7 h-7 rounded-full bg-slate-100 border border-slate-200 hover:bg-slate-200 transition-colors flex items-center justify-center text-sm font-bold text-slate-500 hover:text-slate-700 flex-shrink-0"
        title="עזרה"
        aria-label="עזרה"
      >
        ?
      </button>

      {open && (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/50"
          onClick={() => setOpen(false)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-7"
            dir="rtl"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-bold text-slate-900 mb-4">
              💡 {help.title}
            </h3>
            <ol className="space-y-3 pr-1">
              {help.steps.map((step, i) => (
                <li key={i} className="flex items-start gap-3">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-100 text-blue-700 text-xs font-bold flex items-center justify-center mt-0.5">
                    {i + 1}
                  </span>
                  <span className="text-sm text-slate-700 leading-relaxed">{step}</span>
                </li>
              ))}
            </ol>
            <button
              onClick={() => setOpen(false)}
              className="mt-6 w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm py-2.5 rounded-xl transition-colors"
            >
              הבנתי! ✅
            </button>
          </div>
        </div>
      )}
    </>
  );
}
