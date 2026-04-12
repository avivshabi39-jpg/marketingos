import { MetadataRoute } from "next";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const revalidate = 3600; // Regenerate every hour

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "";

  const clients = await prisma.client.findMany({
    where: { pagePublished: true },
    select: {
      slug: true,
      updatedAt: true,
      _count: { select: { leads: true } },
    },
    orderBy: { updatedAt: "desc" },
  });

  const clientPages = clients.map((c) => ({
    url: `${appUrl}/${c.slug}`,
    lastModified: c.updatedAt,
    changeFrequency: "weekly" as const,
    priority: Math.min(0.9, 0.6 + c._count.leads * 0.01),
  }));

  return [
    { url: appUrl, lastModified: new Date(), changeFrequency: "daily", priority: 1 },
    { url: `${appUrl}/pricing`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.8 },
    { url: `${appUrl}/register`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.9 },
    ...clientPages,
  ];
}
