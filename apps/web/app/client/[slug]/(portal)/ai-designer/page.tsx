import { getClientSession } from "@/lib/clientAuth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { PortalDesignerClient } from "./PortalDesignerClient";

export default async function PortalDesignerPage({
  params,
}: {
  params: { slug: string };
}) {
  const session = await getClientSession();
  if (!session || session.slug !== params.slug)
    redirect(`/client/${params.slug}/login`);

  const client = await prisma.client.findUnique({
    where: { slug: params.slug },
    select: {
      id: true,
      name: true,
      slug: true,
      industry: true,
      primaryColor: true,
    },
  });

  if (!client) redirect("/");

  const savedImages = await prisma.campaignImage
    .findMany({
      where: { clientId: client.id, template: "ai_photo" },
      orderBy: { createdAt: "desc" },
      take: 12,
      select: {
        id: true,
        imageUrl: true,
        headline: true,
        imageType: true,
        createdAt: true,
      },
    })
    .catch(() => []);

  return (
    <PortalDesignerClient
      client={client}
      savedImages={savedImages.map((img) => ({
        id: img.id,
        imageUrl: img.imageUrl ?? "",
        platform: img.imageType ?? "instagram",
        createdAt: img.createdAt,
      }))}
    />
  );
}
