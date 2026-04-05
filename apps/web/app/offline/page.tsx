"use client";

export default function OfflinePage() {
  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        background: "#f9fafb",
        direction: "rtl",
        padding: "20px",
      }}
    >
      <div
        style={{
          background: "white",
          borderRadius: "16px",
          padding: "40px",
          textAlign: "center",
          maxWidth: "400px",
          boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
        }}
      >
        <div style={{ fontSize: "64px", marginBottom: "16px" }}>📡</div>
        <h1
          style={{
            fontSize: "22px",
            fontWeight: 800,
            marginBottom: "8px",
            color: "#111827",
          }}
        >
          אין חיבור לאינטרנט
        </h1>
        <p
          style={{
            fontSize: "14px",
            color: "#6b7280",
            lineHeight: 1.7,
            marginBottom: "24px",
          }}
        >
          נראה שאתה לא מחובר לאינטרנט. המידע האחרון שנטען זמין לצפייה.
        </p>
        <button
          onClick={() => window.location.reload()}
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
          onClick={() => window.history.back()}
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
          ← חזור
        </button>
        <p style={{ fontSize: "11px", color: "#9ca3af", marginTop: "16px" }}>
          MarketingOS — עובד גם offline
        </p>
      </div>
    </div>
  );
}
