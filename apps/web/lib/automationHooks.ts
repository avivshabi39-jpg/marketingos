/**
 * Automation Hooks — centralized event system for MarketingOS
 *
 * Emits lightweight events that can be consumed by:
 * - Client webhook URL (n8nWebhookUrl on Client model)
 * - Global n8n Railway instance
 * - Internal notifications
 * - Future: event store, analytics, queue
 *
 * All hooks are fire-and-forget (non-blocking).
 * Failures are logged but never crash the calling flow.
 *
 * Standard webhook payload (sent to ALL external receivers):
 * {
 *   event: "lead.created",
 *   clientId: "...",
 *   timestamp: "2026-04-13T10:00:00.000Z",
 *   data: { leadId: "...", ... }
 * }
 */

import { createHmac } from "crypto";
import { prisma } from "@/lib/prisma";
import { triggerN8nWebhook as triggerN8nDirect } from "@/lib/n8n";
import { createNotification } from "@/lib/notifications";
import { decrypt } from "@/lib/encrypt";

// ── Event Types ──────────────────────────────────────────────────────────────

export type AutomationEvent =
  | "lead.created"
  | "lead.status_changed"
  | "lead.lost"
  | "page.published"
  | "appointment.created"
  | "whatsapp.sent"
  | "whatsapp.failed";

export interface AutomationPayload {
  event: AutomationEvent;
  clientId: string;
  timestamp: string;
  data: Record<string, unknown>;
}

// ── Centralized webhook sender ───────────────────────────────────────────────

/**
 * Send a standardized webhook event to a URL. Never throws.
 * Includes HMAC-SHA256 signature for verification on the receiving end.
 */
async function sendWebhookEvent(
  url: string,
  payload: AutomationPayload
): Promise<boolean> {
  try {
    const body = JSON.stringify(payload);
    const secret = process.env.WEBHOOK_SECRET ?? "";
    const signature = secret
      ? createHmac("sha256", secret).update(body).digest("hex")
      : "";

    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-webhook-event": payload.event,
        ...(signature ? { "x-webhook-signature": signature } : {}),
      },
      body,
      signal: AbortSignal.timeout(10_000),
    });

    if (res.ok) {
      console.log(`[webhook] ✓ ${payload.event} → ${url.slice(0, 60)}...`);
      return true;
    }

    console.warn(`[webhook] ✗ ${payload.event} → ${res.status} from ${url.slice(0, 60)}`);
    return false;
  } catch (err) {
    console.error(`[webhook] ✗ ${payload.event} → error:`, err instanceof Error ? err.message : err);
    return false;
  }
}

// ── Core emit function ───────────────────────────────────────────────────────

/**
 * Emit an automation event. Non-blocking, never throws.
 * Sends to: client webhook URL + global n8n + in-app notifications.
 */
export async function emitAutomationEvent(payload: AutomationPayload): Promise<void> {
  const { event, clientId, data } = payload;

  try {
    // 1. Send to client's configured webhook URL (n8nWebhookUrl)
    sendClientWebhook(clientId, payload);

    // 2. Send to global n8n Railway instance (if configured)
    triggerN8nDirect(event, { clientId, ...data, timestamp: payload.timestamp })
      .catch((err) => console.error(`[automation-hook] n8n-direct failed for ${event}:`, err));

    // 3. Create in-app notification for relevant events
    const notif = buildNotification(event, data);
    if (notif) {
      createNotification({ clientId, ...notif })
        .catch((err) => console.error(`[automation-hook] notification failed for ${event}:`, err));
    }

    // 4. Log for debugging
    console.log(`[automation-hook] ${event} | client=${clientId}`);
  } catch (err) {
    console.error(`[automation-hook] Unexpected error in ${event}:`, err);
  }
}

/**
 * Send webhook to client's configured URL (from Client.n8nWebhookUrl).
 * Non-blocking, never throws.
 */
async function sendClientWebhook(clientId: string, payload: AutomationPayload): Promise<void> {
  try {
    const client = await prisma.client.findUnique({
      where: { id: clientId },
      select: { n8nWebhookUrl: true },
    });

    if (!client?.n8nWebhookUrl) return; // No webhook configured — skip silently

    let url: string;
    try {
      url = decrypt(client.n8nWebhookUrl);
    } catch {
      console.error(`[webhook] Failed to decrypt webhook URL for client ${clientId}`);
      return;
    }

    if (!url || !url.startsWith("http")) return;

    sendWebhookEvent(url, payload);
  } catch (err) {
    console.error(`[webhook] Client webhook failed for ${clientId}:`, err);
  }
}

