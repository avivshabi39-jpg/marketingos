"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";

interface CheckoutButtonProps {
  plan: "PRO" | "AGENCY";
  label: string;
  className?: string;
}

export function CheckoutButton({ plan, label, className }: CheckoutButtonProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleClick() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/billing/create-checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan }),
      });
      const data = await res.json() as { url?: string; error?: string };
      if (!res.ok || !data.url) {
        // Not logged in — redirect to register
        if (res.status === 401) {
          window.location.href = `/register?plan=${plan}`;
          return;
        }
        setError(data.error ?? "שגיאה, נסה שוב");
        return;
      }
      window.location.href = data.url;
    } catch {
      setError("שגיאת רשת, נסה שוב");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col gap-1">
      <button
        onClick={handleClick}
        disabled={loading}
        className={`flex items-center justify-center gap-2 font-semibold rounded-xl py-3 text-sm transition-all disabled:opacity-60 disabled:cursor-not-allowed ${className ?? ""}`}
      >
        {loading && <Loader2 size={15} className="animate-spin" />}
        {label}
      </button>
      {error && <p className="text-xs text-red-400 text-center">{error}</p>}
    </div>
  );
}
