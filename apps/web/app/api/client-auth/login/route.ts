import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { SignJWT } from "jose";
import { rateLimit, getIp } from "@/lib/rateLimit";

const SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET ?? "dev-secret-change-in-production"
);

const schema = z.object({
  slug: z.string().min(1),
  password: z.string().min(1),
});

export async function POST(req: NextRequest) {
  const limited = rateLimit(getIp(req), "login");
  if (limited) {
    return NextResponse.json(
      { error: `יותר מדי נסיונות. נסה שוב בעוד ${limited.retryAfter} שניות.` },
      { status: 429 }
    );
  }

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "נתונים לא תקינים" }, { status: 400 });
  }

  const { slug, password } = parsed.data;

  const client = await prisma.client.findUnique({
    where: { slug },
    select: { id: true, name: true, slug: true, isActive: true, portalPassword: true },
  });

  if (!client || !client.isActive || !client.portalPassword) {
    return NextResponse.json({ error: "פרטי הכניסה שגויים" }, { status: 401 });
  }

  // השוואת סיסמה עם bcrypt — מגרציה אוטומטית של סיסמאות ישנות
  let passwordMatch = false;
  if (client.portalPassword.startsWith("$2")) {
    passwordMatch = await bcrypt.compare(password, client.portalPassword);
  } else {
    // Legacy plaintext — compare and auto-migrate to bcrypt
    passwordMatch = client.portalPassword === password;
    if (passwordMatch) {
      const hashed = await bcrypt.hash(password, 10);
      await prisma.client.update({
        where: { id: client.id },
        data: { portalPassword: hashed },
      });
    }
  }

  if (!passwordMatch) {
    return NextResponse.json({ error: "פרטי הכניסה שגויים" }, { status: 401 });
  }

  const token = await new SignJWT({ clientId: client.id, slug: client.slug, name: client.name, type: "client_portal" })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(SECRET);

  const response = NextResponse.json({ ok: true, slug: client.slug });
  response.cookies.set("client_token", token, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });

  return response;
}

export async function DELETE() {
  const response = NextResponse.json({ ok: true });
  response.cookies.delete("client_token");
  return response;
}
