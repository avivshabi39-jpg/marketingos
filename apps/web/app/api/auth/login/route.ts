import { NextRequest, NextResponse } from "next/server";
import { compare } from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { signToken, signRefreshToken } from "@/lib/auth";
import { rateLimit, getIp } from "@/lib/rateLimit";
import { audit } from "@/lib/audit";
import { recordFailedAttempt, isLocked, clearAttempts } from "@/lib/loginAttempts";

const schema = z.object({
  email:    z.string().email(),
  password: z.string().min(1),
});

export async function POST(req: NextRequest) {
  const limited = rateLimit(getIp(req), "login");
  if (limited) {
    return NextResponse.json(
      { error: `יותר מדי ניסיונות כניסה. נסה שוב בעוד ${limited.retryAfter} שניות.` },
      { status: 429, headers: { "Retry-After": String(limited.retryAfter) } }
    );
  }

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "קלט לא תקין" }, { status: 400 });
  }

  const { email, password } = parsed.data;
  const ip = getIp(req);

  // Brute force check — by email and by IP
  if (isLocked(email) || isLocked(ip)) {
    return NextResponse.json(
      { error: "חשבון נעול ל-15 דקות" },
      { status: 429 }
    );
  }

  const user = await prisma.user.findUnique({
    where: { email },
    include: { subscription: { select: { status: true } } },
  });

  // Always run bcrypt regardless of whether user exists — prevents timing-based enumeration
  const DUMMY_HASH = "$2b$12$dummyhashtopreventtimingatk.invalid.hash.value";
  const valid = await compare(password, user?.passwordHash ?? DUMMY_HASH);

  if (!user || !user.isActive || !valid) {
    recordFailedAttempt(email);
    recordFailedAttempt(ip);
    audit("login.failed", { meta: { email, ip } });
    return NextResponse.json({ error: "אימייל או סיסמה שגויים" }, { status: 401 });
  }

  clearAttempts(email);
  clearAttempts(ip);

  await prisma.user.update({
    where: { id: user.id },
    data: { lastLoginAt: new Date() },
  });

  audit("login.success", { userId: user.id, meta: { ip } });

  const tokenPayload = {
    userId:              user.id,
    email:               user.email,
    role:                user.role,
    clientId:            user.clientId,
    onboardingCompleted: user.onboardingCompleted,
    subscriptionStatus:  user.subscription?.status ?? "inactive",
  };

  const [accessToken, refreshTokenJwt] = await Promise.all([
    signToken(tokenPayload),
    signRefreshToken(tokenPayload),
  ]);

  // Persist refresh token in DB (for revocation)
  await prisma.refreshToken.create({
    data: {
      userId:    user.id,
      token:     refreshTokenJwt,
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    },
  });

  const response = NextResponse.json({ ok: true });
  response.cookies.set("auth_token", accessToken, {
    httpOnly: true,
    secure:   process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge:   60 * 60, // 1 hour
    path:     "/",
  });
  response.cookies.set("refresh_token", refreshTokenJwt, {
    httpOnly: true,
    secure:   process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge:   60 * 60 * 24 * 30, // 30 days
    path:     "/",
  });

  return response;
}
