import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

// GET /api/billing/subscription — current user's subscription details
export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const subscription = await prisma.subscription.findFirst({
    where: { userId: session.userId },
    orderBy: { createdAt: "desc" },
  });

  if (!subscription) {
    return NextResponse.json({
      plan: "BASIC",
      status: "active",
      stripeSubscriptionId: null,
      currentPeriodEnd: null,
    });
  }

  return NextResponse.json({
    plan: subscription.plan,
    status: subscription.status,
    stripeSubscriptionId: subscription.stripeSubscriptionId,
    currentPeriodEnd: subscription.currentPeriodEnd,
  });
}
