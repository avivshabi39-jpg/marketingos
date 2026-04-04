import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";

const SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET ?? "dev-secret-change-in-production"
);

// Separate secret for refresh tokens
const REFRESH_SECRET = new TextEncoder().encode(
  process.env.JWT_REFRESH_SECRET ??
  (process.env.JWT_SECRET
    ? process.env.JWT_SECRET + "-refresh"
    : "dev-refresh-secret-change-in-production")
);

export type JWTPayload = {
  userId: string;
  email: string;
  role: string;
  clientId: string | null;
  onboardingCompleted?: boolean;
  subscriptionStatus?: string;
};

/** Access token — 1 hour */
export async function signToken(payload: JWTPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("1h")
    .sign(SECRET);
}

export async function verifyToken(token: string): Promise<JWTPayload | null> {
  try {
    const { payload } = await jwtVerify(token, SECRET);
    return payload as unknown as JWTPayload;
  } catch {
    return null;
  }
}

/** Refresh token — 30 days, signed with REFRESH_SECRET */
export async function signRefreshToken(payload: JWTPayload): Promise<string> {
  return new SignJWT({ ...payload, _type: "refresh" })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("30d")
    .sign(REFRESH_SECRET);
}

export async function verifyRefreshToken(token: string): Promise<JWTPayload | null> {
  try {
    const { payload } = await jwtVerify(token, REFRESH_SECRET);
    if ((payload as Record<string, unknown>)._type !== "refresh") return null;
    const { _type: _, iat: __, exp: ___, nbf: ____, ...rest } = payload as Record<string, unknown>;
    return rest as unknown as JWTPayload;
  } catch {
    return null;
  }
}

export async function getSession(): Promise<JWTPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get("auth_token")?.value;
  if (!token) return null;
  return verifyToken(token);
}

export function isSuperAdmin(session: JWTPayload): boolean {
  return session.role === "SUPER_ADMIN";
}

export async function createTempToken(userId: string): Promise<string> {
  const { SignJWT } = await import("jose");
  const secret = new TextEncoder().encode(process.env.JWT_SECRET ?? "dev-secret");
  return new SignJWT({ userId, _type: "2fa_temp" })
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime("5m")
    .sign(secret);
}

export async function verifyTempToken(token: string): Promise<string | null> {
  try {
    const { jwtVerify } = await import("jose");
    const secret = new TextEncoder().encode(process.env.JWT_SECRET ?? "dev-secret");
    const { payload } = await jwtVerify(token, secret);
    if (payload._type !== "2fa_temp") return null;
    return payload.userId as string;
  } catch {
    return null;
  }
}
