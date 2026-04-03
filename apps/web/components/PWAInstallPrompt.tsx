"use client";

import { useEffect, useState } from "react";
import { X, Smartphone } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const DISMISSED_KEY = "pwa-install-dismissed";

export default function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstallable, setIsInstallable] = useState(false);

  useEffect(() => {
    // Check if already dismissed
    if (typeof window !== "undefined" && localStorage.getItem(DISMISSED_KEY)) {
      return;
    }

    function handleBeforeInstallPrompt(e: Event) {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setIsInstallable(true);
    }

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    };
  }, []);

  async function handleInstall() {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const choice = await deferredPrompt.userChoice;
    if (choice.outcome === "accepted") {
      setIsInstallable(false);
      setDeferredPrompt(null);
    }
  }

  function handleDismiss() {
    localStorage.setItem(DISMISSED_KEY, "1");
    setIsInstallable(false);
    setDeferredPrompt(null);
  }

  if (!isInstallable) return null;

  return (
    <div
      className="fixed bottom-0 inset-x-0 z-50 flex items-center justify-between gap-3 bg-indigo-600 text-white px-4 py-3 shadow-lg"
      dir="rtl"
    >
      <div className="flex items-center gap-2 flex-1 min-w-0">
        <Smartphone size={18} className="flex-shrink-0" />
        <span className="text-sm font-medium truncate">
          📱 הוסף את MarketingOS לדף הבית
        </span>
      </div>
      <div className="flex items-center gap-2 flex-shrink-0">
        <button
          onClick={handleInstall}
          className="bg-white text-indigo-600 text-sm font-semibold px-3 py-1.5 rounded-lg hover:bg-indigo-50 transition-colors"
        >
          הוסף
        </button>
        <button
          onClick={handleDismiss}
          className="p-1 rounded-md hover:bg-indigo-500 transition-colors"
          aria-label="סגור"
        >
          <X size={16} />
        </button>
      </div>
    </div>
  );
}
