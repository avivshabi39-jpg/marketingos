import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest, { params }: { params: { userId: string } }) {
  const body = (await req.json().catch(() => ({}))) as {
    event?: string;
    data?: { clientId?: string; firstName?: string; lastName?: string; phone?: string; email?: string; source?: string };
  };

  const { event, data } = body;
  if (!event || !data?.clientId) return NextResponse.json({ error: "Missing event or clientId" }, { status: 400 });

  // Verify the client belongs to this user
  const client = await prisma.client.findFirst({ where: { id: data.clientId, ownerId: params.userId } });
  if (!client) return NextResponse.json({ error: "Client not found" }, { status: 404 });

  if (event === "lead.create") {
    await prisma.lead.create({
      data: {
        clientId: data.clientId,
        firstName: data.firstName ?? "ליד",
        lastName: data.lastName ?? "",
        phone: data.phone ?? "",
        email: data.email ?? null,
        source: data.source ?? "WEBHOOK",
        status: "NEW",
      },
    });
  }

  return NextResponse.json({ ok: true });
}
