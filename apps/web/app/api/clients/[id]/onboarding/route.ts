import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getClientSession } from "@/lib/clientAuth";
import { prisma } from "@/lib/prisma";

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getSession();
  const clientSession = !session ? await getClientSession() : null;
  if (!session && !clientSession) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const client = await prisma.client.findUnique({
    where: { id: params.id },
    select: { onboardingDone: true, onboardingStep: true, onboardingDoneAt: true },
  });

  if (!client) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json({ onboarding: client });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getSession();
  const clientSession = !session ? await getClientSession() : null;
  if (!session && !clientSession) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const { step, completed } = body as { step?: number; completed?: boolean };

  const data: Record<string, unknown> = {};
  if (typeof step === "number") data.onboardingStep = step;
  if (completed === true) {
    data.onboardingDone = true;
    data.onboardingDoneAt = new Date();
  }

  const client = await prisma.client.update({
    where: { id: params.id },
    data,
    select: { onboardingDone: true, onboardingStep: true },
  });

  return NextResponse.json({ ok: true, onboarding: client });
}
