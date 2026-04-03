"use client";

import { useState } from "react";
import { Loader2, TrendingUp } from "lucide-react";

export default function ForgotPasswordPage() {
  const [email,   setEmail]   = useState("");
  const [sent,    setSent]    = useState(false);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await fetch("/api/auth/forgot-password", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ email }),
      });
      setSent(true);
    } catch {
      setError("שגיאת חיבור לשרת. נסה שנית.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      dir="rtl"
      className="min-h-screen flex items-center justify-center px-4"
      style={{ background: "linear-gradient(135deg, #0f0c29 0%, #302b63 45%, #24243e 100%)" }}
    >
      <div className="w-full max-w-sm space-y-6">
        <div className="flex flex-col items-center">
          <div className="w-12 h-12 rounded-2xl bg-indigo-500 flex items-center justify-center shadow-xl mb-4">
            <TrendingUp size={22} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white">שכחתי סיסמה</h1>
          <p className="text-indigo-300 text-sm mt-1 text-center">נשלח קישור לאיפוס לכתובת המייל שלך</p>
        </div>

        {sent ? (
          <div className="rounded-2xl p-6 border border-white/10 bg-white/6 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-green-500/20 flex items-center justify-center mx-auto">
              <span className="text-2xl">✉️</span>
            </div>
            <p className="text-white font-medium">בדוק את תיבת הדואר שלך</p>
            <p className="text-indigo-300 text-sm">
              אם האימייל רשום במערכת, שלחנו קישור לאיפוס הסיסמה. הקישור תקף לשעה אחת.
            </p>
            <a href="/admin/login" className="block mt-4 text-indigo-400 hover:text-indigo-200 text-sm underline underline-offset-2">
              חזרה לכניסה
            </a>
          </div>
        ) : (
          <div className="rounded-2xl p-6 border border-white/10 bg-white/6 space-y-4">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-indigo-100 mb-1.5">כתובת אימייל</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@agency.com"
                  dir="ltr"
                  className="w-full rounded-xl bg-white/10 border border-white/20 text-white placeholder-indigo-400 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400/60"
                />
              </div>

              {error && (
                <p className="text-red-300 text-sm">{error}</p>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 bg-indigo-500 hover:bg-indigo-400 text-white font-semibold rounded-xl py-3 text-sm transition-all"
              >
                {loading ? <><Loader2 size={15} className="animate-spin" /> שולח...</> : "שלח קישור לאיפוס"}
              </button>
            </form>
            <p className="text-center text-indigo-400 text-sm">
              <a href="/admin/login" className="hover:text-indigo-200 underline underline-offset-2">חזרה לכניסה</a>
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
