"use client";

import { useState } from "react";
import { Loader2, CheckCircle2, TrendingUp, ArrowLeft } from "lucide-react";

// ── CSS Confetti ───────────────────────────────────────────────────────────────
const CONFETTI_COLORS = ["#f43f5e", "#f97316", "#eab308", "#22c55e", "#3b82f6", "#a855f7"];

function ConfettiPiece({ i }: { i: number }) {
  const color = CONFETTI_COLORS[i % CONFETTI_COLORS.length];
  const left  = `${(i * 7.3 + 3) % 100}%`;
  const delay = `${(i * 0.13) % 1.5}s`;
  const dur   = `${1.5 + (i % 5) * 0.3}s`;
  const size  = `${6 + (i % 4) * 2}px`;
  return (
    <div
      style={{
        position: "fixed", top: "-20px", left,
        width: size, height: size, background: color,
        borderRadius: i % 3 === 0 ? "50%" : "2px",
        animation: `confettiFall ${dur} ${delay} ease-in forwards`,
        zIndex: 9999, transform: `rotate(${i * 37}deg)`,
      }}
    />
  );
}

function Confetti() {
  return (
    <>
      <style>{`
        @keyframes confettiFall {
          0%   { transform: translateY(-20px) rotate(0deg); opacity: 1; }
          100% { transform: translateY(100vh) rotate(720deg); opacity: 0; }
        }
      `}</style>
      {Array.from({ length: 40 }, (_, i) => <ConfettiPiece key={i} i={i} />)}
    </>
  );
}

type Step = 1 | 2 | 3;

const STEP_LABELS = ["ברוכים הבאים", "לקוח ראשון", "הכל מוכן"];

