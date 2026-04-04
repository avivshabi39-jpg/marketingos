"use client";

import { useState, useEffect } from "react";

export function PushPermission() {
  const [show, setShow] = useState(false);
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined" || !("Notification" in window) || !("serviceWorker" in navigator)) return;
    navigator.serviceWorker.register("/sw.js").catch(() => {});
    if (Notification.permission === "granted") { setEnabled(true); return; }
    if (Notification.permission === "default") { setTimeout(() => setShow(true), 5000); }
  }, []);

  async function enable() {
    const perm = await Notification.requestPermission();
    if (perm !== "granted") { setShow(false); return; }
    const reg = await navigator.serviceWorker.ready;
    const existing = await reg.pushManager.getSubscription();
    const sub = existing ?? await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
    });
    await fetch("/api/push/subscribe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ subscription: sub }),
    });
    setEnabled(true);
    setShow(false);
  }

  if (!show || enabled) return null;

  return (
    <div className="fixed bottom-5 left-1/2 -translate-x-1/2 bg-white rounded-2xl px-5 py-3.5 shadow-xl border border-gray-200 z-[9999] flex items-center gap-3 max-w-[380px] w-[90%]" dir="rtl">
      <span className="text-2xl">🔔</span>
      <div className="flex-1">
        <p className="font-bold text-sm">קבל התראה על ליד חדש!</p>
        <p className="text-xs text-gray-500">תדע מיד כשלקוח משאיר פרטים</p>
      </div>
      <button onClick={enable} className="px-3.5 py-2 bg-indigo-600 text-white rounded-lg text-xs font-bold">הפעל</button>
      <button onClick={() => setShow(false)} className="px-2 py-2 border border-gray-200 rounded-lg text-xs text-gray-400">✕</button>
    </div>
  );
}
