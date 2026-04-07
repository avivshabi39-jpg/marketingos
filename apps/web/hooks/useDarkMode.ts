"use client";

import { useState, useEffect } from "react";
import { trackDarkModeToggled } from "@/lib/analytics";

export function useDarkMode() {
  const [isDark, setIsDark] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const stored = localStorage.getItem("marketingos-dark-mode");
    if (stored === "true") {
      setIsDark(true);
      document.documentElement.classList.add("dark");
    } else if (stored === null) {
      const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      setIsDark(prefersDark);
      if (prefersDark) document.documentElement.classList.add("dark");
    }
  }, []);

  function toggle() {
    const next = !isDark;
    setIsDark(next);
    localStorage.setItem("marketingos-dark-mode", String(next));
    trackDarkModeToggled(next);
    if (next) document.documentElement.classList.add("dark");
    else document.documentElement.classList.remove("dark");
  }

  return { isDark, toggle, mounted };
}
