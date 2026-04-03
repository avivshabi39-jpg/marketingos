import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

// GET /api/workflows/settings — returns saved automation settings for current user
export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const settings = await prisma.systemSettings.findUnique({
    where: { userId: session.userId },
    select: { workflowSettings: true },
  });

  return NextResponse.json({ workflowSettings: settings?.workflowSettings ?? null });
}

// POST /api/workflows/settings — saves automation settings for current user
export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => ({})) as { workflowSettings: unknown };
  if (!body.workflowSettings) return NextResponse.json({ error: "Missing workflowSettings" }, { status: 400 });

  await prisma.systemSettings.upsert({
    where: { userId: session.userId },
    create: { userId: session.userId, workflowSettings: body.workflowSettings as object },
    update: { workflowSettings: body.workflowSettings as object },
  });

  return NextResponse.json({ ok: true });
}
