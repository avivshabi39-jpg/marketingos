import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { stripe, PLAN_PRICE_IDS } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

function mapPriceToPlan(priceId?: string): "BASIC" | "PRO" | "AGENCY" {
  if (!priceId) return "BASIC";
  if (priceId === PLAN_PRICE_IDS["PRO"]) return "PRO";
  if (priceId === PLAN_PRICE_IDS["AGENCY"]) return "AGENCY";
  return "BASIC";
}

export async function POST(req: NextRequest) {
  const rawBody = await req.text();
  const sig = req.headers.get("stripe-signature") ?? "";

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      rawBody,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET ?? ""
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "Webhook verification failed";
    return NextResponse.json({ error: message }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId = session.metadata?.userId;
        if (!userId) break;

        const plan = (session.metadata?.plan ?? "BASIC") as "BASIC" | "PRO" | "AGENCY";
        const subId = session.subscription as string;
        const sub = await stripe.subscriptions.retrieve(subId) as unknown as {
          items: { data: Array<{ price: { id: string } }> };
          current_period_end: number;
          cancel_at_period_end: boolean;
          status: string;
        };

        await prisma.subscription.upsert({
          where: { userId },
          create: {
            userId,
            stripeCustomerId: session.customer as string,
            stripeSubscriptionId: subId,
            stripePriceId: sub.items.data[0]?.price.id ?? "",
            status: "active",
            plan,
            currentPeriodEnd: new Date(sub.current_period_end * 1000),
            cancelAtPeriodEnd: sub.cancel_at_period_end,
          },
          update: {
            stripeSubscriptionId: subId,
            stripePriceId: sub.items.data[0]?.price.id ?? "",
            status: "active",
            plan,
            currentPeriodEnd: new Date(sub.current_period_end * 1000),
            cancelAtPeriodEnd: sub.cancel_at_period_end,
          },
        });

        await prisma.user.update({
          where: { id: userId },
          data: { agencyPlan: plan },
        });
        break;
      }

      case "customer.subscription.updated": {
        const sub = event.data.object as Stripe.Subscription;
        const record = await prisma.subscription.findUnique({
          where: { stripeSubscriptionId: sub.id },
        });

        if (record) {
          const plan = mapPriceToPlan(sub.items.data[0]?.price.id);
          const periodEnd = sub.items.data[0]?.current_period_end;

          await prisma.subscription.update({
            where: { id: record.id },
            data: {
              status: sub.status,
              plan,
              currentPeriodEnd: periodEnd ? new Date(periodEnd * 1000) : undefined,
              cancelAtPeriodEnd: sub.cancel_at_period_end,
            },
          });

          await prisma.user.update({
            where: { id: record.userId },
            data: { agencyPlan: plan },
          });
        }
        break;
      }

      case "customer.subscription.deleted": {
        const sub = event.data.object as Stripe.Subscription;
        const record = await prisma.subscription.findUnique({
          where: { stripeSubscriptionId: sub.id },
        });

        if (record) {
          await prisma.subscription.update({
            where: { id: record.id },
            data: { status: "canceled" },
          });

          await prisma.user.update({
            where: { id: record.userId },
            data: { agencyPlan: "BASIC" },
          });
        }
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        const subDetails = invoice.parent?.subscription_details;
        const subRef = subDetails?.subscription;
        const subId = typeof subRef === "string" ? subRef : subRef?.id;

        if (subId) {
          const record = await prisma.subscription.findUnique({
            where: { stripeSubscriptionId: subId },
          });

          if (record) {
            await prisma.subscription.update({
              where: { id: record.id },
              data: { status: "past_due" },
            });
          }
        }
        break;
      }

      default:
        break;
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : "Webhook handler error";
    console.error("[stripe/webhook]", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
