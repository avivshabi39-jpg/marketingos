import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { stripe } from "@/lib/stripe";

export async function POST() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const sub = await prisma.subscription.findUnique({
    where: { userId: session.userId },
  });

  if (!sub?.stripeSubscriptionId) {
    return NextResponse.json({ error: "אין מנוי פעיל לביטול" }, { status: 400 });
  }

  if (sub.cancelAtPeriodEnd) {
    return NextResponse.json({ error: "המנוי כבר מסומן לביטול" }, { status: 400 });
  }

  try {
    await stripe.subscriptions.update(sub.stripeSubscriptionId, {
      cancel_at_period_end: true,
    });

    await prisma.subscription.update({
      where: { userId: session.userId },
      data: { cancelAtPeriodEnd: true },
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "שגיאת Stripe";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
