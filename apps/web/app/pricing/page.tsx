import Link from "next/link";
import { TrendingUp, Check, X, MessageCircle } from "lucide-react";
import { CheckoutButton } from "./CheckoutButton";

const PLANS = [
  {
    name:         "ניסיון חינם",
    price:        "₪0",
    period:       "30 יום",
    popular:      false,
    color:        "border-white/20",
    features: [
      { ok: true,  text: "עד 40 לקוחות" },
      { ok: true,  text: "דפי נחיתה" },
      { ok: true,  text: "עד 100 לידים" },
      { ok: true,  text: "טפסי קבלה" },
      { ok: false, text: "AI Agent בעברית" },
      { ok: false, text: "וואצאפ אוטומטי" },
      { ok: false, text: "דוחות שבועיים במייל" },
      { ok: false, text: "A/B Testing" },
    ],
    cta:          "התחל חינם",
    href:         "/register?plan=BASIC",
    checkoutPlan: null as null | "PRO" | "AGENCY",
    external:     false,
  },
  {
    name:         "Pro",
    price:        "₪375",
    period:       "לחודש",
    popular:      true,
    color:        "border-indigo-500",
    features: [
      { ok: true, text: "לקוחות ללא הגבלה" },
      { ok: true, text: "דפי נחיתה ללא הגבלה" },
      { ok: true, text: "לידים ללא הגבלה" },
      { ok: true, text: "AI Agent בעברית 24/7" },
      { ok: true, text: "וואצאפ אוטומטי" },
      { ok: true, text: "דוחות שבועיים אוטומטיים" },
      { ok: true, text: "A/B Testing" },
      { ok: true, text: "פורטל לקוח מלא" },
      { ok: true, text: "QR Code לכל דף" },
      { ok: true, text: "SEO מלא" },
      { ok: true, text: "תמיכה בעברית" },
    ],
    cta:          "שדרג ל-Pro",
    href:         "/register?plan=PRO",
    checkoutPlan: "PRO" as "PRO",
    external:     false,
  },
  {
    name:         'נדל"ן Pro',
    price:        "₪425",
    period:       "לחודש",
    popular:      false,
    color:        "border-emerald-500",
    features: [
      { ok: true, text: "כל מה שב-Pro +" },
      { ok: true, text: "אתר אישי לסוכן" },
      { ok: true, text: "ניהול נכסים + גלריה" },
      { ok: true, text: "התאמת קונים אוטומטית" },
      { ok: true, text: "יומן שיווק לנכסים" },
      { ok: true, text: "דשבורד משרד" },
      { ok: true, text: "השוואת ביצועי סוכנים" },
      { ok: true, text: "אחסון מוגדל לתמונות" },
      { ok: true, text: "תמיכה VIP" },
    ],
    cta:          "מתאים לי",
    href:         "/register?plan=AGENCY",
    checkoutPlan: "AGENCY" as "AGENCY",
    external:     false,
  },
];

const FAQ = [
  { q: "האם יש חוזה מחייב?", a: "לא. אפשר לבטל בכל עת. אין עמלות ביטול." },
  { q: "האם אפשר לשדרג/לשנמך תוכנית?", a: "כן, שינוי תוכנית מיידי — ללא אובדן נתונים." },
  { q: "מה קורה לנתונים בביטול?", a: "שומרים את הנתונים שלך 30 יום לאחר ביטול. אפשר לייצא ל-CSV בכל עת." },
  { q: "האם יש תמיכה בעברית?", a: "כן! הממשק, המיילים, והתמיכה — הכל בעברית." },
  { q: "מה זה אוטומציות n8n?", a: "n8n הוא כלי אוטומציה open-source. אנחנו מאפשרים webhook על כל אירוע (ליד חדש, שינוי סטטוס) כדי לשלוח WhatsApp, SMS, לעדכן CRM ועוד." },
];

