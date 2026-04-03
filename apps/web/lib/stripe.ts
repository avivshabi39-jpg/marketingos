import Stripe from "stripe";

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY ?? "");

export const PLAN_PRICE_IDS: Record<string, string> = {
  PRO:    process.env.STRIPE_PRICE_PRO    ?? "price_pro_monthly",
  AGENCY: process.env.STRIPE_PRICE_AGENCY ?? "price_agency_monthly",
};
