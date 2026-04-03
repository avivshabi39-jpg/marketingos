import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { signToken, signRefreshToken, verifyRefreshToken } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const refreshToken = req.cookies.get("refresh_token")?.value;

  if (!refreshToken) {
    return NextResponse.json({ error: "אין refresh token" }, { status: 401 });
  }

  // Verify JWT signature + expiry
  const payload = await verifyRefreshToken(refreshToken);
  if (!payload) {
    const res = NextResponse.json({ error: "Refresh token לא תקין" }, { status: 401 });
    res.cookies.delete("refresh_token");
    return res;
  }

  // Check DB — token must exist and not be expired
  const storedToken = await prisma.refreshToken.findUnique({
    where: { token: refreshToken },
  });

  if (!storedToken || storedToken.expiresAt < new Date()) {
    if (storedToken) {
      await prisma.refreshToken.delete({ where: { token: refreshToken } });
    }
    const res = NextResponse.json({ error: "Refresh token פג תוקף" }, { status: 401 });
    res.cookies.delete("refresh_token");
    return res;
  }

  // Rotate: delete old token, issue new refresh + access tokens
  await prisma.refreshToken.delete({ where: { token: refreshToken } });

  const newAccessToken   = await signToken(payload);
  const newRefreshToken  = await signRefreshToken(payload);
  const newRefreshExpiry = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

  await prisma.refreshToken.create({
    data: { token: newRefreshToken, userId: storedToken.userId, expiresAt: newRefreshExpiry },
  });

  const response = NextResponse.json({ ok: true });
  response.cookies.set("auth_token", newAccessToken, {
    httpOnly: true,
    secure:   process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge:   60 * 60,
    path:     "/",
  });
  response.cookies.set("refresh_token", newRefreshToken, {
    httpOnly: true,
    secure:   process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge:   30 * 24 * 60 * 60,
    path:     "/",
  });

  return response;
}
