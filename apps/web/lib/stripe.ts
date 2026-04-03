import Stripe from "stripe";

// Lazy initialization — prevents crash when STRIPE_SECRET_KEY is missing/placeholder
let _stripe: Stripe | null = null;

function getStripeClient(): Stripe {
  if (!_stripe) {
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key || key.includes("placeholder")) {
      throw new Error("Stripe לא מוגדר — הוסף STRIPE_SECRET_KEY ב-env");
    }
    _stripe = new Stripe(key);
  }
  return _stripe;
}

// Proxy that lazily initializes Stripe on first use
export const stripe = new Proxy({} as Stripe, {
  get(_target, prop: string) {
    const client = getStripeClient();
    const value = (client as unknown as Record<string, unknown>)[prop];
    if (typeof value === "function") {
      return value.bind(client);
    }
    return value;
  },
});

export const PLAN_PRICE_IDS: Record<string, string> = {
  PRO: process.env.STRIPE_PRICE_PRO ?? "price_pro_monthly",
  AGENCY: process.env.STRIPE_PRICE_AGENCY ?? "price_agency_monthly",
};
