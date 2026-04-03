"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { X, Keyboard } from "lucide-react";

const SHORTCUTS = [
  { keys: ["N"],   label: "ליד חדש",       action: "new-lead" },
  { keys: ["C"],   label: "לקוח חדש",      action: "new-client" },
  { keys: ["R"],   label: "דוחות",          action: "reports" },
  { keys: ["D"],   label: "לוח בקרה",       action: "dashboard" },
  { keys: ["L"],   label: "לידים",           action: "leads" },
  { keys: ["?"],   label: "עזרה / קיצורים", action: "help" },
  { keys: ["Esc"], label: "סגור / בטל",      action: "escape" },
];

export function KeyboardShortcuts() {
  const router = useRouter();
  const [showHelp, setShowHelp] = useState(false);

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      // Ignore when typing in inputs
      const tag = (e.target as HTMLElement).tagName.toLowerCase();
      if (tag === "input" || tag === "textarea" || tag === "select") return;
      if (e.ctrlKey || e.metaKey || e.altKey) return;

      switch (e.key) {
        case "n":
        case "N":
          router.push("/admin/leads/new");
          break;
        case "c":
        case "C":
          router.push("/admin/clients/new");
          break;
        case "r":
        case "R":
          router.push("/admin/reports");
          break;
        case "d":
        case "D":
          router.push("/admin/dashboard");
          break;
        case "l":
        case "L":
          router.push("/admin/leads");
          break;
        case "?":
          setShowHelp((v) => !v);
          break;
        case "Escape":
          setShowHelp(false);
          break;
      }
    }

    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [router]);

  if (!showHelp) {
    return (
      <button
        onClick={() => setShowHelp(true)}
        className="fixed bottom-20 left-4 z-30 lg:bottom-6 w-9 h-9 rounded-full bg-gray-800 text-gray-400 hover:text-white hover:bg-gray-700 flex items-center justify-center shadow-lg transition-colors"
        title="קיצורי מקלדת (?)"
        aria-label="קיצורי מקלדת"
      >
        <Keyboard size={15} />
      </button>
    );
  }

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50" dir="rtl">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm mx-4 overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <Keyboard size={16} className="text-indigo-500" />
            <h2 className="font-semibold text-gray-900">קיצורי מקלדת</h2>
          </div>
          <button onClick={() => setShowHelp(false)} className="text-gray-400 hover:text-gray-600">
            <X size={18} />
          </button>
        </div>
        <div className="p-4 space-y-2">
          {SHORTCUTS.filter((s) => s.action !== "escape" && s.action !== "help").map((s) => (
            <div key={s.action} className="flex items-center justify-between">
              <span className="text-sm text-gray-700">{s.label}</span>
              <div className="flex gap-1">
                {s.keys.map((k) => (
                  <kbd
                    key={k}
                    className="px-2 py-1 bg-gray-100 border border-gray-200 rounded text-xs font-mono text-gray-600 shadow-[0_1px_0_0_rgba(0,0,0,.15)]"
                  >
                    {k}
                  </kbd>
                ))}
              </div>
            </div>
          ))}
          <div className="border-t border-gray-100 pt-2 mt-2 flex items-center justify-between">
            <span className="text-sm text-gray-500">סגור</span>
            <kbd className="px-2 py-1 bg-gray-100 border border-gray-200 rounded text-xs font-mono text-gray-600">
              Esc
            </kbd>
          </div>
        </div>
      </div>
    </div>
  );
}
