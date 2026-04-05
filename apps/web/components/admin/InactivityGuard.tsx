"use client";

import { useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";

const INACTIVITY_MS = 30 * 60 * 1000; // 30 minutes
const WARNING_BEFORE_MS = 2 * 60 * 1000; // Warn 2 min before

export function InactivityGuard() {
  const router = useRouter();
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>();
  const warningRef = useRef<ReturnType<typeof setTimeout>>();

  const logout = useCallback(async () => {
    await fetch("/api/auth/logout", { method: "POST" }).catch(() => {});
    router.push("/admin/login?reason=inactivity");
  }, [router]);

  const resetTimer = useCallback(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    if (warningRef.current) clearTimeout(warningRef.current);

    warningRef.current = setTimeout(() => {
      const stay = window.confirm(
        "לא היתה פעילות ב-28 דקות האחרונות.\nהאם להמשיך את הסשן?"
      );
      if (stay) {
        resetTimer();
        fetch("/api/auth/refresh", { method: "POST" }).catch(() => {});
      }
    }, INACTIVITY_MS - WARNING_BEFORE_MS);

    timeoutRef.current = setTimeout(logout, INACTIVITY_MS);
  }, [logout]);

  useEffect(() => {
    const events = [
      "mousedown",
      "mousemove",
      "keypress",
      "scroll",
      "touchstart",
      "click",
    ];

    const handler = () => resetTimer();

    events.forEach((e) =>
      document.addEventListener(e, handler, { passive: true })
    );
    resetTimer();

    return () => {
      events.forEach((e) => document.removeEventListener(e, handler));
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      if (warningRef.current) clearTimeout(warningRef.current);
    };
  }, [resetTimer]);

  return null;
}
