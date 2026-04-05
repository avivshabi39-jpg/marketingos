"use client";

import { useState } from "react";

interface SequenceStep {
  delay: number;
  subject: string;
  body: string;
}

interface Sequence {
  id: string;
  name: string;
  isActive: boolean;
  trigger: string;
  steps: SequenceStep[];
  logCount: number;
  createdAt: Date | string;
}

const EMAIL_TEMPLATES = [
  {
    id: "welcome",
    name: "👋 ברוך הבא",
    description: "סדרת 3 מיילים לליד חדש",
    trigger: "new_lead",
    steps: [
      { delay: 0, subject: "ברוך הבא! 👋", body: "שלום {שם},\n\nתודה שפנית אלינו!\nנחזור אליך בהקדם.\n\nבברכה,\n{שם העסק}" },
      { delay: 1, subject: "שאלה קטנה...", body: "שלום {שם},\n\nרצינו לוודא שקיבלת את פנייתנו.\nיש משהו ספציפי שאנחנו יכולים לעזור בו?\n\nנשמח לשמוע!\n{שם העסק}" },
      { delay: 3, subject: "מה שלך?", body: "שלום {שם},\n\nאנחנו כאן בשבילך בכל עת.\nאל תהסס לפנות!\n\nבברכה,\n{שם העסק}" },
    ],
  },
  {
    id: "followup",
    name: "🔄 followup חכם",
    description: "מעקב אחרי לידים שלא ענו",
    trigger: "no_reply_3days",
    steps: [
      { delay: 1, subject: "שכחנו משהו?", body: "שלום {שם},\n\nרצינו לחזור אליך לגבי פנייתך.\nנשמח לעזור!\n\n{שם העסק}" },
      { delay: 3, subject: "הצעה מיוחדת עבורך", body: "שלום {שם},\n\nיש לנו משהו מיוחד עבורך.\nצור קשר עכשיו!\n\n{שם העסק}" },
    ],
  },
  {
    id: "nurture",
    name: "💎 טיפוח לקוח",
    description: "שמירת קשר עם לקוחות שנסגרו",
    trigger: "won_lead",
    steps: [
      { delay: 7, subject: "טיפ שבועי מאיתנו", body: "שלום {שם},\n\nהנה טיפ שיעזור לך השבוע:\n[הוסף טיפ רלוונטי]\n\n{שם העסק}" },
      { delay: 30, subject: "חדשות מ{שם העסק}", body: "שלום {שם},\n\nרצינו לעדכן אותך בחדשות שלנו:\n[הוסף עדכון]\n\n{שם העסק}" },
    ],
  },
];

