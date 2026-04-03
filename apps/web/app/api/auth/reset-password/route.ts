import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { validatePassword } from "@/lib/validatePassword";

const schema = z.object({
  token:    z.string().min(1),
  password: z.string().min(1),
});

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { token, password } = parsed.data;

  // Password strength validation
  const pwError = validatePassword(password);
  if (pwError) {
    return NextResponse.json({ error: pwError }, { status: 400 });
  }

  const resetToken = await prisma.passwordResetToken.findUnique({
    where: { token },
    include: { user: true },
  });

  if (!resetToken || resetToken.usedAt) {
    return NextResponse.json({ error: "הקישור לא תקין" }, { status: 400 });
  }

  if (resetToken.expiresAt < new Date()) {
    return NextResponse.json({ error: "הקישור פג תוקף — בקש קישור חדש" }, { status: 400 });
  }

  const passwordHash = await bcrypt.hash(password, 12);

  await prisma.$transaction([
    prisma.user.update({
      where: { id: resetToken.userId },
      data:  { passwordHash },
    }),
    prisma.passwordResetToken.update({
      where: { id: resetToken.id },
      data:  { usedAt: new Date() },
    }),
    // Revoke all existing sessions on password change
    prisma.refreshToken.deleteMany({
      where: { userId: resetToken.userId },
    }),
    prisma.auditLog.create({
      data: {
        userId:   resetToken.userId,
        action:   "password.reset",
        entityId: resetToken.userId,
        meta:     { via: "reset_token" },
      },
    }),
  ]);

  return NextResponse.json({ ok: true });
}
