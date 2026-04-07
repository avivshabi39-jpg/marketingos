"use client";

import { useState } from "react";
import toast from "react-hot-toast";
import { PortalDripClient } from "./PortalDripClient";

interface ClientData {
  id: string;
  name: string;
  autoReplyActive: boolean;
  whatsappTemplate: string | null;
  googleReviewLink: string | null;
  dripEnabled: boolean;
  dripDay1Message: string | null;
  dripDay1Delay: number | null;
  dripDay3Message: string | null;
  dripDay3Delay: number | null;
}

interface AutomationSettings {
  autoReplyActive: boolean;
  whatsappTemplate: string;
  reviewRequestEnabled: boolean;
  googleReviewLink: string;
  weeklyReportEnabled: boolean;
}

export function PortalAutomationsClient({
  client,
  stats,
}: {
  client: ClientData;
  stats: { totalLeads: number; newLeads: number };
}) {
  const [settings, setSettings] = useState<AutomationSettings>({
    autoReplyActive: client.autoReplyActive,
    whatsappTemplate:
      client.whatsappTemplate ||
      `שלום! קיבלנו את פנייתך ל${client.name} ונחזור אליך בהקדם 😊`,
    reviewRequestEnabled: !!client.googleReviewLink,
    googleReviewLink: client.googleReviewLink || "",
    weeklyReportEnabled: true,
  });

  const [saving, setSaving] = useState<string | null>(null);
  const [saved, setSaved] = useState<string | null>(null);
  const [activeSection, setActiveSection] = useState<string | null>(
    "autoreply"
  );

  async function saveSetting(
    key: string,
    updates: Partial<AutomationSettings>
  ) {
    setSaving(key);
    try {
      const apiData: Record<string, unknown> = {};
      if (updates.autoReplyActive !== undefined)
        apiData.autoReplyActive = updates.autoReplyActive;
      if (updates.whatsappTemplate !== undefined)
        apiData.whatsappTemplate = updates.whatsappTemplate;
      if (updates.googleReviewLink !== undefined)
        apiData.googleReviewLink = updates.googleReviewLink;

      await fetch(`/api/clients/${client.id}/quick-update`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(apiData),
      });
      setSettings((prev) => ({ ...prev, ...updates }));
      setSaved(key);
      setTimeout(() => setSaved(null), 2500);
    } catch {
      toast.error("שגיאה בשמירה — נסה שוב");
    }
    setSaving(null);
  }

  const activeCount = [
    settings.autoReplyActive,
    true, // followup always on
    settings.reviewRequestEnabled,
    settings.weeklyReportEnabled,
    true, // drip always on
  ].filter(Boolean).length;

  return (
    <div style={{ padding: "16px", direction: "rtl", maxWidth: "700px" }}>
      {/* Header */}
      <div style={{ marginBottom: "20px" }}>
        <h1 style={{ fontSize: "20px", fontWeight: 800, margin: 0 }}>
          ⚡ האוטומציות שלי
        </h1>
        <p style={{ fontSize: "13px", color: "#6b7280", margin: "4px 0 0" }}>
          המערכת עובדת בשבילך 24/7 גם כשאתה ישן 💤
        </p>
      </div>

      {/* Stats banner */}
      <div
        style={{
          background: "linear-gradient(135deg, #1e293b, #334155)",
          borderRadius: "14px",
          padding: "16px 20px",
          color: "white",
          marginBottom: "20px",
          display: "flex",
          justifyContent: "space-between",
        }}
      >
        {[
          { label: "לידים שקיבלו תגובה", value: stats.totalLeads, icon: "💬" },
          { label: "לידים חדשים", value: stats.newLeads, icon: "🆕" },
          {
            label: "אוטומציות פעילות",
            value: activeCount,
            icon: "⚡",
          },
        ].map((s) => (
          <div key={s.label} style={{ textAlign: "center" }}>
            <div style={{ fontSize: "24px", marginBottom: "2px" }}>
              {s.icon}
            </div>
            <div style={{ fontSize: "22px", fontWeight: 800 }}>{s.value}</div>
            <div style={{ fontSize: "11px", opacity: 0.75 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* AUTOMATION 1 — Auto Reply */}
      <AutoCard
        id="autoreply"
        icon="💬"
        title="חזרה אוטומטית ללידים"
        description="וואצאפ אוטומטי לכל ליד חדש תוך שניות"
        enabled={settings.autoReplyActive}
        color="#22c55e"
        badge="שולח מיידית"
        activeSection={activeSection}
        onSectionToggle={setActiveSection}
        onToggle={() =>
          saveSetting("autoreply", {
            autoReplyActive: !settings.autoReplyActive,
          })
        }
      >
        <div style={{ marginBottom: "10px" }}>
          <label
            style={{
              fontSize: "12px",
              fontWeight: 700,
              color: "#6b7280",
              display: "block",
              marginBottom: "6px",
            }}
          >
            ✏️ הודעת הברכה:
          </label>
          <textarea
            value={settings.whatsappTemplate}
            onChange={(e) =>
              setSettings((s) => ({ ...s, whatsappTemplate: e.target.value }))
            }
            rows={3}
            style={{
              width: "100%",
              padding: "10px 12px",
              border: "2px solid #e5e7eb",
              borderRadius: "10px",
              fontSize: "13px",
              resize: "none",
              direction: "rtl",
              fontFamily: "inherit",
              outline: "none",
              lineHeight: 1.6,
            }}
          />
        </div>

        {/* Quick templates */}
        <div style={{ marginBottom: "12px" }}>
          <div
            style={{ fontSize: "11px", color: "#9ca3af", marginBottom: "6px" }}
          >
            תבניות מוכנות:
          </div>
          <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
            {[
              `שלום! קיבלנו את פנייתך ל${client.name}. נחזור אליך בהקדם 😊`,
              `תודה שפנית! אנחנו ${client.name} ונצור קשר תוך שעה ⚡`,
              `שלום! שמחנו לקבל את פנייתך. נחזור אליך עוד מעט 🙏`,
            ].map((tmpl, i) => (
              <button
                key={i}
                onClick={() =>
                  setSettings((s) => ({ ...s, whatsappTemplate: tmpl }))
                }
                style={{
                  padding: "4px 10px",
                  background: "#f0fdf4",
                  color: "#166534",
                  border: "1px solid #bbf7d0",
                  borderRadius: "8px",
                  fontSize: "11px",
                  cursor: "pointer",
                }}
              >
                תבנית {i + 1}
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={() =>
            saveSetting("autoreply", {
              autoReplyActive: settings.autoReplyActive,
              whatsappTemplate: settings.whatsappTemplate,
            })
          }
          disabled={saving === "autoreply"}
          style={{
            padding: "10px 20px",
            background:
              saved === "autoreply"
                ? "#22c55e"
                : saving === "autoreply"
                  ? "#e5e7eb"
                  : "#6366f1",
            color: saving === "autoreply" ? "#9ca3af" : "white",
            border: "none",
            borderRadius: "10px",
            fontWeight: 700,
            cursor: "pointer",
            fontSize: "13px",
          }}
        >
          {saving === "autoreply"
            ? "⏳ שומר..."
            : saved === "autoreply"
              ? "✅ נשמר!"
              : "💾 שמור הודעה"}
        </button>
      </AutoCard>

      {/* AUTOMATION 2 — Follow-up */}
      <AutoCard
        id="followup"
        icon="🔄"
        title="followup אוטומטי"
        description="חזרה ללידים שלא ענו — ביום הראשון ושלישי"
        enabled={true}
        color="#3b82f6"
        badge="פועל אוטומטי"
        activeSection={activeSection}
        onSectionToggle={setActiveSection}
        onToggle={() => {}}
      >
        <div
          style={{
            background: "#eff6ff",
            border: "1px solid #bfdbfe",
            borderRadius: "10px",
            padding: "12px 14px",
            fontSize: "13px",
            color: "#1d4ed8",
            lineHeight: 1.7,
          }}
        >
          🤖 <strong>אוטומטי לחלוטין:</strong>
          <br />
          • יום 1: &quot;שלום! ראינו שפנית אלינו. מתי נוח לדבר?&quot;
          <br />
          • יום 3: &quot;שלום! רצינו לוודא שקיבלת את מענינו 🙏&quot;
          <br />
          <br />
          <span style={{ fontSize: "11px", color: "#3b82f6" }}>
            * ההודעות נשלחות רק ללידים שלא ענו
          </span>
        </div>
      </AutoCard>

      {/* AUTOMATION 3 — Review Request */}
      <AutoCard
        id="review"
        icon="⭐"
        title="בקשת ביקורת אוטומטית"
        description="שלח בקשת ביקורת גוגל ללידים שנסגרו בהצלחה"
        enabled={settings.reviewRequestEnabled}
        color="#f59e0b"
        badge="לאחר סגירה"
        activeSection={activeSection}
        onSectionToggle={setActiveSection}
        onToggle={() =>
          setSettings((s) => ({
            ...s,
            reviewRequestEnabled: !s.reviewRequestEnabled,
          }))
        }
      >
        <div style={{ marginBottom: "12px" }}>
          <label
            style={{
              fontSize: "12px",
              fontWeight: 700,
              color: "#6b7280",
              display: "block",
              marginBottom: "6px",
            }}
          >
            🔗 קישור לביקורת גוגל שלך:
          </label>
          <input
            value={settings.googleReviewLink}
            onChange={(e) =>
              setSettings((s) => ({ ...s, googleReviewLink: e.target.value }))
            }
            placeholder="https://g.page/r/..."
            style={{
              width: "100%",
              padding: "10px 12px",
              border: "2px solid #e5e7eb",
              borderRadius: "10px",
              fontSize: "13px",
              direction: "ltr",
              fontFamily: "monospace",
              outline: "none",
            }}
          />
          <p
            style={{ fontSize: "11px", color: "#9ca3af", marginTop: "4px" }}
          >
            מצא ב: Google Maps → העסק שלך → שתף → העתק קישור
          </p>
        </div>

        <button
          onClick={() =>
            saveSetting("review", {
              googleReviewLink: settings.googleReviewLink,
            })
          }
          disabled={!settings.googleReviewLink || saving === "review"}
          style={{
            padding: "10px 20px",
            background:
              saved === "review"
                ? "#f59e0b"
                : !settings.googleReviewLink
                  ? "#e5e7eb"
                  : "#6366f1",
            color: !settings.googleReviewLink ? "#9ca3af" : "white",
            border: "none",
            borderRadius: "10px",
            fontWeight: 700,
            cursor: "pointer",
            fontSize: "13px",
          }}
        >
          {saved === "review" ? "✅ נשמר!" : "💾 שמור קישור"}
        </button>
      </AutoCard>

      {/* AUTOMATION 4 — Weekly Report */}
      <AutoCard
        id="report"
        icon="📊"
        title="דוח שבועי אוטומטי"
        description="קבל סיכום ביצועים כל שני בבוקר בשעה 8:00"
        enabled={settings.weeklyReportEnabled}
        color="#8b5cf6"
        badge="כל שני 8:00"
        activeSection={activeSection}
        onSectionToggle={setActiveSection}
        onToggle={() =>
          setSettings((s) => ({
            ...s,
            weeklyReportEnabled: !s.weeklyReportEnabled,
          }))
        }
      >
        <div
          style={{
            background: "#f5f3ff",
            border: "1px solid #ddd6fe",
            borderRadius: "10px",
            padding: "12px 14px",
            fontSize: "13px",
            color: "#6b7280",
            lineHeight: 1.7,
          }}
        >
          📋 <strong>הדוח כולל:</strong>
          <br />
          • מספר לידים החודש
          <br />
          • אחוזי המרה
          <br />
          • לידים שמחכים לטיפול
          <br />• המלצות AI לשיפור
        </div>
      </AutoCard>

      {/* AUTOMATION 5 — WhatsApp Drip */}
      <AutoCard
        id="drip"
        icon="📱"
        title="רצף הודעות WhatsApp"
        description="סדרת הודעות ממוקדת ללידים חדשים"
        enabled={client.dripEnabled}
        color="#ec4899"
        badge="2 הודעות followup"
        activeSection={activeSection}
        onSectionToggle={setActiveSection}
        onToggle={() => {}}
      >
        <PortalDripClient
          clientId={client.id}
          clientName={client.name}
          initialDrip={{
            dripEnabled: client.dripEnabled,
            dripDay1Message: client.dripDay1Message,
            dripDay1Delay: client.dripDay1Delay,
            dripDay3Message: client.dripDay3Message,
            dripDay3Delay: client.dripDay3Delay,
          }}
        />
      </AutoCard>

      {/* Info box */}
      <div
        style={{
          background: "#fffbeb",
          border: "1px solid #fde68a",
          borderRadius: "12px",
          padding: "14px 16px",
          fontSize: "12px",
          color: "#92400e",
          lineHeight: 1.7,
          marginTop: "4px",
        }}
      >
        💡 <strong>טיפ:</strong> הפעל את החזרה האוטומטית ללידים — לקוחות
        שמקבלים תגובה תוך דקות נוטים לסגור פי 3 יותר עסקאות!
      </div>
    </div>
  );
}

/* ─── AutoCard Component ─── */
function AutoCard({
  id,
  icon,
  title,
  description,
  enabled,
  onToggle,
  color,
  badge,
  activeSection,
  onSectionToggle,
  children,
}: {
  id: string;
  icon: string;
  title: string;
  description: string;
  enabled: boolean;
  onToggle: () => void;
  color: string;
  badge?: string;
  activeSection: string | null;
  onSectionToggle: (id: string | null) => void;
  children?: React.ReactNode;
}) {
  const isOpen = activeSection === id;

  return (
    <div
      style={{
        background: enabled ? color + "05" : "white",
        borderRadius: "14px",
        border: `2px solid ${enabled ? color + "40" : "#e5e7eb"}`,
        marginBottom: "12px",
        transition: "all 0.2s",
      }}
    >
      {/* Header */}
      <div
        onClick={() => onSectionToggle(isOpen ? null : id)}
        style={{
          padding: "16px 18px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          cursor: "pointer",
        }}
      >
        <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
          <div
            style={{
              width: "46px",
              height: "46px",
              flexShrink: 0,
              background: color + "15",
              borderRadius: "12px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "24px",
            }}
          >
            {icon}
          </div>
          <div>
            <div
              style={{
                fontWeight: 700,
                fontSize: "15px",
                color: "#111827",
                marginBottom: "2px",
              }}
            >
              {title}
            </div>
            <div style={{ fontSize: "12px", color: "#6b7280" }}>
              {description}
            </div>
            {badge && (
              <div
                style={{
                  display: "inline-block",
                  marginTop: "4px",
                  fontSize: "10px",
                  fontWeight: 700,
                  color: enabled ? color : "#9ca3af",
                  background: enabled ? color + "15" : "#f3f4f6",
                  padding: "2px 8px",
                  borderRadius: "8px",
                }}
              >
                {enabled ? `✅ ${badge}` : "⭕ כבוי"}
              </div>
            )}
          </div>
        </div>

        <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
          <span
            style={{
              fontSize: "12px",
              color: "#9ca3af",
              transition: "transform 0.2s",
              transform: isOpen ? "rotate(180deg)" : "none",
              display: "inline-block",
            }}
          >
            ▼
          </span>
          {/* Toggle */}
          <div
            onClick={(e) => {
              e.stopPropagation();
              onToggle();
            }}
            style={{
              width: "52px",
              height: "28px",
              borderRadius: "14px",
              background: enabled ? color : "#e5e7eb",
              cursor: "pointer",
              position: "relative",
              transition: "background 0.2s",
              flexShrink: 0,
            }}
          >
            <div
              style={{
                width: "22px",
                height: "22px",
                borderRadius: "50%",
                background: "white",
                position: "absolute",
                top: "3px",
                right: enabled ? "3px" : "27px",
                transition: "right 0.2s",
                boxShadow: "0 1px 4px rgba(0,0,0,0.2)",
              }}
            />
          </div>
        </div>
      </div>

      {/* Expandable content */}
      {isOpen && (
        <div
          style={{
            padding: "0 18px 16px",
            borderTop: "1px solid #f3f4f6",
            paddingTop: "14px",
          }}
        >
          {children}
        </div>
      )}
    </div>
  );
}