// ── Notification builder ─────────────────────────────────────────────────────

function buildNotification(
  event: AutomationEvent,
  data: Record<string, unknown>
): { type: string; title: string; body: string } | null {
  switch (event) {
    case "page.published":
      return {
        type: "page_published",
        title: "דף נחיתה פורסם! 🌐",
        body: "הדף שלך באוויר ומוכן לקבל לידים",
      };
    case "appointment.created":
      return {
        type: "appointment",
        title: "פגישה חדשה נקבעה 📅",
        body: `${(data.name as string) ?? "פגישה"} — ${(data.scheduledAt as string) ?? ""}`,
      };
    case "whatsapp.failed":
      return {
        type: "whatsapp_failed",
        title: "שליחת וואצאפ נכשלה ⚠️",
        body: `ליד: ${(data.leadName as string) ?? "לא ידוע"} — ${(data.error as string) ?? ""}`,
      };
    default:
      // lead.created, lead.status_changed, lead.lost already have their own notification logic
      return null;
  }
}

// ── Dedup guard: prevents rapid re-emission of same event per client ─────────

const recentEvents = new Map<string, number>();
const DEDUP_WINDOW_MS = 5000; // 5 seconds

function shouldEmit(event: AutomationEvent, clientId: string): boolean {
  const key = `${event}:${clientId}`;
  const last = recentEvents.get(key);
  const now = Date.now();

  if (last && now - last < DEDUP_WINDOW_MS) {
    console.log(`[automation-hook] SKIPPED duplicate ${event} for client=${clientId} (within ${DEDUP_WINDOW_MS}ms)`);
    return false;
  }

  recentEvents.set(key, now);

  // Cleanup old entries every 100 events to prevent memory leak
  if (recentEvents.size > 200) {
    for (const [k, v] of recentEvents) {
      if (now - v > 60000) recentEvents.delete(k);
    }
  }

  return true;
}

// ── Convenience helpers for common events ────────────────────────────────────

export function emitPagePublished(clientId: string, extra?: Record<string, unknown>): void {
  if (!shouldEmit("page.published", clientId)) return;
  emitAutomationEvent({
    event: "page.published",
    clientId,
    timestamp: new Date().toISOString(),
    data: { ...extra },
  });
}

export function emitLeadCreated(
  clientId: string,
  lead: { id: string; firstName: string; lastName: string; phone?: string | null; source?: string | null }
): void {
  if (!shouldEmit("lead.created", `${clientId}:${lead.id}`)) return;
  emitAutomationEvent({
    event: "lead.created",
    clientId,
    timestamp: new Date().toISOString(),
    data: {
      leadId: lead.id,
      leadName: `${lead.firstName} ${lead.lastName}`.trim(),
      phone: lead.phone ?? null,
      source: lead.source ?? null,
    },
  });
}

export function emitLeadStatusChanged(
  clientId: string,
  lead: { id: string; firstName: string; lastName: string },
  oldStatus: string,
  newStatus: string,
  lostReason?: string
): void {
  if (!shouldEmit("lead.status_changed", `${clientId}:${lead.id}:${newStatus}`)) return;
  emitAutomationEvent({
    event: newStatus === "LOST" ? "lead.lost" : "lead.status_changed",
    clientId,
    timestamp: new Date().toISOString(),
    data: {
      leadId: lead.id,
      leadName: `${lead.firstName} ${lead.lastName}`.trim(),
      oldStatus,
      newStatus,
      ...(lostReason ? { lostReason } : {}),
    },
  });
}

export function emitAppointmentCreated(
  clientId: string,
  appointment: { id: string; name: string; scheduledAt: string }
): void {
  emitAutomationEvent({
    event: "appointment.created",
    clientId,
    timestamp: new Date().toISOString(),
    data: {
      appointmentId: appointment.id,
      name: appointment.name,
      scheduledAt: appointment.scheduledAt,
    },
  });
}

export function emitWhatsAppSent(
  clientId: string,
  leadId: string,
  leadName: string,
  messageType: "auto_reply" | "drip_day1" | "drip_day3" | "manual"
): void {
  emitAutomationEvent({
    event: "whatsapp.sent",
    clientId,
    timestamp: new Date().toISOString(),
    data: { leadId, leadName, messageType },
  });
}
