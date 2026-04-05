import { inngest } from "@/lib/inngest";
import { prisma } from "@/lib/prisma";

// ─── Send WhatsApp Message ───────────────────────────────────────────────────

export const sendWhatsAppMessage = inngest.createFunction(
  {
    id: "send-whatsapp-message",
    retries: 3,
    throttle: { limit: 20, period: "1m" },
    triggers: [{ event: "whatsapp/send" }],
  },
  async ({ event, step }: { event: { data: Record<string, unknown> }; step: any }) => {
    const { instanceId, token, phone, message, leadId } = event.data as {
      instanceId: string;
      token: string;
      phone: string;
      message: string;
      clientId: string;
      leadId?: string;
    };

    const result = await step.run("send-message", async () => {
      const chatId = phone.replace(/[^0-9]/g, "") + "@c.us";
      const res = await fetch(
        `https://api.green-api.com/waInstance${instanceId}/sendMessage/${token}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ chatId, message }),
        }
      );
      if (!res.ok) throw new Error(`WhatsApp API error: ${res.status}`);
      return res.json();
    });

    if (leadId) {
      await step.run("update-lead", async () => {
        await prisma.lead
          .update({ where: { id: leadId as string }, data: { autoReplied: true } })
          .catch(() => {});
      });
    }

    return { success: true, messageId: result?.idMessage };
  }
);

// ─── Broadcast to Multiple Leads ─────────────────────────────────────────────

export const sendBroadcast = inngest.createFunction(
  {
    id: "send-broadcast",
    retries: 2,
    throttle: { limit: 5, period: "1m" },
    triggers: [{ event: "broadcast/send" }],
  },
  async ({ event, step }: { event: { data: Record<string, unknown> }; step: any }) => {
    const { broadcastId, message, instanceId, token, phones } = event.data as {
      broadcastId: string;
      clientId: string;
      message: string;
      phones: string[];
      instanceId: string;
      token: string;
    };

    let sent = 0;
    let failed = 0;

    for (let i = 0; i < phones.length; i++) {
      await step.run(`send-${i}`, async () => {
        const chatId = phones[i].replace(/[^0-9]/g, "") + "@c.us";
        const res = await fetch(
          `https://api.green-api.com/waInstance${instanceId}/sendMessage/${token}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ chatId, message }),
          }
        );
        if (res.ok) sent++;
        else failed++;
      });

      if (i < phones.length - 1) {
        await step.sleep(`delay-${i}`, "2s");
      }
    }

    await step.run("update-stats", async () => {
      await prisma.broadcastLog
        .update({
          where: { id: broadcastId },
          data: {
            sentCount: sent,
            failCount: failed,
            status: "completed",
            completedAt: new Date(),
          },
        })
        .catch(() => {});
    });

    return { sent, failed, total: phones.length };
  }
);

// ─── Lead Follow-up (Drip) ───────────────────────────────────────────────────

export const leadFollowup = inngest.createFunction(
  {
    id: "lead-followup",
    retries: 2,
    triggers: [{ event: "lead/followup" }],
  },
  async ({ event, step }: { event: { data: Record<string, unknown> }; step: any }) => {
    const { leadId, clientId, message, delayHours } = event.data as {
      leadId: string;
      clientId: string;
      message: string;
      delayHours: number;
    };

    if (delayHours > 0) {
      await step.sleep("wait-delay", `${delayHours}h`);
    }

    await step.run("send-followup", async () => {
      const [lead, client] = await Promise.all([
        prisma.lead.findUnique({
          where: { id: leadId },
          select: { phone: true, firstName: true, status: true },
        }),
        prisma.client.findUnique({
          where: { id: clientId },
          select: { greenApiInstanceId: true, greenApiToken: true },
        }),
      ]);

      if (!lead?.phone || !client?.greenApiInstanceId || !client?.greenApiToken)
        return;
      if (lead.status === "WON" || lead.status === "LOST") return;

      const chatId = lead.phone.replace(/[^0-9]/g, "") + "@c.us";
      const personalMsg = message.replace("{שם}", lead.firstName || "");

      await fetch(
        `https://api.green-api.com/waInstance${client.greenApiInstanceId}/sendMessage/${client.greenApiToken}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ chatId, message: personalMsg }),
        }
      );
    });

    return { success: true };
  }
);

export const inngestFunctions = [
  sendWhatsAppMessage,
  sendBroadcast,
  leadFollowup,
];