export default function PricingPage() {
  return (
    <div dir="rtl" className="min-h-screen" style={{ background: "linear-gradient(135deg, #0f0c29 0%, #302b63 45%, #24243e 100%)" }}>
      {/* Navbar */}
      <nav className="flex items-center justify-between px-8 py-5 max-w-6xl mx-auto">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-indigo-500 flex items-center justify-center">
            <TrendingUp size={18} className="text-white" />
          </div>
          <span className="text-white font-bold text-lg">MarketingOS</span>
        </Link>
        <div className="flex items-center gap-4">
          <Link href="/admin/login" className="text-indigo-300 hover:text-white text-sm">כניסה</Link>
          <Link href="/register" className="bg-indigo-500 hover:bg-indigo-400 text-white font-medium rounded-xl px-4 py-2 text-sm transition-all">
            התחל חינם
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="text-center px-8 pt-14 pb-10">
        <h1 className="text-4xl font-bold text-white mb-4">מחירים פשוטים ושקופים</h1>
        <p className="text-indigo-300 text-lg">התחל חינם, שדרג כשצומחים. ללא הפתעות.</p>
      </section>

      {/* Plans */}
      <section className="max-w-5xl mx-auto px-8 pb-16">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          {PLANS.map((plan) => (
            <div
              key={plan.name}
              className={`relative rounded-2xl border-2 p-7 flex flex-col ${plan.color} ${
                plan.popular ? "bg-indigo-500/10" : "bg-white/5"
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-indigo-500 text-white text-xs font-bold px-4 py-1 rounded-full shadow-lg">
                  הכי פופולרי ⭐
                </div>
              )}

              <div className="mb-6">
                <h3 className="text-xl font-bold text-white">{plan.name}</h3>
                <div className="mt-3">
                  <span className="text-3xl font-bold text-white">{plan.price}</span>
                  <span className="text-indigo-400 text-sm mr-1">/{plan.period}</span>
                </div>
              </div>

              <ul className="space-y-2.5 flex-1 mb-8">
                {plan.features.map((f) => (
                  <li key={f.text} className="flex items-center gap-2">
                    {f.ok
                      ? <Check size={14} className="text-green-400 flex-shrink-0" />
                      : <X    size={14} className="text-gray-600  flex-shrink-0" />
                    }
                    <span className={`text-sm ${f.ok ? "text-indigo-200" : "text-gray-500"}`}>{f.text}</span>
                  </li>
                ))}
              </ul>

              {plan.external ? (
                <a
                  href={plan.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 bg-purple-600 hover:bg-purple-500 text-white font-semibold rounded-xl py-3 text-sm transition-all"
                >
                  <MessageCircle size={15} />
                  {plan.cta}
                </a>
              ) : plan.checkoutPlan ? (
                <CheckoutButton
                  plan={plan.checkoutPlan}
                  label={plan.cta}
                  className={
                    plan.popular
                      ? "bg-indigo-500 hover:bg-indigo-400 text-white shadow-lg shadow-indigo-500/30"
                      : "bg-white/10 hover:bg-white/15 text-white border border-white/20"
                  }
                />
              ) : (
                <Link
                  href={plan.href}
                  className="flex items-center justify-center font-semibold rounded-xl py-3 text-sm transition-all bg-white/10 hover:bg-white/15 text-white border border-white/20"
                >
                  {plan.cta}
                </Link>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section className="max-w-2xl mx-auto px-8 pb-20">
        <h2 className="text-2xl font-bold text-white text-center mb-8">שאלות נפוצות</h2>
        <div className="space-y-4">
          {FAQ.map((item) => (
            <div key={item.q} className="rounded-xl border border-white/10 bg-white/5 px-5 py-4">
              <h4 className="text-white font-medium text-sm mb-1">{item.q}</h4>
              <p className="text-indigo-300 text-sm leading-relaxed">{item.a}</p>
            </div>
          ))}
        </div>

        <div className="text-center mt-10">
          <p className="text-indigo-400 text-sm mb-3">יש שאלות נוספות?</p>
          <a
            href="https://wa.me/972500000000"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 bg-green-600 hover:bg-green-500 text-white font-medium rounded-xl px-6 py-3 text-sm transition-all"
          >
            <MessageCircle size={15} />
            שאל בוואצאפ
          </a>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/10 px-8 py-6 text-center">
        <p className="text-indigo-500 text-sm">© {new Date().getFullYear()} MarketingOS</p>
      </footer>
    </div>
  );
}
