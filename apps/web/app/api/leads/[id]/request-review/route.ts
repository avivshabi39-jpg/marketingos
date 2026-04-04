import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sendWhatsApp } from "@/lib/whatsapp";

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { platform = "google" } = (await req.json().catch(() => ({}))) as { platform?: string };

  const lead = await prisma.lead.findUnique({
    where: { id: params.id },
    include: { client: { select: { name: true, googleReviewLink: true, facebookReviewLink: true, greenApiInstanceId: true, greenApiToken: true } } },
  });

  if (!lead?.phone) return NextResponse.json({ error: "No phone" }, { status: 400 });

  const link = platform === "google" ? lead.client.googleReviewLink : lead.client.facebookReviewLink;
  if (!link) return NextResponse.json({ error: "No review link configured" }, { status: 400 });

  const message = `שלום ${lead.firstName}! 😊\n\nשמחנו לעזור לך ב${lead.client.name}!\n\nאם היית מרוצה, נשמח לביקורת קצרה:\n⭐ ${link}\n\nתודה רבה! 🙏`;

  const result = await sendWhatsApp(lead.phone, message, lead.client);
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: 500 });

  return NextResponse.json({ ok: true });
}
