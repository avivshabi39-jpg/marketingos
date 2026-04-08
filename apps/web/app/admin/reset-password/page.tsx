"use client";

import { useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Loader2, TrendingUp } from "lucide-react";

function getStrength(pw: string): 0 | 1 | 2 {
  let score = 0;
  if (pw.length >= 8)             score++;
  if (/[A-Z]/.test(pw))           score++;
  if (/[0-9]/.test(pw))           score++;
  if (/[^A-Za-z0-9]/.test(pw))   score++;
  if (pw.length >= 12)            score++;
  if (score <= 2) return 0;
  if (score <= 3) return 1;
  return 2;
}

function PasswordStrengthBar({ password }: { password: string }) {
  const level = getStrength(password);
  const labels = ["חלשה", "בינונית", "חזקה"];
  const colors = ["bg-red-500", "bg-yellow-400", "bg-green-500"];
  const textColors = ["text-red-400", "text-yellow-400", "text-green-400"];
  return (
    <div className="mt-1.5 space-y-1">
      <div className="flex gap-1">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className={`h-1 flex-1 rounded-full transition-all ${i <= level ? colors[level] : "bg-white/20"}`}
          />
        ))}
      </div>
      <p className={`text-xs ${textColors[level]}`}>{labels[level]}</p>
    </div>
  );
}

function ResetForm() {
  const params   = useSearchParams();
  const token    = params.get("token") ?? "";

  const [password, setPassword] = useState("");
  const [confirm,  setConfirm]  = useState("");
  const [done,     setDone]     = useState(false);
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (password !== confirm) { setError("הסיסמאות אינן תואמות"); return; }
    if (password.length < 8)  { setError("סיסמה חייבת להכיל לפחות 8 תווים"); return; }
    if (!/[A-Z]/.test(password)) { setError("סיסמה חייבת להכיל לפחות אות גדולה אחת (A-Z)"); return; }
    if (!/[0-9]/.test(password)) { setError("סיסמה חייבת להכיל לפחות ספרה אחת"); return; }
    setLoading(true);
    try {
      const res  = await fetch("/api/auth/reset-password", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ token, password }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "שגיאה באיפוס הסיסמה"); return; }
      setDone(true);
    } catch {
      setError("שגיאת חיבור לשרת. נסה שנית.");
    } finally {
      setLoading(false);
    }
  }

  if (!token) {
    return <p className="text-red-300 text-center">קישור לא תקין. בקש קישור חדש.</p>;
  }

  if (done) {
    return (
      <div className="text-center space-y-4">
        <div className="w-12 h-12 rounded-full bg-green-500/20 flex items-center justify-center mx-auto">
          <span className="text-2xl">✅</span>
        </div>
        <p className="text-white font-medium">הסיסמה אופסה בהצלחה!</p>
        <a href="/admin/login" className="block text-blue-400 hover:text-blue-200 underline underline-offset-2 text-sm">
          כניסה למערכת
        </a>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-blue-100 mb-1.5">סיסמה חדשה</label>
        <input
          type="password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="לפחות 8 תווים"
          dir="ltr"
          className="w-full rounded-xl bg-white/10 border border-white/20 text-white placeholder-blue-400 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400/60"
        />
        {password.length > 0 && <PasswordStrengthBar password={password} />}
      </div>
      <div>
        <label className="block text-sm font-medium text-blue-100 mb-1.5">אישור סיסמה</label>
        <input
          type="password"
          required
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          placeholder="חזור על הסיסמה"
          dir="ltr"
          className="w-full rounded-xl bg-white/10 border border-white/20 text-white placeholder-blue-400 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400/60"
        />
      </div>
      {error && <p className="text-red-300 text-sm">{error}</p>}
      <button
        type="submit"
        disabled={loading}
        className="w-full flex items-center justify-center gap-2 bg-blue-500 hover:bg-blue-400 text-white font-semibold rounded-xl py-3 text-sm"
      >
        {loading ? <><Loader2 size={15} className="animate-spin" /> מאפס...</> : "אפס סיסמה"}
      </button>
    </form>
  );
}

export default function ResetPasswordPage() {
  return (
    <div
      dir="rtl"
      className="min-h-screen flex items-center justify-center px-4"
      style={{ background: "linear-gradient(135deg, #0f0c29 0%, #302b63 45%, #24243e 100%)" }}
    >
      <div className="w-full max-w-sm space-y-6">
        <div className="flex flex-col items-center">
          <div className="w-12 h-12 rounded-2xl bg-blue-500 flex items-center justify-center shadow-xl mb-4">
            <TrendingUp size={22} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white">איפוס סיסמה</h1>
        </div>
        <div className="rounded-2xl p-6 border border-white/10 bg-white/6 space-y-4">
          <Suspense fallback={<p className="text-blue-300 text-sm text-center">טוען...</p>}>
            <ResetForm />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
