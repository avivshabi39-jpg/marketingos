"use client";

import { useState } from "react";
import { trackOnboardingStep, trackOnboardingCompleted } from "@/lib/analytics";

interface Props {
  clientId: string;
  clientName: string;
  onComplete: () => void;
}

const STEPS = [
  {
    title: "ברוך הבא! 👋",
    subtitle: "בואו נגדיר את הפרופיל שלך",
    icon: "🏢",
    desc: "MarketingOS הוא מרכז השיווק שלך. בעוד 2 דקות תהיה מוכן לקבל לידים ולשלוח הודעות.",
    action: "בואו נתחיל",
  },
  {
    title: "חבר את WhatsApp 💬",
    subtitle: "שלח הודעות ללידים שלך",
    icon: "💬",
    desc: "חבר את Green API כדי לשלוח הודעות WhatsApp אוטומטיות ללידים שלך.",
    action: "הגדר WhatsApp",
  },
  {
    title: "חבר את Facebook 📘",
    subtitle: "קבל לידים ישירות מהמודעות",
    icon: "📘",
    desc: "חבר את דף הפייסבוק שלך כדי שכל ליד ממודעות יגיע אוטומטית למערכת.",
    action: "הגדר Facebook",
  },
  {
    title: "בנה דף נחיתה 🧙",
    subtitle: "דף מקצועי תוך דקות",
    icon: "🧙",
    desc: "לחץ על 'בנה דף' בתפריט ועקוב אחרי 15 שאלות — AI יבנה לך דף מקצועי!",
    action: "המשך",
  },
  {
    title: "הכל מוכן! 🎉",
    subtitle: "MarketingOS פעיל",
    icon: "🎉",
    desc: "המערכת מוגדרת ומוכנה לקבל לידים. תוכל לחזור להגדרות בכל עת מהתפריט.",
    action: "כניסה למערכת",
  },
];

export function OnboardingWizard({ clientId, clientName, onComplete }: Props) {
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);

  const s = STEPS[step];
  const isLast = step === STEPS.length - 1;
  const pct = Math.round(((step + 1) / STEPS.length) * 100);

  async function next() {
    trackOnboardingStep(step + 1, STEPS.length);
    if (isLast) trackOnboardingCompleted();
    setSaving(true);
    await fetch(`/api/clients/${clientId}/onboarding`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ step: step + 1, completed: isLast }),
    }).catch(() => {});
    setSaving(false);
    if (isLast) onComplete();
    else setStep((p) => p + 1);
  }

  function skip() {
    fetch(`/api/clients/${clientId}/onboarding`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ completed: true }),
    }).catch(() => {});
    onComplete();
  }

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.6)",
        backdropFilter: "blur(4px)",
        zIndex: 1000,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "16px",
        direction: "rtl",
      }}
    >
      <div
        style={{
          background: "white",
          borderRadius: "20px",
          padding: "40px",
          maxWidth: "480px",
          width: "100%",
          boxShadow: "0 25px 60px rgba(0,0,0,0.3)",
          position: "relative",
        }}
      >
        <button
          onClick={skip}
          style={{
            position: "absolute",
            top: "16px",
            left: "16px",
            background: "none",
            border: "none",
            fontSize: "12px",
            color: "#9ca3af",
            cursor: "pointer",
          }}
        >
          דלג
        </button>

        <div style={{ fontSize: "12px", color: "#9ca3af", marginBottom: "16px", textAlign: "left" }}>
          {step + 1} / {STEPS.length}
        </div>

        <div style={{ height: "4px", background: "#e5e7eb", borderRadius: "999px", marginBottom: "32px", overflow: "hidden" }}>
          <div style={{ height: "100%", width: `${pct}%`, background: "#6366f1", borderRadius: "999px", transition: "width 0.4s ease" }} />
        </div>

        <div style={{ fontSize: "48px", textAlign: "center", marginBottom: "16px" }}>{s.icon}</div>

        <h2 style={{ fontSize: "22px", fontWeight: 800, textAlign: "center", marginBottom: "6px", color: "#111827" }}>{s.title}</h2>
        <p style={{ fontSize: "14px", color: "#6b7280", textAlign: "center", marginBottom: "16px" }}>{s.subtitle}</p>
        <p style={{ fontSize: "14px", color: "#374151", textAlign: "center", lineHeight: 1.6, marginBottom: "32px", padding: "0 8px" }}>{s.desc}</p>

        <div style={{ display: "flex", justifyContent: "center", gap: "8px", marginBottom: "24px" }}>
          {STEPS.map((_, i) => (
            <div
              key={i}
              style={{
                width: i === step ? "24px" : "8px",
                height: "8px",
                borderRadius: "999px",
                background: i <= step ? "#6366f1" : "#e5e7eb",
                transition: "all 0.3s",
              }}
            />
          ))}
        </div>

        <button
          onClick={next}
          disabled={saving}
          style={{
            width: "100%",
            padding: "14px",
            background: isLast ? "#22c55e" : "#6366f1",
            color: "white",
            border: "none",
            borderRadius: "12px",
            fontSize: "15px",
            fontWeight: 700,
            cursor: saving ? "not-allowed" : "pointer",
          }}
        >
          {saving ? "..." : s.action}
        </button>

        {step > 0 && (
          <button
            onClick={() => setStep((p) => p - 1)}
            style={{
              width: "100%",
              padding: "10px",
              background: "none",
              border: "none",
              fontSize: "13px",
              color: "#9ca3af",
              cursor: "pointer",
              marginTop: "8px",
            }}
          >
            ← חזור
          </button>
        )}
      </div>
    </div>
  );
}
