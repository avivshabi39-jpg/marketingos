"use client";

import { useState } from "react";

export function N8nSection({
  clientId,
  appUrl,
}: {
  clientId: string;
  appUrl: string;
}) {
  const [copied, setCopied] = useState<string | null>(null);

  function copy(text: string, key: string) {
    navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(null), 2000);
  }

  const webhooks = [
    {
      key: "new-lead",
      name: "🎯 ליד חדש",
      desc: "מופעל כשמגיע ליד חדש",
      url: `${appUrl}/api/webhooks/n8n/new-lead?clientId=${clientId}`,
      tags: ["WhatsApp", "CRM", "Slack"],
    },
    {
      key: "lead-status",
      name: "📊 שינוי סטטוס",
      desc: "מופעל כשמשנים סטטוס ליד",
      url: `${appUrl}/api/webhooks/n8n/update-lead?clientId=${clientId}`,
      tags: ["Google Sheets", "מייל", "Drip"],
    },
    {
      key: "followup",
      name: "🔄 Follow-up",
      desc: "מופעל אחרי followup אוטומטי",
      url: `${appUrl}/api/webhooks/n8n/followup-sent?clientId=${clientId}`,
      tags: ["לוג", "CRM", "סטטיסטיקות"],
    },
  ];

  const templates = [
    { icon: "📱", name: "WhatsApp Follow-up", desc: "הודעות ביום 1 + 3 + 7", level: "קל" },
    { icon: "📊", name: "Google Sheets סנכרון", desc: "כל ליד → שורה בשיט", level: "קל" },
    { icon: "📧", name: "Email Drip", desc: "סדרת 3 מיילים אוטומטית", level: "בינוני" },
    { icon: "🎂", name: "הודעת יום הולדת", desc: "ברכה אוטומטית ללקוחות", level: "בינוני" },
    { icon: "🔔", name: "Slack התראות", desc: "התראה על כל ליד חדש", level: "קל" },
  ];

  return (
    <div style={{ direction: "rtl" }}>
      {/* Banner */}
      <div
        style={{
          background: "linear-gradient(135deg, #ff6b35, #f7931e)",
          borderRadius: "14px",
          padding: "20px",
          color: "white",
          marginBottom: "20px",
        }}
      >
        <div style={{ fontSize: "28px", marginBottom: "8px" }}>🔄</div>
        <div style={{ fontSize: "18px", fontWeight: 800, marginBottom: "4px" }}>
          n8n — אוטומציות מתקדמות
        </div>
        <div style={{ fontSize: "13px", opacity: 0.9 }}>
          חבר את MarketingOS לכל אפליקציה בעולם
        </div>
      </div>

      {/* Quick start */}
      <div
        style={{
          background: "#fffbeb",
          border: "1px solid #fde68a",
          borderRadius: "10px",
          padding: "14px",
          fontSize: "13px",
          lineHeight: 1.7,
          marginBottom: "16px",
        }}
      >
        <strong>3 צעדים להתחיל:</strong>
        <br />
        1. פתח n8n.io → הרשם חינם
        <br />
        2. צור workflow → הוסף Webhook trigger
        <br />
        3. הכנס URL מהרשימה למטה
      </div>

      {/* Webhooks */}
      <div
        style={{
          background: "white",
          borderRadius: "14px",
          border: "1px solid #e5e7eb",
          padding: "20px",
          marginBottom: "16px",
        }}
      >
        <h3 style={{ fontWeight: 700, fontSize: "15px", marginBottom: "12px" }}>
          🔗 Webhook URLs שלך
        </h3>
        {webhooks.map((wh) => (
          <div
            key={wh.key}
            style={{
              padding: "12px",
              border: "1px solid #f3f4f6",
              borderRadius: "10px",
              marginBottom: "8px",
            }}
          >
            <div style={{ fontWeight: 700, fontSize: "14px", marginBottom: "2px" }}>
              {wh.name}
            </div>
            <div style={{ fontSize: "12px", color: "#6b7280", marginBottom: "8px" }}>
              {wh.desc}
            </div>
            <div style={{ display: "flex", gap: "8px", marginBottom: "6px" }}>
              <input
                readOnly
                value={wh.url}
                style={{
                  flex: 1,
                  padding: "6px 10px",
                  border: "1px solid #e5e7eb",
                  borderRadius: "6px",
                  fontSize: "11px",
                  fontFamily: "monospace",
                  direction: "ltr",
                  background: "#f9fafb",
                }}
              />
              <button
                onClick={() => copy(wh.url, wh.key)}
                style={{
                  padding: "6px 12px",
                  background: copied === wh.key ? "#22c55e" : "#6366f1",
                  color: "white",
                  border: "none",
                  borderRadius: "6px",
                  cursor: "pointer",
                  fontSize: "12px",
                }}
              >
                {copied === wh.key ? "✅" : "העתק"}
              </button>
            </div>
            <div style={{ display: "flex", gap: "4px", flexWrap: "wrap" }}>
              {wh.tags.map((t) => (
                <span
                  key={t}
                  style={{
                    fontSize: "10px",
                    background: "#eff6ff",
                    color: "#1d4ed8",
                    padding: "2px 7px",
                    borderRadius: "6px",
                  }}
                >
                  {t}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Templates */}
      <div
        style={{
          background: "white",
          borderRadius: "14px",
          border: "1px solid #e5e7eb",
          padding: "20px",
        }}
      >
        <h3 style={{ fontWeight: 700, fontSize: "15px", marginBottom: "12px" }}>
          📋 תבניות Workflow
        </h3>
        {templates.map((t, i) => (
          <div
            key={i}
            style={{
              display: "flex",
              gap: "10px",
              padding: "10px 0",
              borderBottom: i < templates.length - 1 ? "1px solid #f3f4f6" : "none",
              alignItems: "center",
            }}
          >
            <div style={{ fontSize: "22px", flexShrink: 0 }}>{t.icon}</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700, fontSize: "13px" }}>{t.name}</div>
              <div style={{ fontSize: "12px", color: "#6b7280" }}>{t.desc}</div>
            </div>
            <span
              style={{
                fontSize: "10px",
                padding: "3px 8px",
                borderRadius: "8px",
                background: t.level === "קל" ? "#f0fdf4" : "#fffbeb",
                color: t.level === "קל" ? "#166534" : "#92400e",
                fontWeight: 600,
              }}
            >
              {t.level}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
