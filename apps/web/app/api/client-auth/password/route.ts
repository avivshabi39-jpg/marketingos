import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { getClientSession } from "@/lib/clientAuth";

const schema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(6),
});

// PATCH /api/client-auth/password — שינוי סיסמת פורטל לקוח
export async function PATCH(req: NextRequest) {
  const session = await getClientSession();
  if (!session) {
    return NextResponse.json({ error: "לא מורשה" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "נתונים לא תקינים" }, { status: 400 });
  }

  const { currentPassword, newPassword } = parsed.data;

  const client = await prisma.client.findUnique({
    where: { id: session.clientId },
    select: { id: true, portalPassword: true, isActive: true },
  });

  if (!client || !client.isActive || !client.portalPassword) {
    return NextResponse.json({ error: "לקוח לא נמצא" }, { status: 404 });
  }

  // Verify current password (supports bcrypt and legacy plaintext)
  let passwordMatch = false;
  if (client.portalPassword.startsWith("$2")) {
    passwordMatch = await bcrypt.compare(currentPassword, client.portalPassword);
  } else {
    passwordMatch = client.portalPassword === currentPassword;
  }

  if (!passwordMatch) {
    return NextResponse.json({ error: "הסיסמה הנוכחית שגויה" }, { status: 400 });
  }

  const newHash = await bcrypt.hash(newPassword, 12);

  await prisma.client.update({
    where: { id: client.id },
    data: { portalPassword: newHash },
  });

  return NextResponse.json({ ok: true });
}
