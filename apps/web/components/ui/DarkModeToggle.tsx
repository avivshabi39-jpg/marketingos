"use client";

import { useDarkMode } from "@/hooks/useDarkMode";

export function DarkModeToggle({ size = "md" }: { size?: "sm" | "md" }) {
  const { isDark, toggle, mounted } = useDarkMode();

  if (!mounted) return <div style={{ width: size === "sm" ? 32 : 38, height: size === "sm" ? 32 : 38 }} />;

  return (
    <button
      onClick={toggle}
      title={isDark ? "מצב בהיר" : "מצב כהה"}
      style={{
        background: "none",
        border: "none",
        cursor: "pointer",
        fontSize: size === "sm" ? "16px" : "20px",
        padding: size === "sm" ? "4px" : "6px",
        borderRadius: "8px",
        lineHeight: 1,
      }}
    >
      {isDark ? "☀️" : "🌙"}
    </button>
  );
}
