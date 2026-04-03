import { NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { getSession, isSuperAdmin } from "@/lib/auth";

const updateSchema = z.object({
  name: z.string().min(2).optional(),
  role: z.enum(["SUPER_ADMIN", "ADMIN", "AGENT"]).optional(),
  isActive: z.boolean().optional(),
  newPassword: z.string().min(8).optional(),
  clientId: z.string().nullable().optional(),
});

// PATCH /api/users/[id] — עדכון משתמש
export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSession();
    if (!session || !isSuperAdmin(session)) {
      return NextResponse.json({ error: "אין הרשאה" }, { status: 403 });
    }

    const body = await req.json();
    const parsed = updateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0]?.message ?? "נתונים לא תקינים" },
        { status: 400 }
      );
    }

    const { newPassword, ...rest } = parsed.data;
    const data: Record<string, unknown> = { ...rest };

    if (newPassword) {
      data.passwordHash = await bcrypt.hash(newPassword, 12);
    }

    const user = await prisma.user.update({
      where: { id: params.id },
      data,
      select: { id: true, email: true, name: true, role: true, isActive: true },
    });

    return NextResponse.json({ user });
  } catch (err) {
    console.error("PATCH /api/users/[id] error:", err);
    return NextResponse.json({ error: "שגיאת שרת" }, { status: 500 });
  }
}

// DELETE /api/users/[id] — מחיקת משתמש
export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSession();
    if (!session || !isSuperAdmin(session)) {
      return NextResponse.json({ error: "אין הרשאה" }, { status: 403 });
    }

    await prisma.user.delete({ where: { id: params.id } });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("DELETE /api/users/[id] error:", err);
    return NextResponse.json({ error: "שגיאת שרת" }, { status: 500 });
  }
}
