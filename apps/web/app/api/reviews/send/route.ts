import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { sendWhatsApp } from "@/lib/whatsapp";
import { decrypt } from "@/lib/encrypt";

const schema = z.object({
  clientId:  z.string().min(1),
  leadId:    z.string().optional(),
  phone:     z.string().min(1),
  name:      z.string().min(1),
  reviewUrl: z.string().url(),
});

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { clientId, phone, name, reviewUrl } = parsed.data;

  const client = await prisma.client.findUnique({
    where: { id: clientId },
    select: {
      name: true,
      greenApiInstanceId: true,
      greenApiToken: true,
    },
  });

  if (!client?.greenApiInstanceId || !client?.greenApiToken) {
    return NextResponse.json({ error: "Green API לא מוגדר" }, { status: 400 });
  }

  const message = [
    `שלום ${name}! 😊`,
    ``,
    `תודה שבחרת ב-${client.name}.`,
    `אנחנו שמחים שיכולנו לעזור!`,
    ``,
    `נשמח מאוד אם תשאיר לנו ביקורת קצרה ב-Google:`,
    reviewUrl,
    ``,
    `תודה רבה! 🙏`,
  ].join("\n");

  const decryptedToken = decrypt(client.greenApiToken);
  await sendWhatsApp(phone, message, client.greenApiInstanceId, decryptedToken);

  return NextResponse.json({ ok: true });
}
