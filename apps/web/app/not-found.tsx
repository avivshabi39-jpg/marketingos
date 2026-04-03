"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function NotFound() {
  const router = useRouter();
  const [dest, setDest] = useState("/admin/login");
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    fetch("/api/users/me")
      .then((r) => {
        if (r.ok) setDest("/admin/dashboard");
        setChecking(false);
      })
      .catch(() => setChecking(false));
  }, []);

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        background: "linear-gradient(135deg, #1e1b4b 0%, #312e81 100%)",
        color: "white",
        direction: "rtl",
        textAlign: "center",
        padding: "32px",
      }}
    >
      <div style={{ fontSize: "80px", marginBottom: "16px" }}>🔍</div>
      <h1 style={{ fontSize: "48px", fontWeight: 800, margin: 0 }}>404</h1>
      <h2 style={{ fontSize: "24px", margin: "8px 0 12px", opacity: 0.9 }}>
        הדף לא נמצא
      </h2>
      <p style={{ opacity: 0.7, marginBottom: "32px" }}>
        הדף שחיפשת לא קיים או הוסר
      </p>
      <button
        onClick={() => router.push(dest)}
        disabled={checking}
        style={{
          background: "white",
          color: "#312e81",
          border: "none",
          borderRadius: "12px",
          padding: "14px 32px",
          fontSize: "16px",
          fontWeight: 700,
          cursor: checking ? "wait" : "pointer",
          opacity: checking ? 0.7 : 1,
        }}
      >
        {checking
          ? "..."
          : dest === "/admin/dashboard"
          ? "→ חזור לדשבורד"
          : "→ כניסה למערכת"}
      </button>
    </div>
  );
}