export function PortalEmailClient({
  client,
  sequences,
  leadCount,
}: {
  client: { id: string; name: string; slug: string };
  sequences: Sequence[];
  leadCount: number;
}) {
  const [showCreate, setShowCreate] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [localSequences, setLocalSequences] = useState(sequences);
  const [error, setError] = useState<string | null>(null);

  async function createFromTemplate(templateId: string) {
    const template = EMAIL_TEMPLATES.find((t) => t.id === templateId);
    if (!template) return;

    setCreating(true);
    setError(null);

    try {
      const res = await fetch("/api/email-sequences", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientId: client.id,
          name: template.name,
          trigger: template.trigger,
          steps: template.steps,
        }),
      });

      if (!res.ok) throw new Error("Failed to create");

      const data = await res.json();
      if (data.sequence) {
        setLocalSequences((prev) => [
          { ...data.sequence, steps: template.steps, logCount: 0 },
          ...prev,
        ]);
        setShowCreate(false);
        setSelectedTemplate(null);
      }
    } catch {
      setError("שגיאה ביצירת הסדרה. נסה שוב.");
    }
    setCreating(false);
  }

  async function toggleSequence(id: string, isActive: boolean) {
    await fetch(`/api/email-sequences/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive }),
    }).catch(() => {});

    setLocalSequences((prev) =>
      prev.map((s) => (s.id === id ? { ...s, isActive } : s))
    );
  }

  async function deleteSequence(id: string) {
    if (!confirm("למחוק את הסדרה?")) return;

    await fetch(`/api/email-sequences/${id}`, {
      method: "DELETE",
    }).catch(() => {});

    setLocalSequences((prev) => prev.filter((s) => s.id !== id));
  }

  const triggerLabels: Record<string, string> = {
    new_lead: "ליד חדש",
    won_lead: "ליד שנסגר",
    no_reply_3days: "ללא מענה 3 ימים",
  };

  return (
    <div style={{ padding: "16px", direction: "rtl", maxWidth: "700px" }}>
      {/* Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "20px",
        }}
      >
        <div>
          <h1 style={{ fontSize: "20px", fontWeight: 800, margin: 0 }}>
            📧 סדרות מייל
          </h1>
          <p style={{ fontSize: "13px", color: "#6b7280", margin: "4px 0 0" }}>
            מיילים אוטומטיים ללידים שלך
          </p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          style={{
            padding: "10px 18px",
            background: "#6366f1",
            color: "white",
            border: "none",
            borderRadius: "10px",
            fontWeight: 700,
            fontSize: "13px",
            cursor: "pointer",
          }}
        >
          + צור סדרה
        </button>
      </div>

      {/* Error */}
      {error && (
        <div
          style={{
            background: "#fef2f2",
            border: "1px solid #fecaca",
            borderRadius: "10px",
            padding: "12px 16px",
            fontSize: "13px",
            color: "#dc2626",
            marginBottom: "16px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <span>⚠️ {error}</span>
          <button
            onClick={() => setError(null)}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              color: "#dc2626",
              fontSize: "16px",
            }}
          >
            ✕
          </button>
        </div>
      )}

      {/* Stats */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: "10px",
          marginBottom: "20px",
        }}
      >
        {[
          {
            label: "סדרות פעילות",
            value: localSequences.filter((s) => s.isActive).length,
            color: "#22c55e",
          },
          { label: 'סה"כ לידים', value: leadCount, color: "#6366f1" },
          {
            label: "סדרות קיימות",
            value: localSequences.length,
            color: "#8b5cf6",
          },
        ].map((s) => (
          <div
            key={s.label}
            style={{
              background: "white",
              borderRadius: "12px",
              border: "1px solid #e5e7eb",
              padding: "14px",
              textAlign: "center",
            }}
          >
            <div style={{ fontSize: "24px", fontWeight: 800, color: s.color }}>
              {s.value}
            </div>
            <div
              style={{ fontSize: "11px", color: "#6b7280", marginTop: "3px" }}
            >
              {s.label}
            </div>
          </div>
        ))}
      </div>

      {/* Create modal */}
      {showCreate && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
            padding: "20px",
          }}
        >
          <div
            style={{
              background: "white",
              borderRadius: "16px",
              padding: "24px",
              width: "100%",
              maxWidth: "480px",
              direction: "rtl",
            }}
          >
            <h3
              style={{
                fontWeight: 700,
                marginBottom: "16px",
                fontSize: "17px",
              }}
            >
              ✉️ בחר תבנית סדרה
            </h3>

            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "10px",
                marginBottom: "16px",
              }}
            >
              {EMAIL_TEMPLATES.map((tmpl) => (
                <button
                  key={tmpl.id}
                  onClick={() =>
                    setSelectedTemplate(
                      selectedTemplate === tmpl.id ? null : tmpl.id
                    )
                  }
                  style={{
                    padding: "14px 16px",
                    textAlign: "right",
                    background:
                      selectedTemplate === tmpl.id ? "#eef2ff" : "#f9fafb",
                    border: `2px solid ${selectedTemplate === tmpl.id ? "#6366f1" : "#e5e7eb"}`,
                    borderRadius: "10px",
                    cursor: "pointer",
                    transition: "all 0.15s",
                  }}
                >
                  <div
                    style={{
                      fontWeight: 700,
                      fontSize: "14px",
                      color:
                        selectedTemplate === tmpl.id ? "#6366f1" : "#111827",
                      marginBottom: "3px",
                    }}
                  >
                    {tmpl.name}
                  </div>
                  <div style={{ fontSize: "12px", color: "#6b7280" }}>
                    {tmpl.description} • {tmpl.steps.length} מיילים
                  </div>
                  {selectedTemplate === tmpl.id && (
                    <div style={{ marginTop: "8px" }}>
                      {tmpl.steps.map((step, i) => (
                        <div
                          key={i}
                          style={{
                            fontSize: "11px",
                            color: "#6b7280",
                            padding: "3px 0",
                            borderBottom:
                              i < tmpl.steps.length - 1
                                ? "1px solid #e5e7eb"
                                : "none",
                          }}
                        >
                          {step.delay === 0 ? "מיידי" : `יום ${step.delay}`}:{" "}
                          {step.subject}
                        </div>
                      ))}
                    </div>
                  )}
                </button>
              ))}
            </div>

            <div style={{ display: "flex", gap: "8px" }}>
              <button
                onClick={() =>
                  selectedTemplate && createFromTemplate(selectedTemplate)
                }
                disabled={!selectedTemplate || creating}
                style={{
                  flex: 2,
                  padding: "12px",
                  background:
                    selectedTemplate && !creating ? "#6366f1" : "#e5e7eb",
                  color:
                    selectedTemplate && !creating ? "white" : "#9ca3af",
                  border: "none",
                  borderRadius: "10px",
                  fontWeight: 700,
                  cursor: "pointer",
                  fontSize: "14px",
                }}
              >
                {creating ? "⏳ יוצר..." : "✅ צור סדרה"}
              </button>
              <button
                onClick={() => {
                  setShowCreate(false);
                  setSelectedTemplate(null);
                }}
                style={{
                  flex: 1,
                  padding: "12px",
                  background: "#f3f4f6",
                  color: "#374151",
                  border: "none",
                  borderRadius: "10px",
                  cursor: "pointer",
                }}
              >
                ביטול
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Sequences list */}
      {localSequences.length === 0 ? (
        <div
          style={{
            background: "white",
            borderRadius: "14px",
            border: "1px solid #e5e7eb",
            padding: "48px",
            textAlign: "center",
            color: "#9ca3af",
          }}
        >
          <div style={{ fontSize: "48px", marginBottom: "12px" }}>📧</div>
          <p
            style={{
              fontSize: "15px",
              fontWeight: 600,
              marginBottom: "6px",
            }}
          >
            אין סדרות מייל עדיין
          </p>
          <p style={{ fontSize: "13px" }}>
            צור סדרה ראשונה מהתבניות המוכנות
          </p>
          <button
            onClick={() => setShowCreate(true)}
            style={{
              marginTop: "14px",
              padding: "10px 24px",
              background: "#6366f1",
              color: "white",
              border: "none",
              borderRadius: "10px",
              fontWeight: 600,
              cursor: "pointer",
              fontSize: "13px",
            }}
          >
            + צור סדרה ראשונה
          </button>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          {localSequences.map((seq) => (
            <div
              key={seq.id}
              style={{
                background: "white",
                borderRadius: "14px",
                border: `2px solid ${seq.isActive ? "#bbf7d0" : "#e5e7eb"}`,
                padding: "16px 18px",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                }}
              >
                <div>
                  <div
                    style={{
                      fontWeight: 700,
                      fontSize: "15px",
                      marginBottom: "3px",
                    }}
                  >
                    {seq.name}
                  </div>
                  <div
                    style={{
                      fontSize: "12px",
                      color: "#6b7280",
                      marginBottom: "6px",
                    }}
                  >
                    {seq.steps?.length || 0} מיילים • {seq.logCount} נשלחו •{" "}
                    {triggerLabels[seq.trigger] || seq.trigger}
                  </div>
                  {/* Steps preview */}
                  <div
                    style={{ display: "flex", gap: "4px", flexWrap: "wrap" }}
                  >
                    {(seq.steps || []).map((step, i) => (
                      <span
                        key={i}
                        style={{
                          fontSize: "10px",
                          padding: "2px 8px",
                          background: "#f3f4f6",
                          borderRadius: "8px",
                          color: "#6b7280",
                        }}
                      >
                        {step.delay === 0 ? "מיידי" : `יום ${step.delay}`}
                      </span>
                    ))}
                  </div>
                </div>
                <div
                  style={{
                    display: "flex",
                    gap: "8px",
                    alignItems: "center",
                  }}
                >
                  {/* Active toggle */}
                  <div
                    onClick={() => toggleSequence(seq.id, !seq.isActive)}
                    style={{
                      width: "48px",
                      height: "26px",
                      borderRadius: "13px",
                      background: seq.isActive ? "#22c55e" : "#e5e7eb",
                      cursor: "pointer",
                      position: "relative",
                      transition: "background 0.2s",
                    }}
                  >
                    <div
                      style={{
                        width: "20px",
                        height: "20px",
                        borderRadius: "50%",
                        background: "white",
                        position: "absolute",
                        top: "3px",
                        right: seq.isActive ? "3px" : "25px",
                        transition: "right 0.2s",
                        boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
                      }}
                    />
                  </div>
                  {/* Delete */}
                  <button
                    onClick={() => deleteSequence(seq.id)}
                    style={{
                      padding: "6px",
                      background: "#fef2f2",
                      border: "1px solid #fecaca",
                      borderRadius: "6px",
                      cursor: "pointer",
                      color: "#ef4444",
                      fontSize: "14px",
                    }}
                  >
                    🗑️
                  </button>
                </div>
              </div>
              <div
                style={{
                  marginTop: "10px",
                  padding: "6px 10px",
                  background: seq.isActive ? "#f0fdf4" : "#f9fafb",
                  borderRadius: "6px",
                  fontSize: "11px",
                  fontWeight: 600,
                  color: seq.isActive ? "#166534" : "#9ca3af",
                }}
              >
                {seq.isActive
                  ? "✅ פעיל — שולח מיילים אוטומטית"
                  : "⭕ כבוי"}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Info */}
      <div
        style={{
          background: "#eff6ff",
          border: "1px solid #bfdbfe",
          borderRadius: "12px",
          padding: "14px 16px",
          marginTop: "16px",
          fontSize: "12px",
          color: "#1d4ed8",
          lineHeight: 1.7,
        }}
      >
        💡 <strong>איך זה עובד?</strong>
        <br />
        כל ליד חדש נכנס אוטומטית לסדרת המייל. המיילים נשלחים בפרקי הזמן
        שהגדרת — בלי שתצטרך לעשות כלום!
      </div>
    </div>
  );
}
