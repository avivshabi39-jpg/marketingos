import { MetadataRoute } from "next";
import { prisma } from "@/lib/prisma";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "";

  const clients = await prisma.client.findMany({
    where: { pagePublished: true },
    select: { slug: true, updatedAt: true },
  });

  return [
    { url: appUrl, lastModified: new Date(), changeFrequency: "daily", priority: 1 },
    { url: `${appUrl}/pricing`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.7 },
    { url: `${appUrl}/register`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.9 },
    ...clients.map((c) => ({
      url: `${appUrl}/${c.slug}`,
      lastModified: c.updatedAt,
      changeFrequency: "weekly" as const,
      priority: 0.8,
    })),
  ];
}
