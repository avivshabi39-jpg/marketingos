"use client";

import { useState } from "react";
import { Lock, Loader2, Check } from "lucide-react";

export function PasswordChangeForm({ slug }: { slug: string }) {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess(false);

    if (newPassword.length < 6) {
      setError("הסיסמה החדשה חייבת להכיל לפחות 6 תווים");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("הסיסמאות אינן תואמות");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/client-auth/password", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });

      if (res.ok) {
        setSuccess(true);
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
      } else {
        const data = await res.json();
        setError(data.error ?? "שגיאה בעדכון הסיסמה");
      }
    } catch {
      setError("שגיאת חיבור לשרת");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
      <div className="px-6 py-4 border-b border-slate-50 flex items-center gap-2">
        <Lock size={18} className="text-slate-400" />
        <h2 className="font-semibold text-slate-900">שינוי סיסמת פורטל</h2>
      </div>

      <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
        {/* Current password */}
        <div>
          <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">
            סיסמה נוכחית
          </label>
          <input
            type="password"
            required
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            placeholder="••••••••"
            className="w-full rounded-lg border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400/60 focus:border-blue-400 focus:bg-white transition-all"
          />
        </div>

        {/* New password */}
        <div>
          <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">
            סיסמה חדשה (מינימום 6 תווים)
          </label>
          <input
            type="password"
            required
            minLength={6}
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="••••••••"
            className="w-full rounded-lg border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400/60 focus:border-blue-400 focus:bg-white transition-all"
          />
        </div>

        {/* Confirm password */}
        <div>
          <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">
            אימות סיסמה חדשה
          </label>
          <input
            type="password"
            required
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="••••••••"
            className="w-full rounded-lg border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400/60 focus:border-blue-400 focus:bg-white transition-all"
          />
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        {/* Success */}
        {success && (
          <div className="bg-green-50 border border-green-200 rounded-lg px-4 py-3 flex items-center gap-2">
            <Check size={16} className="text-green-600" />
            <p className="text-sm text-green-700 font-medium">הסיסמה עודכנה בהצלחה!</p>
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="flex items-center justify-center gap-2 bg-blue-500 hover:bg-blue-600 disabled:opacity-60 text-white text-sm font-medium px-5 py-2.5 rounded-lg transition-colors"
        >
          {loading ? (
            <>
              <Loader2 size={14} className="animate-spin" />
              מעדכן...
            </>
          ) : (
            "עדכן סיסמה"
          )}
        </button>
      </form>
    </div>
  );
}
