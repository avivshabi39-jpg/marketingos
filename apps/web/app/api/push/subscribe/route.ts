import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { subscription } = (await req.json()) as { subscription: { endpoint: string } };
  if (!subscription?.endpoint) return NextResponse.json({ error: "Invalid subscription" }, { status: 400 });

  await prisma.pushSubscription.upsert({
    where: { userId: session.userId },
    update: { subscription: JSON.stringify(subscription), endpoint: subscription.endpoint },
    create: { userId: session.userId, subscription: JSON.stringify(subscription), endpoint: subscription.endpoint },
  });

  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await prisma.pushSubscription.deleteMany({ where: { userId: session.userId } });
  return NextResponse.json({ ok: true });
}
