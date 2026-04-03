import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { getClientSession } from "@/lib/clientAuth";

type LogEntry = { id: string; date: string; text: string };

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const [adminSession, clientSession] = await Promise.all([
    getSession(),
    getClientSession(),
  ]);
  if (!adminSession && !clientSession) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const property = await prisma.property.findUnique({
    where: { id },
    select: { clientId: true, marketingLog: true },
  });
  if (!property) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (clientSession && clientSession.clientId !== property.clientId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json().catch(() => ({})) as { entry?: string; deleteId?: string };

  const existing = (property.marketingLog as LogEntry[]) ?? [];

  let updated: LogEntry[];
  if (body.deleteId) {
    updated = existing.filter((e) => e.id !== body.deleteId);
  } else {
    if (!body.entry?.trim()) {
      return NextResponse.json({ error: "entry is required" }, { status: 400 });
    }
    const newEntry: LogEntry = {
      id: Math.random().toString(36).slice(2),
      date: new Date().toISOString(),
      text: body.entry.trim(),
    };
    updated = [newEntry, ...existing];
  }

  const result = await prisma.property.update({
    where: { id },
    data: { marketingLog: updated },
    select: { marketingLog: true },
  });

  return NextResponse.json({ marketingLog: result.marketingLog });
}
