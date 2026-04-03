import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { stripe, PLAN_PRICE_IDS } from "@/lib/stripe";

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json() as { plan?: string };
  const plan = (body.plan ?? "BASIC") as "BASIC" | "PRO" | "AGENCY";

  // Free plan — no checkout needed
  if (plan === "BASIC") {
    return NextResponse.json({ url: "/admin/billing" });
  }

  // Get or create Stripe customer
  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    include: { subscription: true },
  });

  let stripeCustomerId = user?.subscription?.stripeCustomerId ?? null;

  if (!stripeCustomerId) {
    const customer = await stripe.customers.create({
      email: session.email,
      metadata: { userId: session.userId },
    });
    stripeCustomerId = customer.id;

    // Upsert subscription record with stripeCustomerId
    await prisma.subscription.upsert({
      where: { userId: session.userId },
      create: {
        userId: session.userId,
        stripeCustomerId,
        stripeSubscriptionId: "",
        stripePriceId: "",
        status: "incomplete",
        plan: "BASIC",
        currentPeriodEnd: new Date(),
        cancelAtPeriodEnd: false,
      },
      update: {
        stripeCustomerId,
      },
    });
  }

  // Create checkout session
  const checkoutSession = await stripe.checkout.sessions.create({
    customer: stripeCustomerId,
    mode: "subscription",
    line_items: [{ price: PLAN_PRICE_IDS[plan], quantity: 1 }],
    success_url: `${process.env.NEXT_PUBLIC_APP_URL}/admin/billing?success=1`,
    cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/admin/billing?canceled=1`,
    metadata: { userId: session.userId, plan },
    locale: "auto",
  });

  return NextResponse.json({ url: checkoutSession.url });
}
