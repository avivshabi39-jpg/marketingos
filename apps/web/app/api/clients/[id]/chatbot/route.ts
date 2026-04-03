import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession, isSuperAdmin } from "@/lib/auth";

// GET /api/clients/:id/chatbot
export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (session.clientId && session.clientId !== params.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const client = await prisma.client.findUnique({
    where: { id: params.id },
    select: {
      id: true,
      chatbotEnabled: true,
      chatbotGreeting: true,
      chatbotFAQ: true,
      chatbotSchedule: true,
      chatbotAutoReply: true,
      ownerId: true,
    },
  });

  if (!client) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (!session.clientId && !isSuperAdmin(session)) {
    if (client.ownerId !== session.userId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  }

  return NextResponse.json({
    chatbotEnabled: client.chatbotEnabled,
    chatbotGreeting: client.chatbotGreeting ?? "שלום! איך אוכל לעזור?",
    chatbotFAQ: (client.chatbotFAQ as Array<{ q: string; a: string }>) ?? [],
    chatbotSchedule: (client.chatbotSchedule as { start: string; end: string; alwaysOn?: boolean; days?: number[] }) ?? {
      start: "09:00",
      end: "22:00",
      alwaysOn: false,
      days: [0, 1, 2, 3, 4, 5],
    },
    chatbotAutoReply: client.chatbotAutoReply,
  });
}

// PUT /api/clients/:id/chatbot
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (!isSuperAdmin(session)) {
    const client = await prisma.client.findUnique({
      where: { id: params.id },
      select: { ownerId: true },
    });
    if (!client || client.ownerId !== session.userId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  }

  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Invalid body" }, { status: 400 });

  const {
    chatbotEnabled,
    chatbotGreeting,
    chatbotFAQ,
    chatbotSchedule,
    chatbotAutoReply,
  } = body as {
    chatbotEnabled?: boolean;
    chatbotGreeting?: string;
    chatbotFAQ?: Array<{ q: string; a: string }>;
    chatbotSchedule?: { start: string; end: string; alwaysOn?: boolean; days?: number[] };
    chatbotAutoReply?: boolean;
  };

  const data: Record<string, unknown> = {};
  if (chatbotEnabled !== undefined) data.chatbotEnabled = chatbotEnabled;
  if (chatbotGreeting !== undefined) data.chatbotGreeting = chatbotGreeting;
  if (chatbotFAQ !== undefined) data.chatbotFAQ = chatbotFAQ;
  if (chatbotSchedule !== undefined) data.chatbotSchedule = chatbotSchedule;
  if (chatbotAutoReply !== undefined) data.chatbotAutoReply = chatbotAutoReply;

  const updated = await prisma.client.update({
    where: { id: params.id },
    data,
    select: {
      chatbotEnabled: true,
      chatbotGreeting: true,
      chatbotFAQ: true,
      chatbotSchedule: true,
      chatbotAutoReply: true,
    },
  });

  return NextResponse.json(updated);
}
