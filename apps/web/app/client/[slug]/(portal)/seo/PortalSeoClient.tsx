"use client";

import { useState, useEffect } from "react";

interface GscStep {
  id: number;
  title: string;
  description: string;
  url: string | null;
  action: string | null;
}

interface GscData {
  siteUrl: string;
  sitemapUrl: string;
  pagePublished: boolean;
  steps: GscStep[];
  tips: string[];
}

interface SeoScore {
  score: number;
  grade: string;
  checks: { name: string; passed: boolean; impact: string; tip: string }[];
  topTips: string[];
}

interface ClientData {
  id: string;
  name: string;
  slug: string;
  pagePublished: boolean;
  customDomain: string | null;
  customDomainVerified: boolean;
  landingPageTitle: string | null;
  seoDescription: string | null;
}

export function PortalSeoClient({
  client,
  appUrl,
}: {
  client: ClientData;
  appUrl: string;
}) {
  const [gscData, setGscData] = useState<GscData | null>(null);
  const [seoScore, setSeoScore] = useState<SeoScore | null>(null);
  const [loading, setLoading] = useState(true);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  const [verificationTag, setVerificationTag] = useState("");
  const [savingTag, setSavingTag] = useState(false);
  const [activeTab, setActiveTab] = useState<"gsc" | "score" | "tips">("gsc");

  useEffect(() => {
    Promise.all([
      fetch(`/api/clients/${client.id}/gsc`).then((r) => r.json()),
      fetch(`/api/clients/${client.id}/seo-score`).then((r) => r.json()),
    ])
      .then(([gsc, score]) => {
        setGscData(gsc);
        setSeoScore(score);
        setLoading(false);
      })
      .catch(() => setLoading(false));

    try {
      const saved = localStorage.getItem(`gsc-steps-${client.id}`);
      if (saved) setCompletedSteps(JSON.parse(saved));
    } catch {}
  }, [client.id]);

  function toggleStep(stepId: number) {
    const updated = completedSteps.includes(stepId)
      ? completedSteps.filter((s) => s !== stepId)
      : [...completedSteps, stepId];
    setCompletedSteps(updated);
    localStorage.setItem(
      `gsc-steps-${client.id}`,
      JSON.stringify(updated)
    );
  }

  async function saveVerificationTag() {
    if (!verificationTag.trim()) return;
    setSavingTag(true);
    await fetch(`/api/clients/${client.id}/gsc`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ verificationTag }),
    }).catch(() => {});
    setSavingTag(false);
  }

  if (loading) {
    return (
      <div
        style={{ padding: "40px", textAlign: "center", color: "#6b7280" }}
      >
        <div style={{ fontSize: "40px", marginBottom: "12px" }}>🔍</div>
        <p>טוען נתוני SEO...</p>
      </div>
    );
  }

  const completedCount = completedSteps.length;
  const totalSteps = gscData?.steps?.length || 5;

  return (
    <div style={{ padding: "16px", direction: "rtl", maxWidth: "700px" }}>
      {/* Header */}
      <div style={{ marginBottom: "20px" }}>
        <h1 style={{ fontSize: "20px", fontWeight: 800, margin: 0 }}>
          🔍 SEO וגוגל
        </h1>
        <p style={{ fontSize: "13px", color: "#6b7280", margin: "4px 0 0" }}>
          שיפור הדירוג שלך בגוגל
        </p>
      </div>

      {/* SEO Score banner */}
      {seoScore && (
        <div
          style={{
            background:
              seoScore.score >= 75
                ? "linear-gradient(135deg, #22c55e, #16a34a)"
                : seoScore.score >= 50
                  ? "linear-gradient(135deg, #f59e0b, #d97706)"
                  : "linear-gradient(135deg, #ef4444, #dc2626)",
            borderRadius: "14px",
            padding: "16px 20px",
            color: "white",
            marginBottom: "20px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div>
            <div
              style={{ fontSize: "14px", opacity: 0.9, marginBottom: "2px" }}
            >
              ציון SEO שלך
            </div>
            <div style={{ fontSize: "32px", fontWeight: 900 }}>
              {seoScore.score}% — דרגה {seoScore.grade}
            </div>
            <div
              style={{ fontSize: "12px", opacity: 0.85, marginTop: "4px" }}
            >
              {seoScore.score >= 75
                ? "🎉 מצוין! הדף שלך מאוד ידידותי לגוגל"
                : seoScore.score >= 50
                  ? "💪 טוב, אבל יש מה לשפר"
                  : "⚠️ דרוש שיפור — עקוב אחרי הטיפים"}
            </div>
          </div>
          <div style={{ fontSize: "56px", fontWeight: 900, opacity: 0.3 }}>
            {seoScore.grade}
          </div>
        </div>
      )}

      {/* Tabs */}
      <div
        style={{
          display: "flex",
          background: "#f3f4f6",
          borderRadius: "10px",
          padding: "3px",
          marginBottom: "16px",
          gap: "3px",
        }}
      >
        {(
          [
            { id: "gsc", label: "📊 Google Search Console" },
            { id: "score", label: "✅ בדיקות SEO" },
            { id: "tips", label: "💡 טיפים" },
          ] as const
        ).map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              flex: 1,
              padding: "8px 4px",
              background: activeTab === tab.id ? "white" : "transparent",
              border: "none",
              borderRadius: "8px",
              cursor: "pointer",
              fontSize: "11px",
              fontWeight: activeTab === tab.id ? 700 : 400,
              color: activeTab === tab.id ? "#6366f1" : "#6b7280",
              boxShadow:
                activeTab === tab.id
                  ? "0 1px 4px rgba(0,0,0,0.1)"
                  : "none",
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* TAB 1 — GSC Steps */}
      {activeTab === "gsc" && (
        <div>
          {/* Progress */}
          <div
            style={{
              background: "white",
              borderRadius: "12px",
              border: "1px solid #e5e7eb",
              padding: "16px",
              marginBottom: "16px",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                marginBottom: "8px",
                fontSize: "13px",
              }}
            >
              <span style={{ fontWeight: 600 }}>התקדמות הגדרת GSC</span>
              <span style={{ fontWeight: 700, color: "#6366f1" }}>
                {completedCount}/{totalSteps} שלבים
              </span>
            </div>
            <div
              style={{
                height: "8px",
                background: "#f3f4f6",
                borderRadius: "4px",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  height: "100%",
                  width: `${(completedCount / totalSteps) * 100}%`,
                  background:
                    "linear-gradient(135deg, #6366f1, #8b5cf6)",
                  borderRadius: "4px",
                  transition: "width 0.5s",
                }}
              />
            </div>
          </div>

          {/* Steps */}
          {gscData?.steps?.map((step) => {
            const isDone = completedSteps.includes(step.id);
            return (
              <div
                key={step.id}
                style={{
                  background: isDone ? "#f0fdf4" : "white",
                  borderRadius: "12px",
                  border: `1px solid ${isDone ? "#bbf7d0" : "#e5e7eb"}`,
                  padding: "14px 16px",
                  marginBottom: "10px",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    gap: "12px",
                    alignItems: "flex-start",
                  }}
                >
                  <button
                    onClick={() => toggleStep(step.id)}
                    style={{
                      width: "32px",
                      height: "32px",
                      flexShrink: 0,
                      borderRadius: "50%",
                      background: isDone ? "#22c55e" : "#f3f4f6",
                      border: "none",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "14px",
                      fontWeight: 800,
                      color: isDone ? "white" : "#6b7280",
                    }}
                  >
                    {isDone ? "✓" : step.id}
                  </button>

                  <div style={{ flex: 1 }}>
                    <div
                      style={{
                        fontWeight: 700,
                        fontSize: "14px",
                        color: isDone ? "#166534" : "#111827",
                        marginBottom: "4px",
                        textDecoration: isDone ? "line-through" : "none",
                      }}
                    >
                      {step.title}
                    </div>
                    <div
                      style={{
                        fontSize: "12px",
                        color: "#6b7280",
                        lineHeight: 1.6,
                        whiteSpace: "pre-wrap",
                      }}
                    >
                      {step.description}
                    </div>

                    {step.url && (
                      <a
                        href={step.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          display: "inline-block",
                          marginTop: "8px",
                          padding: "5px 14px",
                          background: "#6366f1",
                          color: "white",
                          borderRadius: "6px",
                          textDecoration: "none",
                          fontSize: "12px",
                          fontWeight: 600,
                        }}
                      >
                        {step.action} ↗
                      </a>
                    )}

                    {step.id === 3 && (
                      <div style={{ marginTop: "10px" }}>
                        <input
                          value={verificationTag}
                          onChange={(e) =>
                            setVerificationTag(e.target.value)
                          }
                          placeholder='<meta name="google-site-verification" content="...">'
                          style={{
                            width: "100%",
                            padding: "8px 10px",
                            border: "1px solid #e5e7eb",
                            borderRadius: "8px",
                            fontSize: "11px",
                            fontFamily: "monospace",
                            direction: "ltr",
                            marginBottom: "6px",
                            outline: "none",
                          }}
                        />
                        <button
                          onClick={saveVerificationTag}
                          disabled={!verificationTag || savingTag}
                          style={{
                            padding: "6px 14px",
                            background: verificationTag
                              ? "#6366f1"
                              : "#e5e7eb",
                            color: verificationTag ? "white" : "#9ca3af",
                            border: "none",
                            borderRadius: "6px",
                            fontSize: "12px",
                            cursor: "pointer",
                          }}
                        >
                          {savingTag ? "⏳..." : "💾 שמור תג"}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}

          {completedCount === totalSteps && (
            <div
              style={{
                background:
                  "linear-gradient(135deg, #22c55e, #16a34a)",
                borderRadius: "12px",
                padding: "16px",
                color: "white",
                textAlign: "center",
              }}
            >
              <div style={{ fontSize: "32px", marginBottom: "8px" }}>
                🎉
              </div>
              <div style={{ fontWeight: 800, fontSize: "16px" }}>
                כל השלבים הושלמו!
              </div>
              <div
                style={{
                  fontSize: "13px",
                  opacity: 0.9,
                  marginTop: "4px",
                }}
              >
                גוגל יאנדקס את הדף שלך תוך 24-72 שעות
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 2 — SEO Checks */}
      {activeTab === "score" && seoScore && (
        <div
          style={{
            background: "white",
            borderRadius: "14px",
            border: "1px solid #e5e7eb",
            padding: "20px",
          }}
        >
          <div
            style={{ fontWeight: 700, fontSize: "15px", marginBottom: "14px" }}
          >
            ✅ בדיקות SEO (
            {seoScore.checks.filter((c) => c.passed).length}/
            {seoScore.checks.length})
          </div>

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "8px",
            }}
          >
            {seoScore.checks.map((check, i) => (
              <div
                key={i}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "10px 12px",
                  background: check.passed ? "#f0fdf4" : "#fef2f2",
                  borderRadius: "8px",
                  border: `1px solid ${check.passed ? "#bbf7d0" : "#fecaca"}`,
                }}
              >
                <div
                  style={{
                    display: "flex",
                    gap: "8px",
                    alignItems: "center",
                  }}
                >
                  <span>{check.passed ? "✅" : "❌"}</span>
                  <div>
                    <div
                      style={{
                        fontSize: "13px",
                        fontWeight: 600,
                        color: check.passed ? "#166534" : "#dc2626",
                      }}
                    >
                      {check.name}
                    </div>
                    {!check.passed && (
                      <div
                        style={{ fontSize: "11px", color: "#6b7280" }}
                      >
                        {check.tip}
                      </div>
                    )}
                  </div>
                </div>
                <span
                  style={{
                    fontSize: "10px",
                    padding: "2px 8px",
                    borderRadius: "8px",
                    fontWeight: 700,
                    background:
                      check.impact === "high"
                        ? "#fef2f2"
                        : check.impact === "medium"
                          ? "#fffbeb"
                          : "#f3f4f6",
                    color:
                      check.impact === "high"
                        ? "#dc2626"
                        : check.impact === "medium"
                          ? "#92400e"
                          : "#6b7280",
                  }}
                >
                  {check.impact === "high"
                    ? "גבוה"
                    : check.impact === "medium"
                      ? "בינוני"
                      : "נמוך"}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3 — Tips */}
      {activeTab === "tips" && (
        <div>
          {gscData?.tips && gscData.tips.length > 0 && (
            <div
              style={{
                background: "white",
                borderRadius: "14px",
                border: "1px solid #e5e7eb",
                padding: "20px",
                marginBottom: "14px",
              }}
            >
              <div
                style={{
                  fontWeight: 700,
                  fontSize: "15px",
                  marginBottom: "12px",
                }}
              >
                💡 טיפים לדף שלך
              </div>
              {gscData.tips.map((tip, i) => (
                <div
                  key={i}
                  style={{
                    padding: "10px 12px",
                    background: tip.startsWith("✅")
                      ? "#f0fdf4"
                      : tip.startsWith("⚠️")
                        ? "#fef9c3"
                        : "#eff6ff",
                    borderRadius: "8px",
                    marginBottom: "6px",
                    fontSize: "13px",
                    lineHeight: 1.6,
                  }}
                >
                  {tip}
                </div>
              ))}
            </div>
          )}

          <div
            style={{
              background: "white",
              borderRadius: "14px",
              border: "1px solid #e5e7eb",
              padding: "20px",
            }}
          >
            <div
              style={{
                fontWeight: 700,
                fontSize: "15px",
                marginBottom: "12px",
              }}
            >
              🚀 טיפים לשיפור דירוג
            </div>
            {[
              {
                icon: "🔗",
                tip: "שתף את הדף בפייסבוק ואינסטגרם — לינקים חיצוניים מחזקים SEO",
              },
              {
                icon: "⭐",
                tip: "בקש מלקוחות ביקורות גוגל — הן משפיעות על דירוג",
              },
              {
                icon: "📝",
                tip: "עדכן את הדף לפחות פעם בחודש — גוגל אוהב תוכן חדש",
              },
              {
                icon: "📱",
                tip: "הדף שלך רספונסיבי אוטומטית — זה חשוב מאוד לגוגל",
              },
              {
                icon: "⚡",
                tip: "מהירות הדף גבוהה — גוגל מעדיף דפים מהירים",
              },
              {
                icon: "🗺️",
                tip: "הוסף את העסק ל-Google My Business — מגביר חשיפה מקומית",
              },
            ].map((item, i) => (
              <div
                key={i}
                style={{
                  display: "flex",
                  gap: "10px",
                  alignItems: "flex-start",
                  padding: "10px 0",
                  borderBottom: i < 5 ? "1px solid #f3f4f6" : "none",
                }}
              >
                <span style={{ fontSize: "18px", flexShrink: 0 }}>
                  {item.icon}
                </span>
                <span
                  style={{
                    fontSize: "13px",
                    color: "#374151",
                    lineHeight: 1.6,
                  }}
                >
                  {item.tip}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
