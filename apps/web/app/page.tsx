import Link from "next/link";
import { TrendingUp, Users, FileText, BarChart3, Zap, Check, ArrowLeft } from "lucide-react";

export default function HomePage() {
  return (
    <div
      dir="rtl"
      className="min-h-screen"
      style={{ background: "linear-gradient(135deg, #0f0c29 0%, #302b63 45%, #24243e 100%)" }}
    >
      {/* ── Navbar ── */}
      <nav className="flex items-center justify-between px-8 py-5 max-w-6xl mx-auto">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-indigo-500 flex items-center justify-center">
            <TrendingUp size={18} className="text-white" />
          </div>
          <span className="text-white font-bold text-lg">MarketingOS</span>
        </div>
        <div className="flex items-center gap-4">
          <Link href="/pricing" className="text-indigo-300 hover:text-white text-sm transition-colors">
            תמחור
          </Link>
          <Link href="/admin/login" className="text-indigo-300 hover:text-white text-sm transition-colors">
            כניסה
          </Link>
          <Link
            href="/register"
            className="bg-indigo-500 hover:bg-indigo-400 text-white font-medium rounded-xl px-4 py-2 text-sm transition-all shadow-lg shadow-indigo-500/30"
          >
            התחל חינם
          </Link>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className="max-w-5xl mx-auto px-8 pt-16 pb-20 text-center">
        <div className="inline-flex items-center gap-2 bg-indigo-500/15 border border-indigo-500/30 rounded-full px-4 py-1.5 mb-8">
          <span className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse" />
          <span className="text-indigo-300 text-sm">מערכת SaaS לסוכנויות שיווק</span>
        </div>

        <h1 className="text-5xl sm:text-6xl font-bold text-white leading-tight mb-6">
          נהל את כל הלידים<br />
          <span className="text-indigo-300">של הלקוחות שלך</span><br />
          במקום אחד
        </h1>

        <p className="text-indigo-200 text-xl max-w-2xl mx-auto leading-relaxed mb-10">
          פלטפורמה all-in-one לסוכנויות שיווק — ניהול לידים, טפסי קבלה, אוטומציות n8n, ודוחות ביצועים אוטומטיים ללקוחות.
        </p>

        <div className="flex items-center justify-center gap-4 flex-wrap">
          <Link
            href="/register"
            className="flex items-center gap-2 bg-indigo-500 hover:bg-indigo-400 text-white font-bold rounded-2xl px-8 py-4 text-lg transition-all shadow-xl shadow-indigo-500/40"
          >
            התחל חינם — ללא כרטיס אשראי
            <ArrowLeft size={20} />
          </Link>
          <Link
            href="/admin/login"
            className="flex items-center gap-2 bg-white/10 hover:bg-white/15 border border-white/20 text-white font-medium rounded-2xl px-6 py-4 text-base transition-all backdrop-blur-sm"
          >
            כניסה לחשבון קיים
          </Link>
        </div>

        {/* Social proof */}
        <p className="text-indigo-400 text-sm mt-8">
          ✓ ניסיון חינם 14 יום · ✓ ביטול בכל עת · ✓ תמיכה בעברית
        </p>
      </section>

      {/* ── Features ── */}
      <section className="max-w-5xl mx-auto px-8 py-16">
        <h2 className="text-3xl font-bold text-white text-center mb-12">
          כל מה שסוכנות שיווק צריכה
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            {
              icon:  Users,
              title: "ניהול לידים חכם",
              desc:  "קנבן ויזואלי, פאנל פרטי ליד, ציון איכות ועסקה",
              color: "bg-indigo-500/20 text-indigo-300",
            },
            {
              icon:  FileText,
              title: "טפסי לידים",
              desc:  "קישור ייחודי לכל לקוח, שמירת UTM, תודה מותאמת",
              color: "bg-purple-500/20 text-purple-300",
            },
            {
              icon:  BarChart3,
              title: "דוחות אוטומטיים",
              desc:  "דוח שבועי/חודשי נשלח אוטומטית למייל הלקוח",
              color: "bg-green-500/20 text-green-300",
            },
            {
              icon:  Zap,
              title: "אוטומציות n8n",
              desc:  "webhook על כל אירוע — WhatsApp, SMS, CRM חיצוני",
              color: "bg-orange-500/20 text-orange-300",
            },
          ].map(({ icon: Icon, title, desc, color }) => (
            <div
              key={title}
              className="rounded-2xl border border-white/10 p-6 hover:border-white/20 transition-all backdrop-blur-sm"
              style={{ background: "rgba(255,255,255,0.04)" }}
            >
              <div className={`w-10 h-10 rounded-xl ${color} flex items-center justify-center mb-4`}>
                <Icon size={18} />
              </div>
              <h3 className="text-white font-semibold mb-2">{title}</h3>
              <p className="text-indigo-300 text-sm leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Pricing preview ── */}
      <section className="max-w-3xl mx-auto px-8 py-16 text-center">
        <h2 className="text-3xl font-bold text-white mb-4">מחירים פשוטים ושקופים</h2>
        <p className="text-indigo-300 mb-8">התחל חינם, שדרג כשצומחים</p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          {[
            { name: "ניסיון חינם", price: "₪0", note: "30 יום חינם", popular: false },
            { name: "Pro",   price: "₪375", note: "לקוחות ללא הגבלה", popular: true },
            { name: 'נדל"ן Pro', price: "₪425", note: "לסוכני נדל\"ן", popular: false },
          ].map((p) => (
            <div
              key={p.name}
              className={`rounded-2xl border p-5 text-center relative ${
                p.popular ? "border-indigo-500 bg-indigo-500/10" : "border-white/15 bg-white/5"
              }`}
            >
              {p.popular && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-indigo-500 text-white text-xs px-3 py-0.5 rounded-full font-bold">
                  הכי פופולרי
                </span>
              )}
              <p className="text-white font-bold text-lg">{p.name}</p>
              <p className={`text-2xl font-bold mt-1 ${p.popular ? "text-indigo-300" : "text-white"}`}>{p.price}</p>
              <p className="text-indigo-400 text-sm mt-1">{p.note}</p>
            </div>
          ))}
        </div>

        <Link href="/pricing" className="text-indigo-400 hover:text-indigo-200 text-sm underline underline-offset-2">
          השווה תוכניות מלאות →
        </Link>
      </section>

      {/* ── CTA ── */}
      <section className="max-w-2xl mx-auto px-8 py-16 text-center">
        <div className="rounded-3xl border border-indigo-500/30 bg-indigo-500/10 p-10 backdrop-blur-sm">
          <h2 className="text-3xl font-bold text-white mb-4">מוכן להתחיל?</h2>
          <p className="text-indigo-300 mb-8">צור חשבון חינמי תוך דקה. ללא כרטיס אשראי.</p>
          <Link
            href="/register"
            className="inline-flex items-center gap-2 bg-indigo-500 hover:bg-indigo-400 text-white font-bold rounded-2xl px-8 py-4 text-lg transition-all shadow-xl shadow-indigo-500/40"
          >
            צור חשבון חינמי
            <ArrowLeft size={20} />
          </Link>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-white/10 px-8 py-8 text-center">
        <p className="text-indigo-500 text-sm">
          © {new Date().getFullYear()} MarketingOS · בנוי עם ❤️ לסוכנויות שיווק ישראליות
        </p>
      </footer>
    </div>
  );
}
