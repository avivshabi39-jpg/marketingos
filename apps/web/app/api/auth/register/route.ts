import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { signToken, signRefreshToken } from "@/lib/auth";
import { rateLimit, getIp } from "@/lib/rateLimit";
import { audit } from "@/lib/audit";
import { validatePassword } from "@/lib/validatePassword";

const schema = z.object({
  name:     z.string().min(2, "שם הוא שדה חובה"),
  email:    z.string().email("כתובת אימייל לא תקינה"),
  password: z.string().min(1),
  plan:     z.enum(["BASIC", "PRO", "AGENCY"]).default("BASIC"),
});

export async function POST(req: NextRequest) {
  const limited = rateLimit(getIp(req), "register");
  if (limited) {
    return NextResponse.json(
      { error: `יותר מדי ניסיונות הרשמה. נסה שוב בעוד ${limited.retryAfter} שניות.` },
      { status: 429, headers: { "Retry-After": String(limited.retryAfter) } }
    );
  }

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { name, email, password, plan } = parsed.data;

  // Password strength validation
  const pwError = validatePassword(password);
  if (pwError) {
    return NextResponse.json({ error: pwError }, { status: 400 });
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json({ error: "כתובת האימייל כבר רשומה במערכת" }, { status: 409 });
  }

  const passwordHash = await bcrypt.hash(password, 12);

  const user = await prisma.user.create({
    data: {
      name,
      email,
      passwordHash,
      role:                "ADMIN",
      agencyPlan:          plan,
      onboardingCompleted: false,
    },
  });

  const tokenPayload = {
    userId:              user.id,
    email:               user.email,
    role:                user.role,
    clientId:            null,
    onboardingCompleted: false,
  };

  const [accessToken, refreshTokenJwt] = await Promise.all([
    signToken(tokenPayload),
    signRefreshToken(tokenPayload),
  ]);

  await prisma.refreshToken.create({
    data: {
      userId:    user.id,
      token:     refreshTokenJwt,
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    },
  });

  audit("user.registered", { userId: user.id, meta: { email, plan, ip: getIp(req) } });

  const res = NextResponse.json({ ok: true, userId: user.id }, { status: 201 });
  res.cookies.set("auth_token", accessToken, {
    httpOnly: true,
    secure:   process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge:   60 * 60, // 1 hour
    path:     "/",
  });
  res.cookies.set("refresh_token", refreshTokenJwt, {
    httpOnly: true,
    secure:   process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge:   60 * 60 * 24 * 30, // 30 days
    path:     "/",
  });
  return res;
}
