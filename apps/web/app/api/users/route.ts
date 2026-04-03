import { NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { getSession, isSuperAdmin } from "@/lib/auth";

// סכמת יצירת משתמש
const createSchema = z.object({
  email: z.string().email("כתובת אימייל לא תקינה"),
  name: z.string().min(2, "שם חייב להכיל לפחות 2 תווים"),
  password: z.string().min(8, "סיסמה חייבת להכיל לפחות 8 תווים"),
  role: z.enum(["SUPER_ADMIN", "ADMIN", "AGENT"]).default("AGENT"),
  clientId: z.string().optional(),
});

// GET /api/users — רשימת משתמשים (סופר אדמין בלבד)
export async function GET() {
  try {
    const session = await getSession();
    if (!session || !isSuperAdmin(session)) {
      return NextResponse.json({ error: "אין הרשאה" }, { status: 403 });
    }

    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        lastLoginAt: true,
        createdAt: true,
        client: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ users });
  } catch (err) {
    console.error("GET /api/users error:", err);
    return NextResponse.json({ error: "שגיאת שרת" }, { status: 500 });
  }
}

// POST /api/users — יצירת משתמש חדש (סופר אדמין בלבד)
export async function POST(req: Request) {
  try {
    const session = await getSession();
    if (!session || !isSuperAdmin(session)) {
      return NextResponse.json({ error: "אין הרשאה" }, { status: 403 });
    }

    const body = await req.json();
    const parsed = createSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0]?.message ?? "נתונים לא תקינים" },
        { status: 400 }
      );
    }

    const { email, name, password, role, clientId } = parsed.data;

    // בדיקת כפילות אימייל
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json({ error: "כתובת אימייל כבר קיימת במערכת" }, { status: 409 });
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const user = await prisma.user.create({
      data: {
        email,
        name,
        passwordHash,
        role,
        clientId: clientId || null,
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        createdAt: true,
      },
    });

    return NextResponse.json({ user }, { status: 201 });
  } catch (err) {
    console.error("POST /api/users error:", err);
    return NextResponse.json({ error: "שגיאת שרת" }, { status: 500 });
  }
}
