"use client";

import * as Sentry from "@sentry/nextjs";
import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html lang="he" dir="rtl">
      <body
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#f9fafb",
          margin: 0,
          padding: "20px",
          fontFamily: "Arial, sans-serif",
        }}
      >
        <div
          style={{
            background: "white",
            borderRadius: "16px",
            padding: "40px",
            textAlign: "center",
            maxWidth: "420px",
            boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
          }}
        >
          <div style={{ fontSize: "64px", marginBottom: "16px" }}>😔</div>
          <h1
            style={{
              fontSize: "22px",
              fontWeight: 800,
              marginBottom: "8px",
              color: "#111827",
            }}
          >
            משהו השתבש
          </h1>
          <p
            style={{
              fontSize: "14px",
              color: "#6b7280",
              lineHeight: 1.7,
              marginBottom: "24px",
            }}
          >
            אירעה שגיאה בלתי צפויה. הצוות שלנו קיבל התראה אוטומטית.
          </p>
          <button
            onClick={reset}
            style={{
              padding: "12px 28px",
              background: "#6366f1",
              color: "white",
              border: "none",
              borderRadius: "10px",
              fontWeight: 700,
              cursor: "pointer",
              fontSize: "15px",
              marginBottom: "12px",
              width: "100%",
            }}
          >
            🔄 נסה שוב
          </button>
          <button
            onClick={() => (window.location.href = "/")}
            style={{
              padding: "12px 28px",
              background: "#f3f4f6",
              color: "#374151",
              border: "none",
              borderRadius: "10px",
              fontWeight: 600,
              cursor: "pointer",
              fontSize: "14px",
              width: "100%",
            }}
          >
            ← חזור לדף הבית
          </button>
          {error.digest && (
            <p
              style={{
                fontSize: "10px",
                color: "#d1d5db",
                marginTop: "12px",
                fontFamily: "monospace",
              }}
            >
              {error.digest}
            </p>
          )}
        </div>
      </body>
    </html>
  );
}
