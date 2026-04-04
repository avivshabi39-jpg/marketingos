import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generateSecret, generateURI, verifySync } from "otplib";

// GET — generate secret + QR code
export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await prisma.user.findUnique({ where: { id: session.userId }, select: { email: true } });
  const secret = generateSecret();
  const otpauth = generateURI({ issuer: "MarketingOS", label: user?.email ?? "user", secret });

  await prisma.twoFactorSecret.upsert({
    where: { userId: session.userId },
    update: { secret, verified: false },
    create: { userId: session.userId, secret, verified: false },
  });

  const QRCode = await import("qrcode");
  const qrDataUrl = await QRCode.default.toDataURL(otpauth);

  return NextResponse.json({ qrDataUrl, secret });
}

// POST — verify token and enable 2FA
export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { token } = (await req.json()) as { token?: string };
  if (!token) return NextResponse.json({ error: "Missing token" }, { status: 400 });

  const tfa = await prisma.twoFactorSecret.findUnique({ where: { userId: session.userId } });
  if (!tfa) return NextResponse.json({ error: "Setup first" }, { status: 400 });

  const isValid = verifySync({ token, secret: tfa.secret });
  if (!isValid) return NextResponse.json({ error: "קוד שגוי — נסה שוב" }, { status: 400 });

  await prisma.$transaction([
    prisma.twoFactorSecret.update({ where: { userId: session.userId }, data: { verified: true } }),
    prisma.user.update({ where: { id: session.userId }, data: { twoFactorEnabled: true } }),
  ]);

  return NextResponse.json({ ok: true });
}

// DELETE — disable 2FA
export async function DELETE() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await prisma.$transaction([
    prisma.twoFactorSecret.deleteMany({ where: { userId: session.userId } }),
    prisma.user.update({ where: { id: session.userId }, data: { twoFactorEnabled: false } }),
  ]);

  return NextResponse.json({ ok: true });
}
