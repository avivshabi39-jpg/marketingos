import { createHmac } from "crypto";
import { prisma } from "@/lib/prisma";
import { decrypt } from "@/lib/encrypt";

export async function triggerN8nWebhook(
  clientId: string,
  event: string,
  data: object
): Promise<void> {
  const client = await prisma.client.findUnique({
    where: { id: clientId },
    select: {
      id: true, name: true, slug: true, n8nWebhookUrl: true,
      whatsappNumber: true, whatsappTemplate: true, autoReplyActive: true,
    },
  });

  if (!client?.n8nWebhookUrl) return;
  const webhookUrl = decrypt(client.n8nWebhookUrl);

  const payload = {
    event,
    timestamp: new Date().toISOString(),
    client: {
      id: client.id,
      name: client.name,
      slug: client.slug,
      whatsappNumber:    client.whatsappNumber   ?? null,
      whatsappTemplate:  client.whatsappTemplate  ?? "שלום {name}! קיבלנו את פנייתך ונחזור אליך בהקדם 😊",
      autoReplyActive:   client.autoReplyActive,
    },
    data,
  };

  const body = JSON.stringify(payload);
  const secret = process.env.WEBHOOK_SECRET ?? "";
  const signature = createHmac("sha256", secret).update(body).digest("hex");

  try {
    await fetch(webhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-webhook-signature": signature,
        "x-webhook-event": event,
      },
      body,
      signal: AbortSignal.timeout(10_000),
    });
  } catch {
    // Webhook failures are non-fatal — log but don't throw
    console.error(`[webhook] Failed to trigger ${event} for client ${clientId}`);
  }
}