function StepDot({ step, current }: { step: number; current: number }) {
  const done   = step < current;
  const active = step === current;
  return (
    <div className="flex items-center gap-2">
      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
        done    ? "bg-green-500 text-white" :
        active  ? "bg-blue-500 text-white ring-4 ring-blue-500/30" :
                  "bg-white/10 text-blue-400"
      }`}>
        {done ? "✓" : step}
      </div>
      <span className={`text-sm hidden sm:block ${active ? "text-white font-medium" : "text-blue-400"}`}>
        {STEP_LABELS[step - 1]}
      </span>
    </div>
  );
}

export default function OnboardingPage() {
  const [step,           setStep]          = useState<Step>(1);
  const [agencyName,     setAgencyName]    = useState("");
  const [phone,          setPhone]         = useState("");
  const [clientName,     setClientName]    = useState("");
  const [clientSlug,     setClientSlug]    = useState("");
  const [clientIndustry, setClientIndustry]= useState("OTHER");
  const [portalPass,     setPortalPass]    = useState("");
  const [loading,        setLoading]       = useState(false);
  const [error,          setError]         = useState("");

  function slugFromName(n: string) {
    return n.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "").slice(0, 30);
  }

  async function handleStep1Submit(e: React.FormEvent) {
    e.preventDefault();
    setStep(2);
  }

  async function handleStep2Submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/clients", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({
          name:          clientName,
          email:         "noreply@example.com",
          slug:          clientSlug || slugFromName(clientName),
          industry:      clientIndustry,
          portalPassword: portalPass || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "שגיאה ביצירת לקוח");
        return;
      }
      setStep(3);
    } catch {
      setError("שגיאת חיבור לשרת");
    } finally {
      setLoading(false);
    }
  }

  async function completeOnboarding() {
    setLoading(true);
    try {
      await fetch("/api/users/me/onboarding", { method: "POST" });
    } catch { /* non-critical */ }
    window.location.href = "/admin/dashboard";
  }

  return (
    <div
      dir="rtl"
      className="min-h-screen flex flex-col items-center justify-center px-4 py-10"
      style={{ background: "linear-gradient(135deg, #0f0c29 0%, #302b63 45%, #24243e 100%)" }}
    >
      {/* Logo */}
      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 rounded-xl bg-blue-500 flex items-center justify-center">
          <TrendingUp size={20} className="text-white" />
        </div>
        <span className="text-white font-bold text-xl">MarketingOS</span>
      </div>

      {/* Steps bar */}
      <div className="flex items-center gap-4 mb-8">
        {[1, 2, 3].map((s, i) => (
          <div key={s} className="flex items-center gap-2">
            {i > 0 && <div className={`w-8 h-px ${s <= step ? "bg-blue-400" : "bg-white/20"}`} />}
            <StepDot step={s} current={step} />
          </div>
        ))}
      </div>

      <div className="w-full max-w-md">
        <div className="rounded-2xl p-7 border border-white/10 backdrop-blur-md" style={{ background: "rgba(255,255,255,0.07)" }}>

          {/* ── Step 1 ── */}
          {step === 1 && (
            <form onSubmit={handleStep1Submit} className="space-y-5">
              <div>
                <h2 className="text-2xl font-bold text-white">ברוכים הבאים! 👋</h2>
                <p className="text-blue-300 text-sm mt-1">בוא נגדיר כמה פרטים בסיסיים</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-blue-100 mb-1.5">שם הסוכנות / העסק</label>
                <input
                  type="text" required value={agencyName}
                  onChange={(e) => setAgencyName(e.target.value)}
                  placeholder="סוכנות השיווק שלי"
                  className="w-full rounded-xl bg-white/10 border border-white/20 text-white placeholder-blue-400 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400/60"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-blue-100 mb-1.5">מספר טלפון (אופציונלי)</label>
                <input
                  type="tel" value={phone} onChange={(e) => setPhone(e.target.value)}
                  placeholder="050-000-0000" dir="ltr"
                  className="w-full rounded-xl bg-white/10 border border-white/20 text-white placeholder-blue-400 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400/60"
                />
              </div>
              <button type="submit" className="w-full bg-blue-500 hover:bg-blue-400 text-white font-semibold rounded-xl py-3 text-sm transition-all">
                הבא →
              </button>
            </form>
          )}

          {/* ── Step 2 ── */}
          {step === 2 && (
            <form onSubmit={handleStep2Submit} className="space-y-5">
              <div>
                <h2 className="text-2xl font-bold text-white">הוסף לקוח ראשון</h2>
                <p className="text-blue-300 text-sm mt-1">זה הלקוח שתנהל עבורו לידים ודוחות</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-blue-100 mb-1.5">שם העסק של הלקוח</label>
                <input
                  type="text" required value={clientName}
                  onChange={(e) => { setClientName(e.target.value); setClientSlug(slugFromName(e.target.value)); }}
                  placeholder="גיא גגות בע״מ"
                  className="w-full rounded-xl bg-white/10 border border-white/20 text-white placeholder-blue-400 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400/60"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-blue-100 mb-1.5">כתובת קישור (slug)</label>
                <div className="flex items-center gap-2 bg-white/10 border border-white/20 rounded-xl px-4 py-2.5">
                  <span className="text-blue-400 text-sm">yourdomain.com/</span>
                  <input
                    type="text" value={clientSlug}
                    onChange={(e) => setClientSlug(e.target.value)}
                    dir="ltr"
                    className="flex-1 bg-transparent text-white text-sm focus:outline-none"
                    placeholder="guy-roofing"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-blue-100 mb-1.5">תחום עיסוק</label>
                <select
                  value={clientIndustry} onChange={(e) => setClientIndustry(e.target.value)}
                  className="w-full rounded-xl bg-white/10 border border-white/20 text-white px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400/60"
                >
                  <option value="ROOFING">גגות</option>
                  <option value="ALUMINUM">אלומיניום</option>
                  <option value="COSMETICS">קוסמטיקה</option>
                  <option value="CLEANING">ניקיון</option>
                  <option value="REAL_ESTATE">נדל״ן</option>
                  <option value="AVIATION">תעופה</option>
                  <option value="TOURISM">תיירות</option>
                  <option value="FINANCE">פיננסים</option>
                  <option value="LEGAL">משפטי</option>
                  <option value="MEDICAL">רפואה</option>
                  <option value="FOOD">מזון ומסעדנות</option>
                  <option value="FITNESS">כושר ובריאות</option>
                  <option value="EDUCATION">חינוך</option>
                  <option value="GENERAL">כללי</option>
                  <option value="OTHER">אחר</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-blue-100 mb-1.5">סיסמת פורטל לקוח (אופציונלי)</label>
                <input
                  type="text" value={portalPass} onChange={(e) => setPortalPass(e.target.value)}
                  placeholder="הלקוח ישתמש בזה להיכנס לפורטל"
                  className="w-full rounded-xl bg-white/10 border border-white/20 text-white placeholder-blue-400 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400/60"
                />
              </div>
              {error && <p className="text-red-300 text-sm">{error}</p>}
              <div className="flex gap-3">
                <button type="button" onClick={() => setStep(1)} className="flex-1 bg-white/10 hover:bg-white/15 text-blue-200 font-medium rounded-xl py-3 text-sm transition-all">
                  ← חזרה
                </button>
                <button type="submit" disabled={loading} className="flex-1 flex items-center justify-center gap-2 bg-blue-500 hover:bg-blue-400 text-white font-semibold rounded-xl py-3 text-sm">
                  {loading ? <><Loader2 size={14} className="animate-spin" /> יוצר...</> : "צור לקוח"}
                </button>
              </div>
            </form>
          )}

          {/* ── Step 3 — Done ── */}
          {step === 3 && (
            <>
              <Confetti />
              <div className="space-y-5 text-center">
                <CheckCircle2 size={56} className="text-green-400 mx-auto" />
                <div>
                  <h2 className="text-2xl font-bold text-white">הכל מוכן! 🎉</h2>
                  <p className="text-blue-300 text-sm mt-1">המערכת שלך מוכנה לקבל לידים</p>
                </div>
                <div className="space-y-2 text-right">
                  {["✅ המערכת הוגדרה", "✅ לקוח ראשון נוצר", "✅ פורטל לקוח זמין"].map((item) => (
                    <div key={item} className="flex items-center gap-2 bg-white/5 rounded-xl px-4 py-2.5">
                      <span className="text-sm text-blue-200">{item}</span>
                    </div>
                  ))}
                </div>

                <div className="mt-4 bg-blue-900/40 border border-blue-500/30 rounded-xl p-4 text-right space-y-3">
                  <p className="text-sm font-semibold text-white mb-2">הצעדים הבאים:</p>
                  {[
                    { label: "חבר Green API לשליחת וואצאפ",       href: "/admin/settings" },
                    { label: "הוסף נכסים (נדל\"ן) או קמפיינים",   href: "/admin/clients" },
                    { label: "שתף טופס קבלה עם הלקוחות שלך",      href: "/admin/intake-forms" },
                    { label: "צפה בלוח הבקרה ועקוב אחר לידים",    href: "/admin/dashboard" },
                  ].map(({ label, href }) => (
                    <div key={label} className="flex items-center justify-between gap-2">
                      <span className="text-sm text-blue-200 flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-400 shrink-0" />
                        {label}
                      </span>
                      <a href={href} className="text-xs text-blue-400 hover:text-blue-200 flex items-center gap-1 shrink-0">
                        <ArrowLeft size={12} />
                      </a>
                    </div>
                  ))}
                </div>

                <button
                  onClick={completeOnboarding}
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-2 bg-blue-500 hover:bg-blue-400 text-white font-semibold rounded-xl py-3 text-sm"
                >
                  {loading ? <><Loader2 size={14} className="animate-spin" /> טוען...</> : "עבור ללוח הבקרה"}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
