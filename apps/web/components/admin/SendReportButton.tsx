"use client";

import { useState } from "react";
import { Send, Loader2, Check } from "lucide-react";
import toast from "react-hot-toast";

// כפתור שליחת דוח במייל ללקוח
export function SendReportButton({ reportId }: { reportId: string }) {
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleSend() {
    if (sent) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/reports/${reportId}/send`, {
        method: "POST",
      });
      const data = await res.json();
      if (res.ok) {
        setSent(true);
        toast.success(`הדוח נשלח ל-${data.sentTo}`);
      } else {
        toast.error(data.error ?? "שגיאה בשליחת הדוח");
      }
    } catch {
      toast.error("שגיאת חיבור לשרת");
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={handleSend}
      disabled={loading || sent}
      className="flex items-center gap-1.5 text-xs border border-gray-200 text-gray-600 px-3 py-1.5 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {loading ? (
        <Loader2 size={12} className="animate-spin" />
      ) : sent ? (
        <Check size={12} className="text-green-500" />
      ) : (
        <Send size={12} />
      )}
      {sent ? "נשלח!" : "שלח ללקוח"}
    </button>
  );
}
