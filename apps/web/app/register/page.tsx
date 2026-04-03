"use client";

import { useState } from "react";
import { Loader2, TrendingUp, Check, Users, Zap, BarChart3, Star } from "lucide-react";

type Plan = "BASIC" | "PRO" | "AGENCY";

const PLANS = [
  {
    key: "BASIC" as Plan,
    name: "ניסיון חינם",
    price: "₪0",
    priceNote: "30 יום",
    popular: false,
    color: "border-gray-700",
    features: [
      { ok: true,  text: "עד 40 לקוחות" },
      { ok: true,  text: "דפי נחיתה" },
      { ok: true,  text: "עד 100 לידים" },
      { ok: false, text: "AI Agent" },
      { ok: false, text: "וואצאפ אוטומטי" },
    ],
    cta: "התחל חינם",
  },
  {
    key: "PRO" as Plan,
    name: "Pro",
    price: "₪375",
    priceNote: "לחודש",
    popular: true,
    color: "border-indigo-500",
    features: [
      { ok: true, text: "לקוחות ללא הגבלה" },
      { ok: true, text: "AI Agent בעברית" },
      { ok: true, text: "וואצאפ אוטומטי" },
      { ok: true, text: "דוחות אוטומטיים" },
      { ok: true, text: "פורטל לקוח מלא" },
    ],
    cta: "התחל ניסיון 30 יום",
  },
  {
    key: "AGENCY" as Plan,
    name: 'נדל"ן Pro',
    price: "₪425",
    priceNote: "לחודש",
    popular: false,
    color: "border-emerald-600",
    features: [
      { ok: true, text: "כל מה שב-Pro" },
      { ok: true, text: "ניהול נכסים" },
      { ok: true, text: "דשבורד משרד" },
      { ok: true, text: "התאמת קונים" },
      { ok: true, text: "תמיכה VIP" },
    ],
    cta: "מתאים לי",
  },
];

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

