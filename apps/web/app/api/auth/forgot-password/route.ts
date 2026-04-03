import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { rateLimit, getIp } from "@/lib/rateLimit";

const schema = z.object({ email: z.string().email() });

export async function POST(req: NextRequest) {
  const limited = rateLimit(getIp(req), "login");
  if (limited) return NextResponse.json({ error: "יותר מדי בקשות. נסה שוב מאוחר יותר." }, { status: 429 });

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "אימייל לא תקין" }, { status: 400 });
  }

  const { email } = parsed.data;
  const user = await prisma.user.findUnique({ where: { email } });

  // תמיד מחזיר 200 כדי לא לחשוף אם האימייל קיים
  if (!user) {
    return NextResponse.json({ ok: true });
  }

  const token = crypto.randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // שעה אחת

  // מחיקת טוקנים ישנים
  await prisma.passwordResetToken.deleteMany({ where: { userId: user.id } });

  await prisma.passwordResetToken.create({
    data: { token, expiresAt, userId: user.id },
  });

  // שליחת מייל עם Resend
  const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}/admin/reset-password?token=${token}`;

  const resendKey = process.env.RESEND_API_KEY;
  if (resendKey) {
    await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from:    "MarketingOS <noreply@marketingos.io>",
        to:      email,
        subject: "איפוס סיסמה — MarketingOS",
        html: `
          <div dir="rtl" style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto;">
            <h2 style="color: #4f46e5;">איפוס סיסמה</h2>
            <p>קיבלנו בקשה לאיפוס הסיסמה שלך. לחץ על הכפתור כדי להמשיך:</p>
            <a href="${resetUrl}" style="display:inline-block;background:#4f46e5;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;margin:16px 0;">
              איפוס סיסמה
            </a>
            <p style="color:#666;font-size:13px;">הקישור תקף לשעה אחת. אם לא ביקשת לאפס סיסמה, התעלם מהודעה זו.</p>
          </div>
        `,
      }),
    }).catch(() => {/* שגיאות מייל לא קריטיות */});
  }

  return NextResponse.json({ ok: true });
}
