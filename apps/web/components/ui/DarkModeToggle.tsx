"use client";

import { useDarkMode } from "@/hooks/useDarkMode";
import { Sun, Moon } from "lucide-react";

export function DarkModeToggle({ size = "md" }: { size?: "sm" | "md" }) {
  const { isDark, toggle, mounted } = useDarkMode();

  if (!mounted) return <div style={{ width: size === "sm" ? 32 : 40, height: size === "sm" ? 32 : 40 }} />;

  const iconSize = size === "sm" ? 16 : 18;

  return (
    <button
      onClick={toggle}
      title={isDark ? "מצב בהיר" : "מצב כהה"}
      className="flex items-center justify-center rounded-xl hover:bg-slate-100 transition-colors text-slate-500 hover:text-slate-700"
      style={{
        width: size === "sm" ? 32 : 40,
        height: size === "sm" ? 32 : 40,
      }}
    >
      {isDark ? <Sun size={iconSize} /> : <Moon size={iconSize} />}
    </button>
  );
}
