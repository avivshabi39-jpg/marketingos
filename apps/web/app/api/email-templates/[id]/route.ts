import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Resend } from "resend";

const updateSchema = z.object({
  name:     z.string().min(1).max(100).optional(),
  subject:  z.string().min(1).max(300).optional(),
  bodyHtml: z.string().min(1).optional(),
  type:     z.enum(["welcome", "followup", "report", "property-alert", "custom"]).optional(),
});

async function assertOwner(userId: string, templateId: string) {
  const t = await prisma.emailTemplate.findUnique({ where: { id: templateId } });
  if (!t || t.ownerId !== userId) return null;
  return t;
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const t = await assertOwner(session.userId, params.id);
  if (!t) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await req.json().catch(() => null);
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const updated = await prisma.emailTemplate.update({ where: { id: params.id }, data: parsed.data });
  return NextResponse.json({ template: updated });
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const t = await assertOwner(session.userId, params.id);
  if (!t) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await prisma.emailTemplate.delete({ where: { id: params.id } });
  return new NextResponse(null, { status: 204 });
}

// POST /api/email-templates/[id]?action=send-test — send test email
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const t = await assertOwner(session.userId, params.id);
  if (!t) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const { searchParams } = new URL(req.url);
  if (searchParams.get("action") !== "send-test") {
    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  }

  const body = await req.json().catch(() => ({}));
  const toEmail = body.email ?? session.email;
  if (!toEmail) return NextResponse.json({ error: "No email" }, { status: 400 });

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return NextResponse.json({ error: "RESEND_API_KEY not configured" }, { status: 500 });

  const resend = new Resend(apiKey);
  // Replace variables with test values
  const rendered = t.bodyHtml
    .replace(/\{name\}/g, "ישראל ישראלי")
    .replace(/\{phone\}/g, "050-0000000")
    .replace(/\{property\}/g, "דירת 4 חדרים בתל אביב")
    .replace(/\{price\}/g, "₪2,500,000");

  const { error } = await resend.emails.send({
    from: process.env.RESEND_FROM ?? "noreply@marketingos.co.il",
    to: toEmail,
    subject: `[בדיקה] ${t.subject}`,
    html: rendered,
  });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
