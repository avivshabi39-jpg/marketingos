import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const members = await prisma.teamMember.findMany({
    where: { ownerId: session.userId },
    include: { member: { select: { id: true, name: true, email: true } } },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ members });
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { email, role = "AGENT" } = (await req.json()) as { email?: string; role?: string };
  if (!email) return NextResponse.json({ error: "Email required" }, { status: 400 });

  const member = await prisma.user.findUnique({ where: { email } });
  if (!member) return NextResponse.json({ invited: true, message: "משתמש לא נמצא — שלח לו הזמנה להרשמה" });

  await prisma.teamMember.upsert({
    where: { ownerId_memberId: { ownerId: session.userId, memberId: member.id } },
    update: { role },
    create: { ownerId: session.userId, memberId: member.id, role },
  });

  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { memberId } = (await req.json()) as { memberId?: string };
  if (!memberId) return NextResponse.json({ error: "Missing memberId" }, { status: 400 });

  await prisma.teamMember.deleteMany({ where: { ownerId: session.userId, memberId } });
  return NextResponse.json({ ok: true });
}
