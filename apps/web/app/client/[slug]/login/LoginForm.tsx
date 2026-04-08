"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Eye, EyeOff } from "lucide-react";

export function LoginForm({
  slug,
  primaryColor,
}: {
  slug: string;
  primaryColor: string;
}) {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/client-auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug, password }),
      });

      if (res.ok) {
        router.push(`/client/${slug}`);
        router.refresh();
        return;
      }

      const data = await res.json();
      setError(data.error ?? "שגיאה בהתחברות");
    } catch {
      setError("שגיאת חיבור לשרת. נסה שנית.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Password field */}
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1.5">
          סיסמה
        </label>
        <div className="relative">
          <input
            type={showPassword ? "text" : "password"}
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            autoFocus
            className="w-full rounded-xl border border-slate-200 bg-slate-50 text-slate-900 placeholder-slate-400 px-4 py-3 text-sm pr-11 focus:outline-none focus:ring-2 focus:ring-blue-400/60 focus:border-blue-400 focus:bg-white transition-all"
          />
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
            tabIndex={-1}
          >
            {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
          <span className="text-red-400 mt-0.5">⚠</span>
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      {/* Submit */}
      <button
        type="submit"
        disabled={loading}
        className="w-full flex items-center justify-center gap-2 text-white font-semibold rounded-xl py-3.5 text-sm transition-all shadow-md disabled:opacity-60 disabled:cursor-not-allowed"
        style={{ backgroundColor: primaryColor }}
      >
        {loading ? (
          <>
            <Loader2 size={16} className="animate-spin" />
            מתחבר...
          </>
        ) : (
          "כניסה לפורטל"
        )}
      </button>
    </form>
  );
}
