"use client";

import * as Sentry from "@sentry/nextjs";
import { useEffect } from "react";

export default function Error({
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
    <div
      style={{
        minHeight: "50vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        direction: "rtl",
      }}
    >
      <div style={{ textAlign: "center" }}>
        <div style={{ fontSize: "48px" }}>⚠️</div>
        <h2 style={{ fontWeight: 700, margin: "12px 0 8px" }}>שגיאה</h2>
        <p style={{ color: "#6b7280", marginBottom: "16px" }}>
          אירעה שגיאה בלתי צפויה
        </p>
        <button
          onClick={reset}
          style={{
            padding: "10px 24px",
            background: "#6366f1",
            color: "white",
            border: "none",
            borderRadius: "8px",
            cursor: "pointer",
            fontWeight: 600,
          }}
        >
          נסה שוב
        </button>
      </div>
    </div>
  );
}
