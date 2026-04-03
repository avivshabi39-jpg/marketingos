"use client";

import { useState, useEffect } from "react";

const STEPS = [
  {
    title: "ברוך הבא! 🎉",
    desc: "זה הדשבורד שלך — כאן תראה את כל הנתונים",
    icon: "🏠",
  },
  {
    title: "הלידים שלך 🎯",
    desc: "כל מי שמילא את הטופס בדף שלך יופיע כאן",
    icon: "🎯",
  },
  {
    title: "הדף שלך 🌐",
    desc: "הדף שמביא לך לקוחות — ניתן לערוך בכל עת",
    icon: "🌐",
  },
  {
    title: "הסוכן שלך 🤖",
    desc: "יש לך עוזר AI אישי — שאל אותו כל שאלה!",
    icon: "🤖",
  },
];

export function OnboardingTour() {
  const [step, setStep] = useState(0);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const done = localStorage.getItem("onboarding_done");
    if (!done) setVisible(true);
  }, []);

  function finish() {
    localStorage.setItem("onboarding_done", "1");
    setVisible(false);
  }

  if (!visible) return null;

  const current = STEPS[step];
  const isLast = step === STEPS.length - 1;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        background: "rgba(0,0,0,0.6)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <div
        style={{
          background: "white",
          borderRadius: "20px",
          padding: "40px",
          maxWidth: "400px",
          width: "90%",
          textAlign: "center",
          direction: "rtl",
        }}
      >
        <div style={{ fontSize: "56px", marginBottom: "16px" }}>
          {current.icon}
        </div>
        <h2
          style={{
            fontSize: "22px",
            fontWeight: 700,
            marginBottom: "10px",
          }}
        >
          {current.title}
        </h2>
        <p
          style={{
            color: "#6b7280",
            fontSize: "15px",
            marginBottom: "28px",
            lineHeight: 1.6,
          }}
        >
          {current.desc}
        </p>

        {/* Progress dots */}
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            gap: "6px",
            marginBottom: "24px",
          }}
        >
          {STEPS.map((_, i) => (
            <div
              key={i}
              style={{
                width: i === step ? "20px" : "8px",
                height: "8px",
                borderRadius: "4px",
                background: i === step ? "#6366f1" : "#e5e7eb",
                transition: "all 0.3s",
              }}
            />
          ))}
        </div>

        <button
          onClick={isLast ? finish : () => setStep((s) => s + 1)}
          style={{
            width: "100%",
            padding: "14px",
            background: "#6366f1",
            color: "white",
            border: "none",
            borderRadius: "12px",
            fontSize: "16px",
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          {isLast ? "בוא נתחיל! 🚀" : "הבא →"}
        </button>

        {!isLast && (
          <button
            onClick={finish}
            style={{
              marginTop: "10px",
              background: "none",
              border: "none",
              color: "#9ca3af",
              cursor: "pointer",
              fontSize: "13px",
            }}
          >
            דלג
          </button>
        )}
      </div>
    </div>
  );
}
