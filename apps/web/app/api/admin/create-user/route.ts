import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

// Protected by ADMIN_SECRET header — never expose to frontend
export async function POST(req: NextRequest) {
  const secret = req.headers.get("x-admin-secret");

  if (!process.env.ADMIN_SECRET || secret !== process.env.ADMIN_SECRET) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json().catch(() => null);
  if (!body?.email || !body?.password) {
    return NextResponse.json(
      { error: "email and password required" },
      { status: 400 }
    );
  }

  const { email, password, name, plan } = body as {
    email: string;
    password: string;
    name?: string;
    plan?: string;
  };

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json(
      { error: "User already exists" },
      { status: 409 }
    );
  }

  const passwordHash = await bcrypt.hash(password, 12);

  const user = await prisma.user.create({
    data: {
      email,
      passwordHash,
      name: name || email.split("@")[0],
      role: "ADMIN",
      agencyPlan: (plan as "BASIC" | "PRO" | "AGENCY") || "PRO",
      onboardingCompleted: false,
    },
    select: { id: true, email: true, name: true, role: true },
  });

  return NextResponse.json({ ok: true, user }, { status: 201 });
}
