"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, BarChart2 } from "lucide-react";

export default function ClientLoginPage() {
  const router = useRouter();
  const [slug, setSlug] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const res = await fetch("/api/client-auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ slug: slug.trim().toLowerCase(), password }),
    });

    if (res.ok) {
      const data = await res.json();
      router.push(`/client/${data.slug}`);
      return;
    }

    const data = await res.json();
    setError(data.error ?? "שגיאה בהתחברות");
    setLoading(false);
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4"
      style={{
        background: "linear-gradient(135deg, #0f172a 0%, #1e3a5f 50%, #0f4c75 100%)",
      }}
      dir="rtl"
    >
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/20 mb-4">
            <BarChart2 size={26} className="text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white tracking-tight">פורטל לקוחות</h1>
          <p className="text-blue-200 mt-1.5 text-sm">כניסה לצפייה בנתוני הקמפיין שלך</p>
        </div>

        <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-8 shadow-2xl">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-blue-100 mb-1.5">
                שם הלקוח (Slug)
              </label>
              <input
                type="text"
                required
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                placeholder="example-business"
                dir="ltr"
                className="w-full rounded-xl bg-white/10 border border-white/20 text-white placeholder-blue-300 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-white/40 transition-colors"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-blue-100 mb-1.5">
                סיסמה
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full rounded-xl bg-white/10 border border-white/20 text-white placeholder-blue-300 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-white/40 transition-colors"
              />
            </div>

            {error && (
              <div className="bg-red-500/20 border border-red-400/30 rounded-xl px-4 py-3">
                <p className="text-sm text-red-200">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 bg-white text-blue-800 font-semibold rounded-xl py-3 text-sm hover:bg-blue-50 transition-colors disabled:opacity-60 disabled:cursor-not-allowed mt-2"
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
        </div>
      </div>
    </div>
  );
}
