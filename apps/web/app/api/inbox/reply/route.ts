import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSession, isSuperAdmin } from "@/lib/auth";
import { sendWhatsApp } from "@/lib/whatsapp";
import { decrypt } from "@/lib/encrypt";

const schema = z.object({
  phone:    z.string().min(7),
  message:  z.string().min(1).max(2000),
  clientId: z.string().min(1),
});

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "קלט לא תקין" }, { status: 400 });
  }

  const { phone, message, clientId } = parsed.data;

  const client = await prisma.client.findUnique({
    where: { id: clientId },
    select: { ownerId: true, greenApiInstanceId: true, greenApiToken: true, whatsappNumber: true },
  });
  if (!client) return NextResponse.json({ error: "לקוח לא נמצא" }, { status: 404 });
  if (!isSuperAdmin(session) && client.ownerId !== session.userId) {
    return NextResponse.json({ error: "אין הרשאה" }, { status: 403 });
  }
  if (!client.greenApiInstanceId || !client.greenApiToken) {
    return NextResponse.json({ error: "Green API לא מוגדר ללקוח זה" }, { status: 400 });
  }

  const decryptedToken = decrypt(client.greenApiToken);
  const result = await sendWhatsApp(phone, message, client.greenApiInstanceId, decryptedToken);

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 502 });
  }

  return NextResponse.json({ ok: true });
}
