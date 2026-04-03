"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface Props {
  clientId: string;
  clientName: string;
  industry: string | null;
}

const ANIM_CSS = `
@keyframes float {
  0%, 100% { transform: translateY(0px); }
  50% { transform: translateY(-20px); }
}
@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
@keyframes progress {
  0% { width: 0%; }
  100% { width: 100%; }
}
.rocket-float { animation: float 3s ease-in-out infinite; }
.gear-spin { animation: spin 2s linear infinite; }
.progress-bar { animation: progress 3s ease-in-out infinite; }
`;

export function NoPageWelcome({ clientId, clientName, industry }: Props) {
  const [isBuilding, setIsBuilding] = useState(false);
  const [buildMessage, setBuildMessage] = useState("");
  const router = useRouter();

  async function handleBuildPage() {
    setIsBuilding(true);
    setBuildMessage("מנתח את העסק שלך...");

    await new Promise((r) => setTimeout(r, 1000));
    setBuildMessage("יוצר תוכן מותאם...");

    await new Promise((r) => setTimeout(r, 1000));
    setBuildMessage("מעצב את הדף...");

    try {
      const res = await fetch("/api/ai/build-page", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientId,
          description: `עסק בתחום ${industry ?? "כללי"}, שם: ${clientName}`,
        }),
      });
      const data = await res.json();

      if (data.success) {
        setBuildMessage("הדף מוכן! 🎉");
        await new Promise((r) => setTimeout(r, 1500));
        router.refresh();
      } else {
        await applySnapshot();
      }
    } catch {
      await applySnapshot();
    } finally {
      setIsBuilding(false);
    }
  }

  async function applySnapshot() {
    try {
      await fetch("/api/snapshots/apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clientId, snapshotKey: "general" }),
      });
      setBuildMessage("הדף מוכן! 🎉");
      await new Promise((r) => setTimeout(r, 1500));
    } finally {
      router.refresh();
    }
  }

  return (
    <>
      <style>{ANIM_CSS}</style>

      {/* Building overlay */}
      {isBuilding && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.75)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 9999,
          }}
        >
          <div
            className="gear-spin"
            style={{ fontSize: "60px", marginBottom: "24px" }}
          >
            ⚙️
          </div>
          <p style={{ color: "white", fontSize: "20px", fontWeight: 600 }}>
            {buildMessage}
          </p>
          <div
            style={{
              marginTop: "16px",
              width: "200px",
              height: "4px",
              background: "rgba(255,255,255,0.2)",
              borderRadius: "2px",
              overflow: "hidden",
            }}
          >
            <div
              className="progress-bar"
              style={{
                height: "100%",
                background: "#6366f1",
                borderRadius: "2px",
              }}
            />
          </div>
        </div>
      )}

      {/* Full-screen welcome */}
      <div
        dir="rtl"
        style={{
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
          padding: "32px",
          textAlign: "center",
        }}
      >
        <div
          className="rocket-float"
          style={{ fontSize: "80px", marginBottom: "24px" }}
        >
          🚀
        </div>

        <h1
          style={{
            fontSize: "32px",
            fontWeight: 800,
            color: "white",
            marginBottom: "12px",
          }}
        >
          ברוכים הבאים, {clientName}!
        </h1>

        <p
          style={{
            fontSize: "18px",
            color: "rgba(255,255,255,0.85)",
            marginBottom: "40px",
            maxWidth: "480px",
          }}
        >
          בוא נבנה את דף הנחיתה שלך תוך 30 שניות עם AI
        </p>

        <button
          onClick={handleBuildPage}
          disabled={isBuilding}
          style={{
            background: "white",
            color: "#6366f1",
            border: "none",
            borderRadius: "16px",
            padding: "20px 48px",
            fontSize: "20px",
            fontWeight: 700,
            cursor: isBuilding ? "not-allowed" : "pointer",
            boxShadow: "0 20px 40px rgba(0,0,0,0.2)",
            marginBottom: "24px",
            transition: "transform 0.2s",
            opacity: isBuilding ? 0.7 : 1,
          }}
          onMouseEnter={(e) => {
            if (!isBuilding) e.currentTarget.style.transform = "scale(1.05)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = "scale(1)";
          }}
        >
          ✨ בנה את הדף שלי עכשיו
        </button>

        <a
          href={`/admin/clients/${clientId}/builder`}
          style={{
            background: "transparent",
            color: "rgba(255,255,255,0.8)",
            border: "1px solid rgba(255,255,255,0.4)",
            borderRadius: "8px",
            padding: "10px 24px",
            cursor: "pointer",
            textDecoration: "none",
            fontSize: "14px",
          }}
        >
          אני אבנה לבד →
        </a>

        <div
          style={{
            marginTop: "48px",
            display: "flex",
            gap: "24px",
            flexWrap: "wrap",
            justifyContent: "center",
          }}
        >
          {["🎨 עיצוב מקצועי", "📱 מותאם למובייל", "⚡ מוכן תוך שניות", "✏️ ניתן לעריכה"].map(
            (item) => (
              <div
                key={item}
                style={{
                  background: "rgba(255,255,255,0.15)",
                  borderRadius: "8px",
                  padding: "8px 16px",
                  color: "white",
                  fontSize: "14px",
                }}
              >
                {item}
              </div>
            )
          )}
        </div>
      </div>
    </>
  );
}
