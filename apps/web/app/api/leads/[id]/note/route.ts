import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

const noteSchema = z.object({
  content: z.string().min(1),
});

// POST /api/leads/:id/note
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = params;

  // Verify lead exists and enforce clientId isolation
  const lead = await prisma.lead.findUnique({
    where: { id },
    select: { id: true, clientId: true },
  });

  if (!lead) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (session.clientId && lead.clientId !== session.clientId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json().catch(() => null);
  const parsed = noteSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const activity = await prisma.leadActivity.create({
    data: {
      leadId: id,
      type: "note",
      content: parsed.data.content,
    },
  });

  return NextResponse.json({ ok: true, activity }, { status: 201 });
}
