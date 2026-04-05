"use client";

import { useState, useEffect } from "react";

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export function PwaInstallBanner() {
  const [showBanner, setShowBanner] = useState(false);
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [installed, setInstalled] = useState(false);

  useEffect(() => {
    if (window.matchMedia("(display-mode: standalone)").matches) {
      setInstalled(true);
      return;
    }

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setTimeout(() => setShowBanner(true), 10000);
    };

    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  async function install() {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") {
      setInstalled(true);
      setShowBanner(false);
    }
    setDeferredPrompt(null);
  }

  if (!showBanner || installed) return null;

  return (
    <div
      style={{
        position: "fixed",
        bottom: "20px",
        left: "50%",
        transform: "translateX(-50%)",
        background: "white",
        borderRadius: "14px",
        padding: "14px 18px",
        boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
        border: "1px solid #e5e7eb",
        display: "flex",
        alignItems: "center",
        gap: "12px",
        zIndex: 9999,
        direction: "rtl",
        minWidth: "300px",
        maxWidth: "90vw",
      }}
    >
      <div
        style={{
          width: "44px",
          height: "44px",
          flexShrink: 0,
          background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
          borderRadius: "10px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: "22px",
        }}
      >
        📱
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ fontWeight: 700, fontSize: "14px", marginBottom: "2px" }}>
          התקן כאפליקציה
        </div>
        <div style={{ fontSize: "12px", color: "#6b7280" }}>
          גישה מהירה מהמסך הראשי
        </div>
      </div>
      <div style={{ display: "flex", gap: "6px" }}>
        <button
          onClick={install}
          style={{
            padding: "8px 14px",
            background: "#6366f1",
            color: "white",
            border: "none",
            borderRadius: "8px",
            fontWeight: 700,
            cursor: "pointer",
            fontSize: "13px",
            whiteSpace: "nowrap",
          }}
        >
          התקן
        </button>
        <button
          onClick={() => setShowBanner(false)}
          style={{
            padding: "8px 10px",
            background: "#f3f4f6",
            color: "#6b7280",
            border: "none",
            borderRadius: "8px",
            cursor: "pointer",
            fontSize: "18px",
            lineHeight: 1,
          }}
        >
          ×
        </button>
      </div>
    </div>
  );
}
