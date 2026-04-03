import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { stripe } from "@/lib/stripe";

export const dynamic = "force-dynamic";

// GET /api/billing/health — verify Stripe connection
export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const keyConfigured = Boolean(process.env.STRIPE_SECRET_KEY && !process.env.STRIPE_SECRET_KEY.includes("placeholder"));
  if (!keyConfigured) {
    return NextResponse.json({ connected: false, reason: "STRIPE_SECRET_KEY לא הוגדר" });
  }

  try {
    await stripe.customers.list({ limit: 1 });
    const isTest = process.env.STRIPE_SECRET_KEY?.startsWith("sk_test_");
    return NextResponse.json({ connected: true, mode: isTest ? "test" : "live" });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ connected: false, reason: msg });
  }
}
