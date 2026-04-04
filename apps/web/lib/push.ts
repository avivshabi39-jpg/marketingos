import { prisma } from "@/lib/prisma";

export async function sendPushNotification(
  userId: string,
  payload: { title: string; body: string; url?: string }
): Promise<boolean> {
  try {
    const sub = await prisma.pushSubscription.findUnique({ where: { userId } });
    if (!sub) return false;

    const webpush = await import("web-push");
    const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
    const privateKey = process.env.VAPID_PRIVATE_KEY;
    if (!publicKey || !privateKey) return false;

    webpush.default.setVapidDetails("mailto:admin@marketingos.co.il", publicKey, privateKey);

    await webpush.default.sendNotification(
      JSON.parse(sub.subscription),
      JSON.stringify({ title: payload.title, body: payload.body, url: payload.url ?? "/admin/leads" })
    );
    return true;
  } catch (err) {
    console.error("[push] Failed:", err instanceof Error ? err.message : err);
    return false;
  }
}
