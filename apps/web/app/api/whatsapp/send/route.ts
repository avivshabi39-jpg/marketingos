import { NextRequest, NextResponse } from "next/server";
import { getSession, isSuperAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sendWhatsApp } from "@/lib/whatsapp";

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = (await req.json().catch(() => ({}))) as {
    phone?: string;
    message?: string;
    clientId?: string;
  };

  const { phone, message, clientId } = body;
  if (!phone || !message) {
    return NextResponse.json({ error: "Missing phone or message" }, { status: 400 });
  }

  // Get client WhatsApp credentials (or fall back to system)
  let clientCreds: { greenApiInstanceId: string | null; greenApiToken: string | null } | null = null;
  if (clientId) {
    const client = await prisma.client.findUnique({
      where: { id: clientId },
      select: { greenApiInstanceId: true, greenApiToken: true, ownerId: true },
    });
    if (client && !isSuperAdmin(session) && client.ownerId !== session.userId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    clientCreds = client;
  }

  const result = await sendWhatsApp(phone, message, clientCreds ?? {});

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
