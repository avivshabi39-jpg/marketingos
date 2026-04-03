"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

const INDUSTRIES = [
  { value: "GENERAL",     label: "🏢 עסק כללי" },
  { value: "REAL_ESTATE", label: "🏡 נדל\"ן" },
  { value: "FINANCE",     label: "💰 פיננסים" },
  { value: "COSMETICS",   label: "💄 קוסמטיקה" },
  { value: "CLEANING",    label: "🧹 ניקיון" },
  { value: "ROOFING",     label: "🏗️ גגות" },
  { value: "FOOD",        label: "🍕 מזון" },
  { value: "FITNESS",     label: "💪 כושר" },
  { value: "MEDICAL",     label: "🏥 רפואה" },
  { value: "AVIATION",    label: "✈️ תעופה" },
];

function makeSlug(name: string): string {
  const map: Record<string, string> = {
    א:"a",ב:"b",ג:"g",ד:"d",ה:"h",ו:"v",ז:"z",ח:"ch",ט:"t",י:"y",
    כ:"k",ל:"l",מ:"m",נ:"n",ס:"s",ע:"e",פ:"p",צ:"tz",ק:"k",ר:"r",ש:"sh",ת:"t",
  };
  return name
    .split("")
    .map((c) => map[c] ?? c)
    .join("")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "") +
    "-" + Date.now().toString().slice(-4);
}

type CreatedClient = { id: string; setupActions?: string[] };

export function AdminOnboarding({ userName }: { userName: string }) {
  const [visible, setVisible] = useState(false);
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ name: "", industry: "GENERAL", phone: "" });
  const [created, setCreated] = useState<CreatedClient | null>(null);
  const router = useRouter();

  useEffect(() => {
    const done = localStorage.getItem("admin_onboarding_done");
    if (!done) setVisible(true);
  }, []);

  function dismiss() {
    localStorage.setItem("admin_onboarding_done", "1");
    setVisible(false);
  }

  async function createFirstClient() {
    if (!form.name) return;
    setLoading(true);
    try {
      const res = await fetch("/api/clients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, slug: makeSlug(form.name) }),
      });
      const data = await res.json();
      setCreated({ id: data.client?.id, setupActions: data.setupActions });
      setStep(2);
    } finally {
      setLoading(false);
    }
  }

  function finish() {
    localStorage.setItem("admin_onboarding_done", "1");
    setVisible(false);
    if (created?.id) router.push(`/admin/clients/${created.id}`);
  }

  if (!visible) return null;

  const overlayStyle: React.CSSProperties = {
    position: "fixed", inset: 0, zIndex: 9999,
    background: "rgba(0,0,0,0.7)",
    display: "flex", alignItems: "center", justifyContent: "center",
  };
  const cardStyle: React.CSSProperties = {
    background: "white", borderRadius: "20px",
    padding: "40px", maxWidth: "460px",
    width: "90%", direction: "rtl",
  };
  const btnPrimary: React.CSSProperties = {
    width: "100%", padding: "14px",
    background: "#6366f1", color: "white",
    border: "none", borderRadius: "12px",
    fontSize: "16px", fontWeight: 600, cursor: "pointer",
  };
  const btnGhost: React.CSSProperties = {
    width: "100%", marginTop: "10px",
    background: "none", border: "none",
    color: "#9ca3af", cursor: "pointer", fontSize: "13px",
  };

  return (
    <div style={overlayStyle}>
      <div style={cardStyle}>

        {/* Step 0: Welcome */}
        {step === 0 && (
          <>
            <div style={{ fontSize: "48px", textAlign: "center", marginBottom: "16px" }}>🚀</div>
            <h2 style={{ fontSize: "22px", fontWeight: 700, textAlign: "center", marginBottom: "8px" }}>
              ברוכים הבאים, {userName}!
            </h2>
            <p style={{ color: "#6b7280", textAlign: "center", marginBottom: "28px" }}>
              בואו נגדיר את המערכת שלך בתוך דקה
            </p>
            <button onClick={() => setStep(1)} style={btnPrimary}>בוא נתחיל →</button>
            <button onClick={dismiss} style={btnGhost}>דלג לדשבורד</button>
          </>
        )}

        {/* Step 1: Add first client */}
        {step === 1 && (
          <>
            <h2 style={{ fontSize: "20px", fontWeight: 700, marginBottom: "20px" }}>👥 הוסף לקוח ראשון</h2>
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              <input
                placeholder="שם העסק של הלקוח"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                style={{ padding: "10px 14px", borderRadius: "8px", border: "1px solid #e5e7eb", fontSize: "15px" }}
              />
              <select
                value={form.industry}
                onChange={(e) => setForm((f) => ({ ...f, industry: e.target.value }))}
                style={{ padding: "10px 14px", borderRadius: "8px", border: "1px solid #e5e7eb", fontSize: "15px" }}
              >
                {INDUSTRIES.map((i) => (
                  <option key={i.value} value={i.value}>{i.label}</option>
                ))}
              </select>
              <input
                placeholder="טלפון (לא חובה)"
                value={form.phone}
                onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                style={{ padding: "10px 14px", borderRadius: "8px", border: "1px solid #e5e7eb", fontSize: "15px" }}
              />
            </div>
            <button
              onClick={createFirstClient}
              disabled={!form.name || loading}
              style={{
                ...btnPrimary,
                marginTop: "20px",
                background: form.name ? "#6366f1" : "#e5e7eb",
                color: form.name ? "white" : "#9ca3af",
                cursor: form.name && !loading ? "pointer" : "default",
              }}
            >
              {loading ? "⏳ מכין..." : "הוסף לקוח ✅"}
            </button>
            <button onClick={dismiss} style={btnGhost}>דלג — אוסיף לקוח מאוחר יותר</button>
          </>
        )}

        {/* Step 2: Success */}
        {step === 2 && created && (
          <>
            <div style={{ fontSize: "48px", textAlign: "center", marginBottom: "16px" }}>🎉</div>
            <h2 style={{ fontSize: "20px", fontWeight: 700, textAlign: "center", marginBottom: "20px" }}>הכל מוכן!</h2>
            <div style={{ background: "#f0fdf4", borderRadius: "12px", padding: "16px", marginBottom: "20px" }}>
              {(created.setupActions ?? ["דף נחיתה מוכן", "פורטל לקוח מוכן"]).map((a) => (
                <div key={a} style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px", fontSize: "14px", color: "#166534" }}>
                  ✅ {a}
                </div>
              ))}
            </div>
            <button onClick={finish} style={btnPrimary}>פתח את הלקוח →</button>
          </>
        )}

      </div>
    </div>
  );
}
