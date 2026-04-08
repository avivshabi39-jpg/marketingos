import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { stripe } from "@/lib/stripe";
import { redirect } from "next/navigation";
import { BillingActions } from "./BillingActions";
import { SetupStripe } from "./SetupStripe";
import type Stripe from "stripe";

interface BillingPageProps {
  searchParams: Promise<{ success?: string; canceled?: string }>;
}

const PLAN_LABELS: Record<string, string> = {
  BASIC: "ניסיון חינם",
  PRO: "Pro",
  AGENCY: 'נדל"ן Pro',
};

const PLAN_BADGE_COLORS: Record<string, string> = {
  BASIC: "bg-slate-100 text-slate-700",
  PRO: "bg-blue-100 text-blue-700",
  AGENCY: "bg-amber-100 text-amber-700",
};

const STATUS_BADGE_COLORS: Record<string, string> = {
  active: "bg-green-100 text-green-700",
  past_due: "bg-yellow-100 text-yellow-700",
  canceled: "bg-red-100 text-red-700",
  incomplete: "bg-slate-100 text-slate-600",
  trialing: "bg-blue-100 text-blue-700",
};

const STATUS_LABELS: Record<string, string> = {
  active: "פעיל",
  past_due: "תשלום באיחור",
  canceled: "מבוטל",
  incomplete: "לא הושלם",
  trialing: "תקופת ניסיון",
};

const TRIAL_DAYS = 30;

const plans = [
  {
    key: "BASIC" as const,
    name: "🎁 ניסיון חינם",
    price: "₪0",
    period: "30 יום",
    priceNum: 0,
    description: "הכר את המערכת ללא תשלום",
    color: "border-slate-200",
    badgeColor: "bg-slate-100 text-slate-700",
    popular: false,
    badge: null as string | null,
    features: ["עד 40 לקוחות", "דפי נחיתה", "עד 100 לידים", "טפסי קבלה"],
  },
  {
    key: "PRO" as const,
    name: "🚀 Pro",
    price: "₪375",
    period: "לחודש",
    priceNum: 375,
    description: "לקוחות ללא הגבלה, כל התכונות",
    color: "border-blue-400",
    badgeColor: "bg-blue-100 text-blue-700",
    popular: true,
    badge: "הכי פופולרי 🔥" as string | null,
    features: ["לקוחות ללא הגבלה", "לידים ללא הגבלה", "AI Agent בעברית 24/7", "וואצאפ אוטומטי", "דוחות שבועיים אוטומטיים", "A/B Testing", "פורטל לקוח מלא", "QR Code + SEO"],
  },
  {
    key: "AGENCY" as const,
    name: '🏡 נדל"ן Pro',
    price: "₪425",
    period: "לחודש",
    priceNum: 425,
    description: 'לסוכני ומשרדי נדל"ן',
    color: "border-emerald-400",
    badgeColor: "bg-emerald-100 text-emerald-700",
    popular: false,
    badge: 'לסוכני נדל"ן 🏡' as string | null,
    features: ["כל מה שב-Pro", "ניהול נכסים + גלריה", "התאמת קונים אוטומטית", "יומן שיווק לנכסים", "דשבורד משרד", "השוואת ביצועי סוכנים", "אחסון מוגדל", "תמיכה VIP"],
  },
];

