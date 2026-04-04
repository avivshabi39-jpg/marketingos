import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifySync } from "otplib";
import { verifyTempToken, signToken, signRefreshToken } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const { tempToken, token } = (await req.json()) as { tempToken?: string; token?: string };
  if (!tempToken || !token) return NextResponse.json({ error: "Missing fields" }, { status: 400 });

  const userId = await verifyTempToken(tempToken);
  if (!userId) return NextResponse.json({ error: "Session expired — login again" }, { status: 401 });

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, email: true, role: true, onboardingCompleted: true, twoFactorSecret: { select: { secret: true } } },
  });

  if (!user?.twoFactorSecret) return NextResponse.json({ error: "2FA not configured" }, { status: 400 });

  const isValid = verifySync({ token, secret: user.twoFactorSecret.secret });
  if (!isValid) return NextResponse.json({ error: "קוד שגוי" }, { status: 400 });

  const payload = {
    userId: user.id,
    email: user.email,
    role: user.role,
    clientId: null,
    onboardingCompleted: user.onboardingCompleted,
  };

  const [accessToken, refreshTokenJwt] = await Promise.all([signToken(payload), signRefreshToken(payload)]);

  await prisma.refreshToken.create({
    data: { userId: user.id, token: refreshTokenJwt, expiresAt: new Date(Date.now() + 30 * 86400000) },
  });

  const res = NextResponse.json({ ok: true });
  res.cookies.set("auth_token", accessToken, { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", maxAge: 3600, path: "/" });
  res.cookies.set("refresh_token", refreshTokenJwt, { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", maxAge: 30 * 86400, path: "/" });
  return res;
}
