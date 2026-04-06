"use client";

import { useState, useEffect } from "react";
import { PasswordChangeForm } from "./PasswordChangeForm";

interface ClientData {
  id: string;
  name: string;
  slug: string;
  phone: string | null;
  email: string;
  primaryColor: string;
  logoUrl: string | null;
  landingPageTitle: string | null;
  seoDescription: string | null;
  greenApiInstanceId: string | null;
  greenApiToken: string | null;
  googleReviewLink: string | null;
  autoReplyActive: boolean;
  pagePublished: boolean;
  industry: string | null;
  plan: string;
}

const TABS = [
  { id: "business", icon: "🏢", label: "פרטי העסק" },
  { id: "whatsapp", icon: "💬", label: "WhatsApp" },
  { id: "facebook", icon: "📘", label: "פייסבוק" },
  { id: "design", icon: "🎨", label: "עיצוב" },
  { id: "page", icon: "🌐", label: "הדף שלי" },
  { id: "notifications", icon: "🔔", label: "התראות" },
];

const COLOR_PRESETS = [
  "#6366f1", "#ec4899", "#f97316",
  "#22c55e", "#3b82f6", "#a855f7",
  "#14b8a6", "#f59e0b", "#1e293b",
  "#ef4444", "#8b5cf6", "#0ea5e9",
];