export default async function BillingPage({ searchParams }: BillingPageProps) {
  const session = await getSession();
  if (!session) redirect("/admin/login");

  const params = await searchParams;

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    include: { subscription: true },
  });

  const currentPlan = (user?.agencyPlan ?? "BASIC") as "BASIC" | "PRO" | "AGENCY";
  const subscription = user?.subscription ?? null;
  const subStatus = subscription?.status ?? null;
  const hasStripeSubscription = Boolean(subscription?.stripeSubscriptionId && subscription.stripeSubscriptionId !== "");

  const stripeConfigured = Boolean(
    process.env.STRIPE_SECRET_KEY && !process.env.STRIPE_SECRET_KEY.includes("placeholder")
  );
  const stripeTestMode = process.env.STRIPE_SECRET_KEY?.startsWith("sk_test_");

  // Trial period: check if user created account less than TRIAL_DAYS ago
  const isTrialing = subStatus === "trialing";
  const trialDaysLeft = subscription?.currentPeriodEnd
    ? Math.max(0, Math.ceil((new Date(subscription.currentPeriodEnd).getTime() - Date.now()) / 86400000))
    : null;

  // Fetch last 6 invoices from Stripe (skip if no customer)
  let invoices: Stripe.Invoice[] = [];
  const stripeCustomerId = subscription?.stripeCustomerId;
  if (stripeCustomerId) {
    try {
      const invoiceList = await stripe.invoices.list({ customer: stripeCustomerId, limit: 6 });
      invoices = invoiceList.data;
    } catch {
      // Stripe unreachable or test env — silently skip
    }
  }

  return (
    <div className="space-y-8 max-w-5xl mx-auto" dir="rtl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">חיוב ומנוי</h1>
        <p className="text-slate-500 mt-0.5 text-sm">נהל את תוכנית המנוי שלך</p>
      </div>

      {/* Trial banner */}
      {currentPlan === "BASIC" && (
        <div
          style={{ background: "linear-gradient(135deg, #fbbf24, #f59e0b)" }}
          className="rounded-xl px-6 py-4 text-white flex items-center justify-between flex-wrap gap-3 shadow-sm"
        >
          <div className="flex items-center gap-3">
            <strong className="text-base">⏰ ניסיון חינם</strong>
            {trialDaysLeft !== null && (
              <span className="text-sm opacity-90">נותרו {trialDaysLeft} ימים</span>
            )}
          </div>
          <a
            href="#plans"
            className="bg-white text-amber-700 font-semibold text-sm px-4 py-2 rounded-lg hover:bg-amber-50 transition-colors"
          >
            שדרג עכשיו →
          </a>
        </div>
      )}

      {/* Stripe not configured banner */}
      {!stripeConfigured && <SetupStripe />}

      {/* Test mode banner */}
      {stripeConfigured && stripeTestMode && (
        <div className="bg-blue-50 border border-blue-200 text-blue-800 rounded-xl px-5 py-3 text-sm font-medium">
          🧪 מצב בדיקה — Stripe במצב test. תשלומים אינם אמיתיים.
        </div>
      )}

      {/* Success / Canceled banners */}
      {params.success === "1" && (
        <div className="bg-green-50 border border-green-200 text-green-800 rounded-xl px-5 py-4 text-sm font-medium">
          התוכנית שודרגה בהצלחה! הפרטים יעודכנו תוך מספר שניות.
        </div>
      )}
      {params.canceled === "1" && (
        <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 rounded-xl px-5 py-4 text-sm font-medium">
          תהליך הרכישה בוטל. אתה עדיין בתוכנית {PLAN_LABELS[currentPlan]}.
        </div>
      )}

      {/* Current plan card */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-6">
        <h2 className="text-base font-semibold text-slate-900 mb-4">התוכנית הנוכחית</h2>
        <div className="flex flex-wrap items-center gap-3">
          <span className={`px-3 py-1.5 rounded-full text-sm font-semibold ${PLAN_BADGE_COLORS[currentPlan]}`}>
            {PLAN_LABELS[currentPlan]}
          </span>
          {subStatus && (
            <span className={`px-3 py-1.5 rounded-full text-sm font-medium ${STATUS_BADGE_COLORS[subStatus] ?? "bg-slate-100 text-slate-600"}`}>
              {STATUS_LABELS[subStatus] ?? subStatus}
            </span>
          )}
          {subscription?.currentPeriodEnd && subStatus === "active" && (
            <span className="text-sm text-slate-500">
              חידוש הבא: {new Date(subscription.currentPeriodEnd).toLocaleDateString("he-IL")}
            </span>
          )}
          {subscription?.cancelAtPeriodEnd && (
            <span className="text-sm text-orange-600 font-medium">
              המנוי יסתיים בתום התקופה
            </span>
          )}
        </div>

        {/* Trial banner */}
        {isTrialing && trialDaysLeft !== null && (
          <div className="mt-3 bg-blue-50 border border-blue-200 rounded-lg px-4 py-2.5 text-sm text-blue-800">
            🎉 תקופת ניסיון — נותרו <strong>{trialDaysLeft} ימים</strong> מתוך {TRIAL_DAYS} ימי ניסיון חינם
          </div>
        )}

        {/* Manage subscription buttons */}
        {hasStripeSubscription && (
          <div className="mt-5 pt-5 border-t border-slate-100 flex items-center gap-3 flex-wrap">
            <BillingActions
              plan="BASIC"
              currentPlan={currentPlan}
              hasStripeSubscription={hasStripeSubscription}
              mode="portal"
            />
            {!subscription?.cancelAtPeriodEnd && (
              <BillingActions
                plan="BASIC"
                currentPlan={currentPlan}
                hasStripeSubscription={hasStripeSubscription}
                mode="cancel"
              />
            )}
          </div>
        )}
      </div>

      {/* Invoice history */}
      {invoices.length > 0 && (
        <div>
          <h2 className="text-base font-semibold text-slate-900 mb-4">היסטוריית חשבוניות</h2>
          <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50">
                  <th className="text-right px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">תאריך</th>
                  <th className="text-right px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">סכום</th>
                  <th className="text-right px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">סטטוס</th>
                  <th className="px-5 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {invoices.map((inv) => {
                  const date = new Date((inv.created) * 1000).toLocaleDateString("he-IL");
                  const amount = inv.amount_paid != null
                    ? `₪${(inv.amount_paid / 100).toFixed(2)}`
                    : inv.total != null
                    ? `₪${(inv.total / 100).toFixed(2)}`
                    : "—";
                  const statusMap: Record<string, { label: string; cls: string }> = {
                    paid:   { label: "שולם",     cls: "bg-green-50 text-green-700" },
                    open:   { label: "פתוח",     cls: "bg-yellow-50 text-yellow-700" },
                    void:   { label: "בוטל",     cls: "bg-slate-100 text-slate-500" },
                    draft:  { label: "טיוטה",    cls: "bg-slate-100 text-slate-500" },
                    uncollectible: { label: "לא שולם", cls: "bg-red-50 text-red-700" },
                  };
                  const st = statusMap[inv.status ?? ""] ?? { label: inv.status ?? "—", cls: "bg-slate-100 text-slate-500" };
                  return (
                    <tr key={inv.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-5 py-3.5 text-slate-700">{date}</td>
                      <td className="px-5 py-3.5 font-medium text-slate-900">{amount}</td>
                      <td className="px-5 py-3.5">
                        <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium ${st.cls}`}>
                          {st.label}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-left">
                        {inv.invoice_pdf && (
                          <a
                            href={inv.invoice_pdf}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:text-blue-800 text-xs font-medium"
                          >
                            הורד PDF
                          </a>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Plan cards */}
      <div id="plans">
        <h2 className="text-base font-semibold text-slate-900 mb-4">תוכניות זמינות</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {plans.map((plan) => {
            const isCurrent = plan.key === currentPlan;
            return (
              <div
                key={plan.key}
                className={`relative bg-white rounded-xl border-2 ${plan.color} shadow-sm p-6 flex flex-col gap-4 ${isCurrent ? "ring-2 ring-blue-400 ring-offset-1" : ""}`}
              >
                {plan.badge && (
                  <div className={`absolute -top-3 left-1/2 -translate-x-1/2 text-white text-xs font-bold px-3 py-1 rounded-full whitespace-nowrap ${plan.popular ? "bg-blue-500" : "bg-amber-500"}`}>
                    {plan.badge}
                  </div>
                )}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${plan.badgeColor}`}>
                      {plan.name}
                    </span>
                    {isCurrent && (
                      <span className="text-xs font-medium text-blue-600 bg-blue-50 px-2.5 py-1 rounded-full">
                        ✓ התוכנית הנוכחית
                      </span>
                    )}
                  </div>
                  <div className="flex items-baseline gap-1 mt-3">
                    <p className="text-2xl font-bold text-slate-900">{plan.price}</p>
                    <span className="text-sm text-slate-500">/ {plan.period}</span>
                  </div>
                  <p className="text-sm text-slate-500 mt-1">{plan.description}</p>
                </div>

                <ul className="space-y-2 flex-1">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-center gap-2 text-sm text-slate-700">
                      <span className="w-4 h-4 rounded-full bg-green-100 text-green-600 flex items-center justify-center flex-shrink-0 text-xs font-bold">✓</span>
                      {f}
                    </li>
                  ))}
                </ul>

                {!isCurrent && (
                  <BillingActions
                    plan={plan.key}
                    currentPlan={currentPlan}
                    hasStripeSubscription={hasStripeSubscription}
                    mode="upgrade"
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