export default function RegisterPage() {
  const [name,     setName]     = useState("");
  const [email,    setEmail]    = useState("");
  const [password, setPassword] = useState("");
  const [confirm,  setConfirm]  = useState("");
  const [plan,     setPlan]     = useState<Plan>("PRO");
  const [error,    setError]    = useState("");
  const [loading,  setLoading]  = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (password !== confirm) {
      setError("הסיסמאות אינן תואמות");
      return;
    }
    if (password.length < 8) {
      setError("סיסמה חייבת להכיל לפחות 8 תווים");
      return;
    }
    if (!/[A-Z]/.test(password)) {
      setError("סיסמה חייבת להכיל לפחות אות גדולה אחת (A-Z)");
      return;
    }
    if (!/[0-9]/.test(password)) {
      setError("סיסמה חייבת להכיל לפחות ספרה אחת");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ name, email, password, plan }),
      });
      const data = await res.json();
      if (!res.ok) {
        const msg = typeof data.error === "string"
          ? data.error
          : "שגיאה בהרשמה, נסה שנית.";
        setError(msg);
        return;
      }
      window.location.href = "/admin/onboarding";
    } catch {
      setError("שגיאת חיבור לשרת. נסה שנית.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className="min-h-screen flex"
      dir="rtl"
      style={{ background: "linear-gradient(135deg, #0f0c29 0%, #302b63 45%, #24243e 100%)" }}
    >
      {/* ── Left panel ── */}
      <div className="hidden lg:flex flex-col justify-between flex-1 px-14 py-12 relative overflow-hidden">
        <div className="absolute top-1/4 right-1/4 w-64 h-64 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-1/3 left-1/4 w-48 h-48 bg-purple-500/15 rounded-full blur-3xl pointer-events-none" />

        {/* Logo */}
        <div className="flex items-center gap-3 relative z-10">
          <div className="w-10 h-10 rounded-xl bg-indigo-500 flex items-center justify-center shadow-lg shadow-indigo-500/40">
            <TrendingUp size={20} className="text-white" />
          </div>
          <span className="text-white font-bold text-xl">MarketingOS</span>
        </div>

        <div className="space-y-8 relative z-10">
          <div>
            <h2 className="text-4xl font-bold text-white leading-tight">
              נהל את כל הלידים<br />
              <span className="text-indigo-300">במקום אחד</span>
            </h2>
            <p className="mt-4 text-indigo-200 text-lg leading-relaxed max-w-md">
              מערכת SaaS לסוכנויות שיווק — ניהול לידים, אוטומציות, ודוחות ביצועים אוטומטיים.
            </p>
          </div>

          <div className="space-y-3">
            {[
              { icon: Users,    text: "ניהול לידים ולקוחות ממקום אחד" },
              { icon: Zap,      text: "אוטומציות n8n לכל אירוע" },
              { icon: BarChart3, text: "דוחות שבועיים ישירות למייל" },
              { icon: Star,     text: "פורטל לקוח עם branded view" },
            ].map(({ icon: Icon, text }) => (
              <div key={text} className="flex items-center gap-3 text-indigo-200">
                <div className="w-8 h-8 rounded-lg bg-indigo-500/20 flex items-center justify-center flex-shrink-0">
                  <Icon size={15} className="text-indigo-300" />
                </div>
                <span className="text-sm">{text}</span>
              </div>
            ))}
          </div>
        </div>

        <p className="text-indigo-400 text-sm relative z-10">
          © {new Date().getFullYear()} MarketingOS · כל הזכויות שמורות
        </p>
      </div>

      {/* ── Right panel — form ── */}
      <div className="w-full lg:w-[560px] overflow-y-auto px-8 py-12 flex items-start justify-center">
        <div className="w-full max-w-md space-y-7">
          {/* Mobile logo */}
          <div className="flex flex-col items-center lg:hidden mb-2">
            <div className="w-12 h-12 rounded-2xl bg-indigo-500 flex items-center justify-center shadow-xl mb-3">
              <TrendingUp size={22} className="text-white" />
            </div>
            <h1 className="text-2xl font-bold text-white">MarketingOS</h1>
          </div>

          <div className="hidden lg:block">
            <h2 className="text-2xl font-bold text-white">צור חשבון חדש</h2>
            <p className="text-indigo-300 mt-1 text-sm">הצטרף לסוכנויות שמנהלות לידים בחכמה</p>
          </div>

          {/* Plan selector */}
          <div className="grid grid-cols-3 gap-2">
            {PLANS.map((p) => (
              <button
                key={p.key}
                type="button"
                onClick={() => setPlan(p.key)}
                className={`relative rounded-xl border-2 p-3 text-center transition-all ${
                  plan === p.key
                    ? p.color + " bg-white/10"
                    : "border-white/20 bg-white/5 hover:bg-white/8"
                }`}
              >
                {p.popular && (
                  <span className="absolute -top-2 left-1/2 -translate-x-1/2 bg-indigo-500 text-white text-[10px] px-2 py-0.5 rounded-full font-bold whitespace-nowrap">
                    פופולרי
                  </span>
                )}
                <p className="text-white font-bold text-sm">{p.name}</p>
                <p className="text-indigo-300 text-xs mt-0.5">{p.price}</p>
                <p className="text-indigo-400 text-[10px]">{p.priceNote}</p>
              </button>
            ))}
          </div>

          {/* Selected plan features */}
          <div className="rounded-xl bg-white/5 border border-white/10 px-4 py-3">
            <p className="text-indigo-200 text-xs font-medium mb-2">
              תוכנית {PLANS.find((p) => p.key === plan)?.name}:
            </p>
            <div className="space-y-1">
              {PLANS.find((p) => p.key === plan)?.features.map((f) => (
                <div key={f.text} className="flex items-center gap-2">
                  <Check
                    size={11}
                    className={f.ok ? "text-green-400" : "text-gray-600"}
                  />
                  <span className={`text-xs ${f.ok ? "text-indigo-200" : "text-gray-500 line-through"}`}>
                    {f.text}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Form */}
          <div className="rounded-2xl p-6 space-y-4 border border-white/10 backdrop-blur-md" style={{ background: "rgba(255,255,255,0.06)" }}>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-indigo-100 mb-1.5">שם הסוכנות / העסק</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="סוכנות השיווק שלי"
                  className="w-full rounded-xl bg-white/10 border border-white/20 text-white placeholder-indigo-400 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400/60"
                />
              </div>

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

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-indigo-100 mb-1.5">סיסמה</label>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="לפחות 8 תווים"
                    dir="ltr"
                    className="w-full rounded-xl bg-white/10 border border-white/20 text-white placeholder-indigo-400 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400/60"
                  />
                  {password.length > 0 && (
                    <PasswordStrengthBar password={password} />
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-indigo-100 mb-1.5">אישור סיסמה</label>
                  <input
                    type="password"
                    required
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    placeholder="חזור על הסיסמה"
                    dir="ltr"
                    className="w-full rounded-xl bg-white/10 border border-white/20 text-white placeholder-indigo-400 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400/60"
                  />
                </div>
              </div>

              {error && (
                <div className="flex items-start gap-2 bg-red-500/15 border border-red-400/30 rounded-xl px-4 py-3">
                  <span className="text-red-300 text-xs mt-0.5">⚠</span>
                  <p className="text-sm text-red-200">{error}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 bg-indigo-500 hover:bg-indigo-400 text-white font-semibold rounded-xl py-3 text-sm transition-all shadow-lg shadow-indigo-500/30 disabled:opacity-60"
              >
                {loading ? <><Loader2 size={16} className="animate-spin" /> יוצר חשבון...</> : "צור חשבון"}
              </button>
            </form>
          </div>

          <p className="text-center text-indigo-400 text-sm">
            כבר יש לך חשבון?{" "}
            <a href="/admin/login" className="text-indigo-300 hover:text-white underline underline-offset-2">
              כניסה למערכת
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
