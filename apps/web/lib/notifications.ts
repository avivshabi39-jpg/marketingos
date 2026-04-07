import { prisma } from "@/lib/prisma";

type NotificationType = "lead_new" | "lead_status" | "broadcast_sent" | "appointment";

export async function createNotification(params: {
  clientId: string;
  type: NotificationType;
  title: string;
  body: string;
}): Promise<void> {
  try {
    await prisma.notification.create({ data: params });
  } catch (err) {
    console.error("[notifications] Failed:", err);
  }
}

export function getNotificationIcon(type: string): string {
  return (
    { lead_new: "👤", lead_status: "🔄", broadcast_sent: "📢", appointment: "📅" }[type] ?? "🔔"
  );
}

export function formatRelativeTime(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  const m = Math.floor((Date.now() - d.getTime()) / 60000);
  if (m < 1) return "עכשיו";
  if (m < 60) return `לפני ${m} דקות`;
  const h = Math.floor(m / 60);
  if (h < 24) return `לפני ${h} שעות`;
  const dy = Math.floor(h / 24);
  if (dy < 7) return `לפני ${dy} ימים`;
  return d.toLocaleDateString("he-IL");
}
