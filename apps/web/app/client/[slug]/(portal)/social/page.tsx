import { getClientSession } from "@/lib/clientAuth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { PortalSocialClient } from "./PortalSocialClient";

export default async function PortalSocialPage({ params }: { params: { slug: string } }) {
  const session = await getClientSession();
  if (!session || session.slug !== params.slug) redirect(`/client/${params.slug}/login`);

  const client = await prisma.client.findUnique({
    where: { slug: params.slug },
    select: { id: true, name: true, industry: true },
  });
  if (!client) redirect("/");

  const posts = await prisma.socialPost.findMany({
    where: { clientId: client.id },
    orderBy: { createdAt: "desc" },
    take: 20,
    select: { id: true, content: true, platform: true, imageUrl: true, createdAt: true },
  });

  return <PortalSocialClient clientId={client.id} clientName={client.name} posts={posts.map((p) => ({ ...p, createdAt: p.createdAt.toISOString() }))} />;
}
