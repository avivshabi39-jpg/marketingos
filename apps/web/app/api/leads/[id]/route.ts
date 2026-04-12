import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSession, isSuperAdmin } from "@/lib/auth";
import { triggerN8nWebhook } from "@/lib/webhooks";
import { triggerN8nWebhook as triggerN8nDirect } from "@/lib/n8n";
import { verifyLeadOwnership } from "@/lib/rls";
import { createNotification } from "@/lib/notifications";

const updateSchema = z.object({
  status:     z.enum(["NEW", "CONTACTED", "QUALIFIED", "PROPOSAL", "WON", "LOST"]).optional(),
  notes:      z.string().optional(),
  phone:      z.string().optional(),
  leadScore:  z.number().int().min(0).max(100).optional(),
  value:      z.number().optional(),
  followUpAt: z.string().datetime().optional(),
  closedAt:   z.string().datetime().optional(),
  lostReason: z.string().max(200).optional(),
});

// GET /api/leads/:id
export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const lead = await prisma.lead.findUnique({
    where: { id: params.id },
    include: { client: true, landingPage: true },
  });

  if (!lead) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Scoped agent check
  if (session.clientId && lead.clientId !== session.clientId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  // Owner check (non-super-admin must own the lead's client)
  if (!session.clientId && !(await verifyLeadOwnership(params.id, session.userId, isSuperAdmin(session)))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  return NextResponse.json({ lead });
}

// PATCH /api/leads/:id
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const lead = await prisma.lead.findUnique({ where: { id: params.id } });
  if (!lead) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (session.clientId && lead.clientId !== session.clientId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  if (!session.clientId && !(await verifyLeadOwnership(params.id, session.userId, isSuperAdmin(session)))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json().catch(() => null);
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const statusChanged = parsed.data.status && parsed.data.status !== lead.status;
  const { lostReason, ...updateFields } = parsed.data;

  // Merge lostReason into metadata JSON (avoids schema migration)
  // Guard: only merge if status is LOST, and safely handle non-object metadata
  const existingMeta = (lead.metadata && typeof lead.metadata === "object" && !Array.isArray(lead.metadata))
    ? (lead.metadata as Record<string, unknown>)
    : {};
  const metadataUpdate = (lostReason && parsed.data.status === "LOST")
    ? { metadata: { ...existingMeta, lostReason } }
    : {};

  const updated = await prisma.lead.update({
    where: { id: params.id },
    data: {
      ...updateFields,
      ...metadataUpdate,
      ...(updateFields.followUpAt ? { followUpAt: new Date(updateFields.followUpAt) } : {}),
      ...(updateFields.closedAt ? { closedAt: new Date(updateFields.closedAt) } : {}),
    },
  });

  // If status was updated, log activity
  if (statusChanged && parsed.data.status) {
    prisma.leadActivity.create({
      data: {
        leadId: params.id,
        type: "status_change",
        content: lostReason
          ? `${lead.status} → ${parsed.data.status} (${lostReason})`
          : `${lead.status} → ${parsed.data.status}`,
        meta: { from: lead.status, to: parsed.data.status, ...(lostReason ? { lostReason } : {}) },
      },
    }).catch(() => {});
  }

  // Trigger n8n webhook on status change
  if (statusChanged) {
    triggerN8nWebhook(lead.clientId, "lead.status_changed", {
      lead: {
        id: lead.id,
        name: `${lead.firstName} ${lead.lastName}`,
        oldStatus: lead.status,
        newStatus: parsed.data.status,
      },
    }).catch(() => {});

    // Fire n8n Railway direct webhook
    triggerN8nDirect("lead-status-change", {
      leadId: updated.id,
      clientId: updated.clientId,
      name: `${lead.firstName} ${lead.lastName}`,
      phone: lead.phone ?? "",
      oldStatus: lead.status,
      newStatus: parsed.data.status,
      updatedAt: updated.updatedAt.toISOString(),
    }).catch(() => {});

    createNotification({
      clientId: updated.clientId,
      type: "lead_status",
      title: "סטטוס ליד עודכן",
      body: `${lead.firstName} ${lead.lastName}: ${lead.status} → ${parsed.data.status}`,
    }).catch(() => {});
  }

  return NextResponse.json({ lead: updated });
}

// DELETE /api/leads/:id
export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const lead = await prisma.lead.findUnique({ where: { id: params.id } });
  if (!lead) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (session.clientId && lead.clientId !== session.clientId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  if (!session.clientId && !(await verifyLeadOwnership(params.id, session.userId, isSuperAdmin(session)))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await prisma.lead.delete({ where: { id: params.id } });
  return new NextResponse(null, { status: 204 });
}
