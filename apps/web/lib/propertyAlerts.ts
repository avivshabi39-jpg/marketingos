import { prisma } from "@/lib/prisma";
import { sendWhatsApp, normalizePhone } from "@/lib/whatsapp";
import { decrypt } from "@/lib/encrypt";

type Property = {
  id: string;
  clientId: string;
  title: string;
  price: number;
  rooms: number | null;
  city: string;
  slug: string;
};

/**
 * When a new property is created, find matching PropertyAlert subscribers
 * and send them a WhatsApp notification.
 */
export async function notifyPropertyAlertSubscribers(property: Property) {
  const client = await prisma.client.findUnique({
    where: { id: property.clientId },
    select: {
      name: true,
      slug: true,
      greenApiInstanceId: true,
      greenApiToken: true,
    },
  });

  if (!client?.greenApiInstanceId || !client?.greenApiToken) return;

  const alerts = await prisma.propertyAlert.findMany({
    where: {
      clientId: property.clientId,
      isActive: true,
      ...(property.city ? {
        OR: [{ city: null }, { city: property.city }],
      } : {}),
      ...(property.rooms != null ? {
        OR: [{ rooms: null }, { rooms: { lte: property.rooms + 0.5, gte: property.rooms - 0.5 } }],
      } : {}),
      // 20% budget tolerance: match subscribers whose budget is at least 83% of property price
      ...(property.price ? {
        OR: [{ budget: null }, { budget: { gte: property.price / 1.2 } }],
      } : {}),
    },
    take: 50,
  });

  const priceFormatted = `₪${property.price.toLocaleString("he-IL")}`;
  const url = `https://${client.slug}.marketingos.co.il/property/${property.slug}`;

  for (const alert of alerts) {
    if (!normalizePhone(alert.phone)) continue;

    const message = [
      `🏠 *שלום ${alert.name}!*`,
      ``,
      `מצאנו נכס חדש שמתאים לדרישות שלך:`,
      ``,
      `📍 *${property.title}*`,
      `💰 *מחיר:* ${priceFormatted}`,
      ...(property.rooms != null ? [`🛏 *חדרים:* ${property.rooms}`] : []),
      `📍 *עיר:* ${property.city}`,
      ``,
      `👆 לפרטים נוספים: ${url}`,
    ].join("\n");

    const decryptedToken = decrypt(client.greenApiToken!);
    sendWhatsApp(alert.phone, message, client.greenApiInstanceId!, decryptedToken).catch(() => {});
  }
}
