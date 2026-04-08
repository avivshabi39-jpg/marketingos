"use client";

import { useState } from "react";
import { Send, Loader2 } from "lucide-react";
import toast from "react-hot-toast";

export function PropertyBroadcastButton({ propertyId }: { propertyId: string }) {
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState<number | null>(null);

  async function handleBroadcast() {
    setLoading(true);
    try {
      const res = await fetch(`/api/properties/${propertyId}/broadcast`, { method: "POST" });
      const data = await res.json() as { sent?: number; total?: number; message?: string };
      if (!res.ok) {
        toast.error("שגיאה בשליחה");
        return;
      }
      setSent(data.sent ?? 0);
      toast.success(data.message ?? `נשלח ל-${data.sent} לידים מתוך ${data.total}`);
    } catch {
      toast.error("שגיאת חיבור");
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={handleBroadcast}
      disabled={loading}
      className="w-full flex items-center justify-center gap-1.5 text-xs text-blue-600 bg-blue-50 hover:bg-blue-100 disabled:opacity-60 px-3 py-2 rounded-lg transition-colors font-medium"
    >
      {loading ? <Loader2 size={12} className="animate-spin" /> : <Send size={12} />}
      {sent !== null ? `נשלח ל-${sent} לידים` : "שלח לכל מנויים מתאימים"}
    </button>
  );
}
