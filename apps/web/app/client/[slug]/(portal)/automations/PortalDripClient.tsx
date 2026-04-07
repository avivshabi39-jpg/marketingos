"use client";

import { useState } from "react";
import toast from "react-hot-toast";

interface DripSettings {
  dripEnabled: boolean;
  dripDay1Message: string | null;
  dripDay1Delay: number | null;
  dripDay3Message: string | null;
  dripDay3Delay: number | null;
}

export function PortalDripClient({
  clientId,
  clientName,
  initialDrip,
}: {
  clientId: string;
  clientName: string;
  initialDrip: DripSettings;
}) {
  const [enabled, setEnabled] = useState(initialDrip.dripEnabled);
  const [day1, setDay1] = useState({
    message:
      initialDrip.dripDay1Message ||
      `שלום! ראינו שפנית אלינו ב${clientName}.\nמתי נוח לך לדבר? 📞`,
    delay: initialDrip.dripDay1Delay || 24,
  });
  const [day3, setDay3] = useState({
    message:
      initialDrip.dripDay3Message ||
      `שלום! רצינו לוודא שקיבלת את מענינו 🙏\nנשמח לעזור בכל שאלה!`,
    delay: initialDrip.dripDay3Delay || 72,
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  async function saveDrip() {
    setSaving(true);
    try {
      await fetch(`/api/clients/${clientId}/drip`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          dripEnabled: enabled,
          dripDay1Message: day1.message,
          dripDay1Delay: day1.delay,
          dripDay3Message: day3.message,
          dripDay3Delay: day3.delay,
        }),
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch {
      toast.error("שגיאה בשמירה");
    }
    setSaving(false);
  }

  return (
    <div style={{ direction: "rtl" }}>
      {/* Enable toggle */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "16px",
          padding: "12px 14px",
          background: enabled ? "#f0fdf4" : "#f9fafb",
          borderRadius: "10px",
          border: `1px solid ${enabled ? "#bbf7d0" : "#e5e7eb"}`,
        }}
      >
        <div>
          <div style={{ fontWeight: 700, fontSize: "14px" }}>
            {enabled ? "✅ רצף פעיל" : "⭕ רצף כבוי"}
          </div>
          <div style={{ fontSize: "12px", color: "#6b7280" }}>
            {enabled
              ? "הודעות נשלחות אוטומטית ללידים"
              : "הפעל כדי לשלוח followup אוטומטי"}
          </div>
        </div>
        <div
          onClick={() => setEnabled(!enabled)}
          style={{
            width: "52px",
            height: "28px",
            borderRadius: "14px",
            background: enabled ? "#22c55e" : "#e5e7eb",
            cursor: "pointer",
            position: "relative",
            transition: "background 0.2s",
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

      {/* Step 1 */}
      <div
        style={{
          marginBottom: "14px",
          padding: "14px",
          background: "white",
          borderRadius: "12px",
          border: "2px solid rgba(59,130,246,0.12)",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            marginBottom: "10px",
          }}
        >
          <div
            style={{
              width: "28px",
              height: "28px",
              borderRadius: "50%",
              background: "#3b82f6",
              color: "white",
              fontWeight: 800,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "14px",
              flexShrink: 0,
            }}
          >
            1
          </div>
          <div style={{ fontWeight: 700, fontSize: "14px" }}>הודעה ראשונה</div>
          <select
            value={day1.delay}
            onChange={(e) =>
              setDay1((d) => ({ ...d, delay: Number(e.target.value) }))
            }
            style={{
              marginRight: "auto",
              padding: "4px 8px",
              border: "1px solid #e5e7eb",
              borderRadius: "6px",
              fontSize: "12px",
            }}
          >
            <option value={1}>אחרי שעה</option>
            <option value={6}>אחרי 6 שעות</option>
            <option value={24}>אחרי יום</option>
            <option value={48}>אחרי יומיים</option>
          </select>
        </div>
        <textarea
          value={day1.message}
          onChange={(e) => setDay1((d) => ({ ...d, message: e.target.value }))}
          rows={3}
          style={{
            width: "100%",
            padding: "10px",
            border: "1px solid #e5e7eb",
            borderRadius: "8px",
            fontSize: "13px",
            resize: "none",
            direction: "rtl",
            fontFamily: "inherit",
            outline: "none",
            lineHeight: 1.6,
          }}
        />
      </div>

      {/* Arrow */}
      <div
        style={{
          textAlign: "center",
          fontSize: "20px",
          marginBottom: "10px",
          color: "#9ca3af",
        }}
      >
        ↓
      </div>

      {/* Step 2 */}
      <div
        style={{
          marginBottom: "16px",
          padding: "14px",
          background: "white",
          borderRadius: "12px",
          border: "2px solid rgba(245,158,11,0.12)",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            marginBottom: "10px",
          }}
        >
          <div
            style={{
              width: "28px",
              height: "28px",
              borderRadius: "50%",
              background: "#f59e0b",
              color: "white",
              fontWeight: 800,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "14px",
              flexShrink: 0,
            }}
          >
            2
          </div>
          <div style={{ fontWeight: 700, fontSize: "14px" }}>הודעה שנייה</div>
          <select
            value={day3.delay}
            onChange={(e) =>
              setDay3((d) => ({ ...d, delay: Number(e.target.value) }))
            }
            style={{
              marginRight: "auto",
              padding: "4px 8px",
              border: "1px solid #e5e7eb",
              borderRadius: "6px",
              fontSize: "12px",
            }}
          >
            <option value={48}>אחרי יומיים</option>
            <option value={72}>אחרי 3 ימים</option>
            <option value={120}>אחרי 5 ימים</option>
            <option value={168}>אחרי שבוע</option>
          </select>
        </div>
        <textarea
          value={day3.message}
          onChange={(e) => setDay3((d) => ({ ...d, message: e.target.value }))}
          rows={3}
          style={{
            width: "100%",
            padding: "10px",
            border: "1px solid #e5e7eb",
            borderRadius: "8px",
            fontSize: "13px",
            resize: "none",
            direction: "rtl",
            fontFamily: "inherit",
            outline: "none",
            lineHeight: 1.6,
          }}
        />
      </div>

      {/* Save */}
      <button
        onClick={saveDrip}
        disabled={saving}
        style={{
          width: "100%",
          padding: "13px",
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
        {saving ? "⏳ שומר..." : saved ? "✅ נשמר!" : "💾 שמור הגדרות"}
      </button>
    </div>
  );
}