export function PortalSettingsClient({
  client,
  appUrl,
}: {
  client: ClientData;
  appUrl: string;
}) {
  const [activeTab, setActiveTab] = useState("business");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const [business, setBusiness] = useState({
    name: client.name || "",
    phone: client.phone || "",
    email: client.email || "",
  });

  const [primaryColor, setPrimaryColor] = useState(
    client.primaryColor || "#6366f1"
  );

  const [seo, setSeo] = useState({
    landingPageTitle: client.landingPageTitle || client.name || "",
    seoDescription: client.seoDescription || "",
  });

  const [wa, setWa] = useState({
    instanceId: client.greenApiInstanceId || "",
    token: client.greenApiToken || "",
  });
  const [waStatus, setWaStatus] = useState<
    "connected" | "disconnected" | "error" | null
  >(null);
  const [checkingWa, setCheckingWa] = useState(false);

  // Facebook state
  const [fb, setFb] = useState({ enabled: false, pageId: "", token: "", verifyToken: "" });
  const [fbSaving, setFbSaving] = useState(false);
  const [fbSaved, setFbSaved] = useState(false);
  const [tokenStatus, setTokenStatus] = useState<{
    hasToken?: boolean;
    isValid?: boolean;
    status?: string;
    daysUntilExpiry?: number | null;
    needsRefresh?: boolean;
  } | null>(null);

  useEffect(() => {
    if (activeTab === "facebook") {
      fetch(`/api/clients/${client.id}/meta-token`)
        .then((r) => r.json())
        .then(setTokenStatus)
        .catch(() => {});
    }
  }, [activeTab, client.id]);

  // Domain state
  const [domainData, setDomainData] = useState<{
    subdomain?: string;
    customDomain?: string | null;
    customDomainVerified?: boolean;
    rootDomain?: string;
  } | null>(null);
  const [customDomainInput, setCustomDomainInput] = useState("");
  const [domainSaving, setDomainSaving] = useState(false);
  const [domainError, setDomainError] = useState("");

  useEffect(() => {
    if (activeTab === "page") {
      fetch(`/api/clients/${client.id}/domain`)
        .then((r) => r.json())
        .then(setDomainData)
        .catch(() => {});
    }
  }, [activeTab, client.id]);

  async function save(data: Record<string, unknown>) {
    setSaving(true);
    try {
      const res = await fetch(`/api/clients/${client.id}/quick-update`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Save failed");
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch {
      alert("שגיאה בשמירה — נסה שוב");
    }
    setSaving(false);
  }

  async function checkWhatsApp() {
    if (!wa.instanceId || !wa.token) return;
    setCheckingWa(true);
    try {
      const res = await fetch(
        `https://api.green-api.com/waInstance${wa.instanceId}/getStateInstance/${wa.token}`
      );
      const data = await res.json();
      setWaStatus(
        data.stateInstance === "authorized" ? "connected" : "disconnected"
      );
    } catch {
      setWaStatus("error");
    }
    setCheckingWa(false);
  }

  function SaveButton({ onClick }: { onClick: () => void }) {
    return (
      <button
        onClick={onClick}
        disabled={saving}
        style={{
          padding: "11px 28px",
          background: saved ? "#22c55e" : saving ? "#e5e7eb" : "#6366f1",
          color: saving ? "#9ca3af" : "white",
          border: "none",
          borderRadius: "10px",
          fontWeight: 700,
          cursor: "pointer",
          fontSize: "14px",
          transition: "all 0.2s",
        }}
      >
        {saving ? "⏳ שומר..." : saved ? "✅ נשמר!" : "💾 שמור שינויים"}
      </button>
    );
  }

  return (
    <div style={{ padding: "16px", direction: "rtl", maxWidth: "680px" }}>
      <div style={{ marginBottom: "20px" }}>
        <h1 style={{ fontSize: "20px", fontWeight: 800, margin: 0 }}>
          ⚙️ הגדרות
        </h1>
        <p style={{ fontSize: "13px", color: "#6b7280", margin: "4px 0 0" }}>
          כל הגדרות העסק שלך במקום אחד
        </p>
      </div>

      {/* Tabs */}
      <div
        style={{
          display: "flex",
          gap: "4px",
          background: "#f3f4f6",
          borderRadius: "12px",
          padding: "4px",
          marginBottom: "20px",
          overflowX: "auto",
        }}
      >
        {TABS.map((tab) => (
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
              whiteSpace: "nowrap",
              boxShadow:
                activeTab === tab.id ? "0 1px 4px rgba(0,0,0,0.1)" : "none",
              transition: "all 0.2s",
              textAlign: "center",
            }}
          >
            <div style={{ fontSize: "18px", marginBottom: "2px" }}>
              {tab.icon}
            </div>
            <span style={{ fontSize: "10px" }}>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* TAB — Business */}
      {activeTab === "business" && (
        <div
          style={{
            background: "white",
            borderRadius: "14px",
            border: "1px solid #e5e7eb",
            padding: "20px",
          }}
        >
          <h3
            style={{ fontWeight: 700, marginBottom: "16px", fontSize: "15px" }}
          >
            🏢 פרטי העסק
          </h3>
          {(
            [
              { key: "name", label: "שם העסק *", placeholder: "שם העסק שלך" },
              { key: "phone", label: "טלפון", placeholder: "050-1234567" },
              {
                key: "email",
                label: "מייל",
                placeholder: "you@example.com",
              },
            ] as const
          ).map((f) => (
            <div key={f.key} style={{ marginBottom: "12px" }}>
              <label
                style={{
                  fontSize: "12px",
                  fontWeight: 700,
                  color: "#6b7280",
                  display: "block",
                  marginBottom: "5px",
                }}
              >
                {f.label}
              </label>
              <input
                value={business[f.key]}
                onChange={(e) =>
                  setBusiness((b) => ({ ...b, [f.key]: e.target.value }))
                }
                placeholder={f.placeholder}
                dir={f.key === "email" ? "ltr" : "rtl"}
                style={{
                  width: "100%",
                  padding: "10px 12px",
                  border: "2px solid #e5e7eb",
                  borderRadius: "10px",
                  fontSize: "14px",
                  outline: "none",
                }}
              />
            </div>
          ))}

          {/* Plan + Industry (read-only) */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "10px",
              marginBottom: "16px",
            }}
          >
            <div
              style={{
                background: "#f9fafb",
                borderRadius: "8px",
                padding: "10px 12px",
              }}
            >
              <div
                style={{ fontSize: "11px", color: "#9ca3af", fontWeight: 600 }}
              >
                תוכנית
              </div>
              <div style={{ fontSize: "14px", fontWeight: 700 }}>
                {client.plan === "BASIC"
                  ? "בסיסי"
                  : client.plan === "PRO"
                    ? "פרו"
                    : client.plan}
              </div>
            </div>
            {client.industry && (
              <div
                style={{
                  background: "#f9fafb",
                  borderRadius: "8px",
                  padding: "10px 12px",
                }}
              >
                <div
                  style={{
                    fontSize: "11px",
                    color: "#9ca3af",
                    fontWeight: 600,
                  }}
                >
                  תעשייה
                </div>
                <div style={{ fontSize: "14px", fontWeight: 700 }}>
                  {
                    ({
                      ROOFING: "גגות",
                      ALUMINUM: "אלומיניום",
                      COSMETICS: "קוסמטיקה",
                      CLEANING: "ניקיון",
                      REAL_ESTATE: 'נדל"ן',
                      OTHER: "אחר",
                    } as Record<string, string>)[client.industry] ||
                      client.industry
                  }
                </div>
              </div>
            )}
          </div>

          <SaveButton onClick={() => save(business)} />

          {/* Password change */}
          <div style={{ marginTop: "20px", paddingTop: "20px", borderTop: "1px solid #f3f4f6" }}>
            <PasswordChangeForm slug={client.slug} />
          </div>
        </div>
      )}

      {/* TAB — WhatsApp */}
      {activeTab === "whatsapp" && (
        <div
          style={{
            background: "white",
            borderRadius: "14px",
            border: "1px solid #e5e7eb",
            padding: "20px",
          }}
        >
          <h3
            style={{ fontWeight: 700, marginBottom: "6px", fontSize: "15px" }}
          >
            💬 חיבור WhatsApp
          </h3>
          <p
            style={{
              fontSize: "13px",
              color: "#6b7280",
              marginBottom: "16px",
            }}
          >
            חבר את הוואצאפ שלך לשליחת ��ודעות אוטומטיות
          </p>

          {waStatus && (
            <div
              style={{
                padding: "10px 14px",
                borderRadius: "10px",
                marginBottom: "14px",
                fontSize: "13px",
                fontWeight: 600,
                background:
                  waStatus === "connected" ? "#f0fdf4" : "#fef2f2",
                color: waStatus === "connected" ? "#166534" : "#dc2626",
                border: `1px solid ${waStatus === "connected" ? "#bbf7d0" : "#fecaca"}`,
              }}
            >
              {waStatus === "connected"
                ? "✅ WhatsApp מחובר ופעיל!"
                : "❌ לא מחובר — בדוק את הפרטים"}
            </div>
          )}

          {(
            [
              {
                key: "instanceId",
                label: "Instance ID",
                ph: "7103XXXXXX",
              },
              { key: "token", label: "API Token", ph: "your-token-here" },
            ] as const
          ).map((f) => (
            <div key={f.key} style={{ marginBottom: "12px" }}>
              <label
                style={{
                  fontSize: "12px",
                  fontWeight: 700,
                  color: "#6b7280",
                  display: "block",
                  marginBottom: "5px",
                }}
              >
                {f.label}
              </label>
              <input
                value={wa[f.key]}
                onChange={(e) =>
                  setWa((w) => ({ ...w, [f.key]: e.target.value }))
                }
                placeholder={f.ph}
                style={{
                  width: "100%",
                  padding: "10px 12px",
                  border: "2px solid #e5e7eb",
                  borderRadius: "10px",
                  fontSize: "13px",
                  fontFamily: "monospace",
                  direction: "ltr",
                  outline: "none",
                }}
              />
            </div>
          ))}

          <div style={{ display: "flex", gap: "8px", marginBottom: "14px" }}>
            <button
              onClick={checkWhatsApp}
              disabled={checkingWa || !wa.instanceId}
              style={{
                flex: 1,
                padding: "11px",
                background: "#f3f4f6",
                color: "#374151",
                border: "none",
                borderRadius: "10px",
                fontWeight: 600,
                cursor: "pointer",
                fontSize: "13px",
              }}
            >
              {checkingWa ? "⏳ בודק..." : "🔍 בדוק חיבור"}
            </button>
            <button
              onClick={() =>
                save({
                  greenApiInstanceId: wa.instanceId,
                  greenApiToken: wa.token,
                })
              }
              disabled={saving || !wa.instanceId || !wa.token}
              style={{
                flex: 2,
                padding: "11px",
                background:
                  wa.instanceId && wa.token ? "#6366f1" : "#e5e7eb",
                color: wa.instanceId && wa.token ? "white" : "#9ca3af",
                border: "none",
                borderRadius: "10px",
                fontWeight: 700,
                cursor: "pointer",
                fontSize: "13px",
              }}
            >
              {saved ? "✅ נשמר!" : "💾 שמור"}
            </button>
          </div>

          <div
            style={{
              padding: "12px 14px",
              background: "#fffbeb",
              border: "1px solid #fde68a",
              borderRadius: "10px",
              fontSize: "12px",
              color: "#92400e",
              lineHeight: 1.8,
            }}
          >
            <strong>📋 איך מחברים:</strong>
            <br />
            1. פתח <strong>green-api.com</strong> → הירשם חינם
            <br />
            2. צור Instance → העתק ID + Token
            <br />
            3. הכנס כאן → לחץ &quot;בדוק חיבור&quot;
            <br />
            4. סרוק QR בוואצאפ שלך
          </div>
        </div>
      )}

      {/* TAB — Design */}
      {activeTab === "design" && (
        <div
          style={{
            background: "white",
            borderRadius: "14px",
            border: "1px solid #e5e7eb",
            padding: "20px",
          }}
        >
          <h3
            style={{ fontWeight: 700, marginBottom: "16px", fontSize: "15px" }}
          >
            🎨 עיצוב הדף שלך
          </h3>

          {/* Preview */}
          <div
            style={{
              height: "64px",
              borderRadius: "12px",
              marginBottom: "16px",
              background: `linear-gradient(135deg, ${primaryColor}, ${primaryColor}bb)`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <span style={{ color: "white", fontWeight: 800, fontSize: "16px" }}>
              {business.name || client.name}
            </span>
          </div>

          <label
            style={{
              fontSize: "12px",
              fontWeight: 700,
              color: "#6b7280",
              display: "block",
              marginBottom: "10px",
            }}
          >
            צבע ראשי
          </label>

          <div
            style={{
              display: "flex",
              gap: "8px",
              flexWrap: "wrap",
              marginBottom: "14px",
              alignItems: "center",
            }}
          >
            {COLOR_PRESETS.map((c) => (
              <button
                key={c}
                onClick={() => setPrimaryColor(c)}
                style={{
                  width: "36px",
                  height: "36px",
                  borderRadius: "8px",
                  background: c,
                  border: "none",
                  outline: primaryColor === c ? "3px solid #111" : "none",
                  cursor: "pointer",
                  boxShadow: "0 2px 4px rgba(0,0,0,0.2)",
                  transform: primaryColor === c ? "scale(1.15)" : "scale(1)",
                  transition: "transform 0.15s",
                }}
              />
            ))}
            <input
              type="color"
              value={primaryColor}
              onChange={(e) => setPrimaryColor(e.target.value)}
              style={{
                width: "36px",
                height: "36px",
                border: "none",
                borderRadius: "8px",
                cursor: "pointer",
              }}
              title="צבע מותאם"
            />
          </div>

          <SaveButton onClick={() => save({ primaryColor })} />
        </div>
      )}

      {/* TAB — Page SEO */}
      {activeTab === "page" && (
        <div
          style={{
            background: "white",
            borderRadius: "14px",
            border: "1px solid #e5e7eb",
            padding: "20px",
          }}
        >
          <h3
            style={{ fontWeight: 700, marginBottom: "6px", fontSize: "15px" }}
          >
            🌐 הדף שלי
          </h3>
          <p
            style={{
              fontSize: "13px",
              color: "#6b7280",
              marginBottom: "16px",
            }}
          >
            כתובת + הגדרות SEO לגוגל
          </p>

          {/* URL */}
          <div
            style={{
              background: "#f9fafb",
              borderRadius: "10px",
              padding: "12px 14px",
              marginBottom: "16px",
            }}
          >
            <div
              style={{
                fontSize: "11px",
                color: "#6b7280",
                marginBottom: "4px",
                fontWeight: 600,
              }}
            >
              🔗 הקישור שלך:
            </div>
            <div
              style={{
                fontFamily: "monospace",
                fontSize: "13px",
                color: "#6366f1",
                fontWeight: 700,
                wordBreak: "break-all",
              }}
            >
              {appUrl}/{client.slug}
            </div>
            <div style={{ display: "flex", gap: "6px", marginTop: "8px" }}>
              <button
                onClick={() =>
                  navigator.clipboard.writeText(`${appUrl}/${client.slug}`)
                }
                style={{
                  padding: "4px 12px",
                  background: "#eef2ff",
                  color: "#6366f1",
                  border: "none",
                  borderRadius: "6px",
                  fontSize: "11px",
                  cursor: "pointer",
                }}
              >
                📋 העתק
              </button>
              <a
                href={`/${client.slug}`}
                target="_blank"
                style={{
                  padding: "4px 12px",
                  background: "#f3f4f6",
                  color: "#374151",
                  borderRadius: "6px",
                  fontSize: "11px",
                  textDecoration: "none",
                }}
              >
                👁 צפה
              </a>
            </div>
          </div>

          {/* SEO fields */}
          <div style={{ marginBottom: "12px" }}>
            <label
              style={{
                fontSize: "12px",
                fontWeight: 700,
                color: "#6b7280",
                display: "block",
                marginBottom: "5px",
              }}
            >
              כותרת לגוגל (SEO Title)
            </label>
            <input
              value={seo.landingPageTitle}
              onChange={(e) =>
                setSeo((s) => ({ ...s, landingPageTitle: e.target.value }))
              }
              placeholder="שירותי ניקיון מקצועי — יוסי ניקיון"
              maxLength={60}
              style={{
                width: "100%",
                padding: "10px 12px",
                border: "2px solid #e5e7eb",
                borderRadius: "10px",
                fontSize: "14px",
                direction: "rtl",
                outline: "none",
              }}
            />
            <div
              style={{
                fontSize: "11px",
                color: "#9ca3af",
                marginTop: "3px",
                textAlign: "left",
              }}
            >
              {seo.landingPageTitle.length}/60
            </div>
          </div>

          <div style={{ marginBottom: "16px" }}>
            <label
              style={{
                fontSize: "12px",
                fontWeight: 700,
                color: "#6b7280",
                display: "block",
                marginBottom: "5px",
              }}
            >
              תיאור לגוגל (Meta Description)
            </label>
            <textarea
              value={seo.seoDescription}
              onChange={(e) =>
                setSeo((s) => ({ ...s, seoDescription: e.target.value }))
              }
              placeholder="חברת ניקיון מקצועית עם 10 שנות ניסיון בתל אביב..."
              maxLength={160}
              rows={3}
              style={{
                width: "100%",
                padding: "10px 12px",
                border: "2px solid #e5e7eb",
                borderRadius: "10px",
                fontSize: "13px",
                resize: "none",
                direction: "rtl",
                outline: "none",
                fontFamily: "inherit",
              }}
            />
            <div
              style={{
                fontSize: "11px",
                color: "#9ca3af",
                marginTop: "3px",
                textAlign: "left",
              }}
            >
              {seo.seoDescription.length}/160
            </div>
          </div>

          <SaveButton onClick={() => save(seo)} />

          {/* Domain management */}
          <div
            style={{
              marginTop: "20px",
              paddingTop: "20px",
              borderTop: "1px solid #f3f4f6",
            }}
          >
            <h4
              style={{
                fontWeight: 700,
                fontSize: "14px",
                marginBottom: "12px",
              }}
            >
              🌐 דומיינים
            </h4>

            {/* Subdomain (always active) */}
            <div
              style={{
                background: "#f0fdf4",
                border: "1px solid #bbf7d0",
                borderRadius: "10px",
                padding: "12px 14px",
                marginBottom: "12px",
              }}
            >
              <div
                style={{
                  fontWeight: 700,
                  fontSize: "12px",
                  color: "#166534",
                  marginBottom: "4px",
                }}
              >
                ✅ סאבדומיין (פעיל תמיד):
              </div>
              <div
                style={{
                  fontFamily: "monospace",
                  fontSize: "13px",
                  color: "#6366f1",
                  fontWeight: 700,
                  direction: "ltr",
                  marginBottom: "6px",
                }}
              >
                {domainData?.subdomain ||
                  `${client.slug}.${domainData?.rootDomain || "marketingos.co.il"}`}
              </div>
              <button
                onClick={() =>
                  navigator.clipboard.writeText(
                    domainData?.subdomain ||
                      `${client.slug}.marketingos.co.il`
                  )
                }
                style={{
                  padding: "3px 10px",
                  background: "#dcfce7",
                  color: "#166534",
                  border: "none",
                  borderRadius: "6px",
                  fontSize: "11px",
                  cursor: "pointer",
                }}
              >
                📋 העתק
              </button>
            </div>

            {/* Custom domain */}
            <div
              style={{
                background: "#f9fafb",
                border: "1px solid #e5e7eb",
                borderRadius: "10px",
                padding: "12px 14px",
              }}
            >
              <div
                style={{
                  fontWeight: 700,
                  fontSize: "12px",
                  marginBottom: "4px",
                }}
              >
                🔗 דומיין מותאם אישית (אופציונלי):
              </div>
              <p
                style={{
                  fontSize: "11px",
                  color: "#6b7280",
                  marginBottom: "10px",
                }}
              >
                חבר את הדומיין שלך (yosi.co.il)
              </p>

              {domainData?.customDomain ? (
                <div>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      marginBottom: "8px",
                    }}
                  >
                    <div
                      style={{
                        fontFamily: "monospace",
                        fontSize: "13px",
                        color: "#6366f1",
                      }}
                    >
                      {domainData.customDomain}
                    </div>
                    <span
                      style={{
                        fontSize: "11px",
                        padding: "3px 10px",
                        borderRadius: "10px",
                        fontWeight: 600,
                        background: domainData.customDomainVerified
                          ? "#dcfce7"
                          : "#fef9c3",
                        color: domainData.customDomainVerified
                          ? "#166534"
                          : "#854d0e",
                      }}
                    >
                      {domainData.customDomainVerified
                        ? "✅ פעיל"
                        : "⏳ ממתין"}
                    </span>
                  </div>

                  {!domainData.customDomainVerified && (
                    <div
                      style={{
                        background: "#fffbeb",
                        border: "1px solid #fde68a",
                        borderRadius: "8px",
                        padding: "8px 10px",
                        fontSize: "11px",
                        color: "#92400e",
                        lineHeight: 1.8,
                        marginBottom: "8px",
                        direction: "ltr",
                      }}
                    >
                      <strong>DNS Instructions:</strong>
                      <br />
                      Type: CNAME | Name: @ | Value: cname.vercel-dns.com
                    </div>
                  )}

                  <button
                    onClick={async () => {
                      await fetch(`/api/clients/${client.id}/domain`, {
                        method: "DELETE",
                      });
                      setDomainData((d) =>
                        d
                          ? {
                              ...d,
                              customDomain: null,
                              customDomainVerified: false,
                            }
                          : d
                      );
                    }}
                    style={{
                      padding: "5px 12px",
                      background: "#fef2f2",
                      color: "#dc2626",
                      border: "1px solid #fecaca",
                      borderRadius: "6px",
                      fontSize: "11px",
                      cursor: "pointer",
                    }}
                  >
                    🗑️ הסר דומיין
                  </button>
                </div>
              ) : (
                <div>
                  <div style={{ display: "flex", gap: "8px" }}>
                    <input
                      value={customDomainInput}
                      onChange={(e) => {
                        setCustomDomainInput(e.target.value);
                        setDomainError("");
                      }}
                      placeholder="yosi.co.il"
                      style={{
                        flex: 1,
                        padding: "8px 10px",
                        border: `2px solid ${domainError ? "#ef4444" : "#e5e7eb"}`,
                        borderRadius: "8px",
                        fontSize: "12px",
                        fontFamily: "monospace",
                        direction: "ltr",
                        outline: "none",
                      }}
                    />
                    <button
                      onClick={async () => {
                        if (!customDomainInput) return;
                        setDomainSaving(true);
                        try {
                          const res = await fetch(
                            `/api/clients/${client.id}/domain`,
                            {
                              method: "POST",
                              headers: {
                                "Content-Type": "application/json",
                              },
                              body: JSON.stringify({
                                customDomain: customDomainInput,
                              }),
                            }
                          );
                          const data = await res.json();
                          if (data.ok) {
                            setDomainData((d) =>
                              d
                                ? {
                                    ...d,
                                    customDomain: customDomainInput,
                                    customDomainVerified: false,
                                  }
                                : d
                            );
                            setCustomDomainInput("");
                          } else {
                            setDomainError(data.error || "שגיאה");
                          }
                        } catch {
                          setDomainError("שגיאה — נסה שוב");
                        }
                        setDomainSaving(false);
                      }}
                      disabled={!customDomainInput || domainSaving}
                      style={{
                        padding: "8px 14px",
                        background: customDomainInput
                          ? "#6366f1"
                          : "#e5e7eb",
                        color: customDomainInput ? "white" : "#9ca3af",
                        border: "none",
                        borderRadius: "8px",
                        fontWeight: 600,
                        cursor: "pointer",
                        fontSize: "12px",
                      }}
                    >
                      {domainSaving ? "⏳..." : "+ חבר"}
                    </button>
                  </div>
                  {domainError && (
                    <p
                      style={{
                        fontSize: "11px",
                        color: "#ef4444",
                        marginTop: "4px",
                      }}
                    >
                      {domainError}
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB — Facebook */}
      {activeTab === "facebook" && (
        <div style={{ background: "white", borderRadius: "14px", border: "1px solid #e5e7eb", padding: "20px" }}>
          <h3 style={{ fontWeight: 700, fontSize: "15px", marginBottom: "6px" }}>📘 Facebook Lead Ads</h3>
          <p style={{ fontSize: "13px", color: "#6b7280", marginBottom: "16px" }}>קבל לידים מפייסבוק ישירות למערכת</p>

          {tokenStatus?.hasToken && (
            <div style={{ padding: "10px 14px", borderRadius: "10px", background: tokenStatus.isValid ? "#f0fdf4" : "#fef2f2", border: `1px solid ${tokenStatus.isValid ? "#bbf7d0" : "#fecaca"}`, marginBottom: "14px", fontSize: "13px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span><strong>טוקן:</strong> {tokenStatus.status}{tokenStatus.daysUntilExpiry != null ? ` (${tokenStatus.daysUntilExpiry} ימים)` : ""}</span>
              {tokenStatus.needsRefresh && (
                <button onClick={async () => { const r = await fetch(`/api/clients/${client.id}/meta-token`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "refresh" }) }); const d = await r.json(); if (d.ok) { setTokenStatus((s) => s ? { ...s, status: "✅ רוענן!", needsRefresh: false } : s); } }} style={{ padding: "4px 12px", background: "#f59e0b", color: "white", border: "none", borderRadius: "6px", cursor: "pointer", fontSize: "12px" }}>🔄 רענן</button>
              )}
            </div>
          )}

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px", background: "#f9fafb", borderRadius: "10px", marginBottom: "14px" }}>
            <div>
              <div style={{ fontWeight: 600, fontSize: "14px" }}>הפעל Facebook Leads</div>
              <div style={{ fontSize: "12px", color: "#6b7280" }}>לידים מפייסבוק יכנסו אוטומטית</div>
            </div>
            <div onClick={() => setFb((s) => ({ ...s, enabled: !s.enabled }))} style={{ width: "48px", height: "26px", borderRadius: "13px", background: fb.enabled ? "#1877f2" : "#e5e7eb", cursor: "pointer", position: "relative", transition: "background 0.2s" }}>
              <div style={{ width: "20px", height: "20px", borderRadius: "50%", background: "white", position: "absolute", top: "3px", right: fb.enabled ? "3px" : "25px", transition: "right 0.2s", boxShadow: "0 1px 3px rgba(0,0,0,0.2)" }} />
            </div>
          </div>

          {fb.enabled && (
            <div>
              <div style={{ marginBottom: "12px" }}>
                <label style={{ fontSize: "12px", fontWeight: 700, color: "#6b7280", display: "block", marginBottom: "5px" }}>🔗 Webhook URL</label>
                <div style={{ display: "flex", gap: "8px" }}>
                  <input readOnly value={`${appUrl}/api/webhooks/facebook`} style={{ flex: 1, padding: "8px 12px", border: "1px solid #e5e7eb", borderRadius: "8px", fontSize: "12px", background: "#f9fafb", fontFamily: "monospace", direction: "ltr" }} />
                  <button onClick={() => navigator.clipboard.writeText(`${appUrl}/api/webhooks/facebook`)} style={{ padding: "8px 12px", background: "#6366f1", color: "white", border: "none", borderRadius: "8px", cursor: "pointer", fontSize: "12px" }}>העתק</button>
                </div>
              </div>
              {([
                { key: "pageId", label: "📄 Facebook Page ID", ph: "123456789" },
                { key: "token", label: "🔑 Access Token", ph: "EAAxxxxx...", type: "password" },
                { key: "verifyToken", label: "🛡️ Verify Token", ph: "my-secret-token" },
              ] as const).map((f) => (
                <div key={f.key} style={{ marginBottom: "12px" }}>
                  <label style={{ fontSize: "12px", fontWeight: 700, color: "#6b7280", display: "block", marginBottom: "5px" }}>{f.label}</label>
                  <input type={"type" in f ? f.type : "text"} value={fb[f.key]} onChange={(e) => setFb((s) => ({ ...s, [f.key]: e.target.value }))} placeholder={f.ph} dir="ltr" style={{ width: "100%", padding: "10px 12px", border: "2px solid #e5e7eb", borderRadius: "10px", fontSize: "13px", outline: "none" }} />
                </div>
              ))}
              <div style={{ background: "#eff6ff", border: "1px solid #bfdbfe", borderRadius: "10px", padding: "14px", fontSize: "12px", color: "#1e40af", lineHeight: 1.7 }}>
                <strong>📖 הוראות:</strong><br />
                1. פתח business.facebook.com → הגדרות → Webhooks<br />
                2. הכנס Webhook URL + Verify Token<br />
                3. הירשם לאירוע: leadgen<br />
                4. צור Lead Ad → לידים יכנסו אוטומטית!
              </div>
            </div>
          )}

          <button onClick={async () => {
            setFbSaving(true);
            await fetch(`/api/clients/${client.id}/quick-update`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ facebookLeadsEnabled: fb.enabled, facebookPageId: fb.pageId || undefined }) }).catch(() => {});
            setFbSaving(false);
            setFbSaved(true);
            setTimeout(() => setFbSaved(false), 2500);
          }} disabled={fbSaving} style={{ marginTop: "14px", padding: "10px 24px", background: fbSaved ? "#22c55e" : "#1877f2", color: "white", border: "none", borderRadius: "10px", fontWeight: 700, cursor: "pointer", fontSize: "14px" }}>
            {fbSaving ? "⏳..." : fbSaved ? "✅ נשמר!" : "💾 שמור"}
          </button>
        </div>
      )}

      {/* TAB — Notifications */}
      {activeTab === "notifications" && (
        <div
          style={{
            background: "white",
            borderRadius: "14px",
            border: "1px solid #e5e7eb",
            padding: "20px",
          }}
        >
          <h3
            style={{ fontWeight: 700, marginBottom: "16px", fontSize: "15px" }}
          >
            🔔 התראות
          </h3>

          {[
            {
              label: "התראה על ליד חדש",
              sub: "קבל התראה מיידית לטלפון",
              on: true,
              icon: "📱",
            },
            {
              label: "מייל על ליד חדש",
              sub: "קבל מייל לכל ליד חדש",
              on: false,
              icon: "📧",
            },
            {
              label: "דוח שבועי",
              sub: "סיכום ביצועים כל שני 8:00",
              on: true,
              icon: "📊",
            },
          ].map((n, i) => (
            <div
              key={i}
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "14px 0",
                borderBottom: i < 2 ? "1px solid #f3f4f6" : "none",
              }}
            >
              <div
                style={{ display: "flex", gap: "10px", alignItems: "center" }}
              >
                <span style={{ fontSize: "20px" }}>{n.icon}</span>
                <div>
                  <div style={{ fontWeight: 600, fontSize: "14px" }}>
                    {n.label}
                  </div>
                  <div style={{ fontSize: "12px", color: "#6b7280" }}>
                    {n.sub}
                  </div>
                </div>
              </div>
              <div
                style={{
                  width: "48px",
                  height: "26px",
                  borderRadius: "13px",
                  background: n.on ? "#22c55e" : "#e5e7eb",
                  position: "relative",
                  cursor: "pointer",
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
                    right: n.on ? "3px" : "25px",
                    boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
                  }}
                />
              </div>
            </div>
          ))}

          <div
            style={{
              marginTop: "16px",
              padding: "12px 14px",
              background: "#f0fdf4",
              border: "1px solid #bbf7d0",
              borderRadius: "10px",
              fontSize: "12px",
              color: "#166534",
              lineHeight: 1.7,
            }}
          >
            💡 לקבל התראות push על הטלפון — פתח את הדשבורד בדפדפן ואשר את
            ההרשאה
          </div>
        </div>
      )}
    </div>
  );
}
