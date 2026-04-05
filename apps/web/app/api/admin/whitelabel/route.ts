import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: {
      wlEnabled: true,
      wlName: true,
      wlLogo: true,
      wlColor: true,
      wlDomain: true,
      wlFromEmail: true,
      wlHideFooter: true,
    },
  });

  return NextResponse.json({ whitelabel: user });
}

export async function PUT(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Invalid body" }, { status: 400 });

  const allowedFields = [
    "wlEnabled",
    "wlName",
    "wlLogo",
    "wlColor",
    "wlDomain",
    "wlFromEmail",
    "wlHideFooter",
  ] as const;

  const data: Record<string, unknown> = {};
  for (const field of allowedFields) {
    if (body[field] !== undefined) data[field] = body[field];
  }

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: "No valid fields" }, { status: 400 });
  }

  await prisma.user.update({
    where: { id: session.userId },
    data,
  });

  return NextResponse.json({ ok: true });
}
