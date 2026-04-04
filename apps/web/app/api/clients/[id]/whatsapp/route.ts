import { NextRequest, NextResponse } from "next/server";
import { getSession, isSuperAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getWhatsAppStatus, getQRCode } from "@/lib/whatsapp";

// GET — check WhatsApp connection status + QR code
export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const client = await prisma.client.findUnique({
    where: { id: params.id },
    select: {
      id: true,
      ownerId: true,
      greenApiInstanceId: true,
      greenApiToken: true,
      whatsappNumber: true,
    },
  });

  if (!client) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (!isSuperAdmin(session) && client.ownerId !== session.userId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const hasCredentials = !!(client.greenApiInstanceId && client.greenApiToken);
  const status = hasCredentials ? await getWhatsAppStatus(client) : "not_configured";
  const isConnected = status === "authorized";

  let qrCode: string | null = null;
  if (hasCredentials && status === "notAuthorized") {
    qrCode = await getQRCode(client);
  }

  return NextResponse.json({
    status,
    isConnected,
    hasCredentials,
    qrCode,
    phone: client.whatsappNumber,
  });
}

// PUT — save client WhatsApp credentials
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = (await req.json().catch(() => ({}))) as {
    instanceId?: string;
    token?: string;
    phone?: string;
  };

  const existing = await prisma.client.findUnique({
    where: { id: params.id },
    select: { ownerId: true },
  });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (!isSuperAdmin(session) && existing.ownerId !== session.userId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const data: Record<string, string | null> = {};
  if (body.instanceId !== undefined) data.greenApiInstanceId = body.instanceId || null;
  if (body.token !== undefined) data.greenApiToken = body.token || null;
  if (body.phone !== undefined) data.whatsappNumber = body.phone || null;

  await prisma.client.update({ where: { id: params.id }, data });

  // Check status after saving
  const status = body.instanceId && body.token
    ? await getWhatsAppStatus({ greenApiInstanceId: body.instanceId, greenApiToken: body.token })
    : "not_configured";

  return NextResponse.json({ ok: true, status });
}
