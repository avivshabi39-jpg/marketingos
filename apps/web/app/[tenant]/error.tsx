"use client";

export default function TenantError() {
  return (
    <div
      dir="rtl"
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#f9fafb",
        fontFamily: "Arial, sans-serif",
      }}
    >
      <div style={{ textAlign: "center", padding: "32px" }}>
        <p style={{ fontSize: "18px", color: "#6b7280" }}>שגיאה בטעינת הדף. אנא נסה שוב.</p>
      </div>
    </div>
  );
}
