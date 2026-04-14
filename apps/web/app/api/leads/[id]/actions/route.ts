import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { getClientSession } from "@/lib/clientAuth";
import { sendAutoReply } from "@/lib/autoReply";
import { sendWhatsApp } from "@/lib/whatsapp";
import { decrypt } from "@/lib/encrypt";
import { verifyLeadOwnership } from "@/lib/rls";
import { isSuperAdmin } from "@/lib/auth";

const schema = z.object({
  action: z.enum(["resend_auto_reply", "send_followup", "pause_followups", "resume_followups"]),
});

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const clientPortal = await getClientSession();
  const session = clientPortal ? null : await getSession();
  if (!session && !clientPortal) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const lead = await prisma.lead.findUnique({
    where: { id: params.id },
    include: {
      client: {
        select: {
          id: true, name: true, whatsappNumber: true, agentPhone: true,
          greenApiInstanceId: true, greenApiToken: true,
          autoReplyActive: true, whatsappTemplate: true,
        },
      },
    },
  });

  if (!lead) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Ownership check
  if (clientPortal && clientPortal.clientId !== lead.clientId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  if (session && !isSuperAdmin(session) && !(await verifyLeadOwnership(params.id, session.userId, false))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const { action } = parsed.data;

  // ─── Action 1: Resend Auto Reply ───
  if (action === "resend_auto_reply") {
    if (!lead.phone) return NextResponse.json({ error: "ליד בלי טלפון" }, { status: 400 });

    // Dedup: check if auto-reply was sent in last 5 minutes
    const fiveMinAgo = new Date(Date.now() - 5 * 60 * 1000);
    const recentReply = await prisma.leadActivity.findFirst({
      where: {
        leadId: lead.id,
        content: { contains: "חזרה אוטומטית" },
        createdAt: { gte: fiveMinAgo },
      },
    });
    if (recentReply) {
      return NextResponse.json({ error: "כבר נשלח בדקות האחרונות", duplicate: true }, { status: 429 });
    }

    try {
      const { leadReplied } = await sendAutoReply(
        { firstName: lead.firstName, lastName: lead.lastName, phone: lead.phone, source: lead.source },
        lead.client
      );

      prisma.leadActivity.create({
        data: { leadId: lead.id, type: "note", content: "📩 חזרה אוטומטית נשלחה ידנית" },
      }).catch((err) => console.error("[automation] resend activity log failed:", err));

      return NextResponse.json({ ok: true, sent: leadReplied });
    } catch (err) {
      console.error("[automation] resend auto-reply failed:", err);
      return NextResponse.json({ error: "שליחה נכשלה" }, { status: 500 });
    }
  }

  // ─── Action 2: Send Follow-up Now ───
  if (action === "send_followup") {
    if (!lead.phone) return NextResponse.json({ error: "ליד בלי טלפון" }, { status: 400 });
    if (!lead.client.greenApiInstanceId || !lead.client.greenApiToken) {
      return NextResponse.json({ error: "וואצאפ לא מוגדר" }, { status: 400 });
    }

    const message = `שלום ${lead.firstName}! 👋\n\nפנית אלינו ב${lead.client.name} ורצינו לוודא שקיבלת מענה.\nאנחנו כאן לעזור — מתי נוח לך לדבר? 📞`;

    let rawToken: string;
    try {
      rawToken = decrypt(lead.client.greenApiToken);
    } catch {
      return NextResponse.json({ error: "שגיאת הגדרות וואצאפ" }, { status: 500 });
    }

    const result = await sendWhatsApp(lead.phone, message, lead.client.greenApiInstanceId, rawToken);

    // Mark in metadata
    const existingMeta = (lead.metadata && typeof lead.metadata === "object" && !Array.isArray(lead.metadata))
      ? (lead.metadata as Record<string, unknown>) : {};
    prisma.lead.update({
      where: { id: lead.id },
      data: { metadata: { ...existingMeta, manualFollowUp: true, manualFollowUpAt: new Date().toISOString() } },
    }).catch((err) => console.error("[automation] followup metadata update failed:", err));

    prisma.leadActivity.create({
      data: { leadId: lead.id, type: "note", content: "⏱️ מעקב נשלח ידנית" },
    }).catch((err) => console.error("[automation] followup activity log failed:", err));

    return NextResponse.json({ ok: result.ok, error: result.ok ? undefined : result.error });
  }

  // ─── Action 3: Pause / Resume Follow-ups ───
  if (action === "pause_followups" || action === "resume_followups") {
    const paused = action === "pause_followups";
    const existingMeta = (lead.metadata && typeof lead.metadata === "object" && !Array.isArray(lead.metadata))
      ? (lead.metadata as Record<string, unknown>) : {};

    await prisma.lead.update({
      where: { id: lead.id },
      data: { metadata: { ...existingMeta, followUpPaused: paused } },
    });

    prisma.leadActivity.create({
      data: {
        leadId: lead.id,
        type: "note",
        content: paused ? "⏸️ מעקבים אוטומטיים הושהו" : "▶️ מעקבים אוטומטיים חודשו",
      },
    }).catch((err) => console.error("[automation] pause/resume activity log failed:", err));

    return NextResponse.json({ ok: true, paused });
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}
