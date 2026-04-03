import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { ReviewsClient } from "./ReviewsClient";

export default async function ReviewsPage({ params }: { params: { id: string } }) {
  const client = await prisma.client.findUnique({
    where: { id: params.id },
    select: {
      id: true,
      name: true,
      googleBusinessUrl: true,
      greenApiInstanceId: true,
      greenApiToken: true,
      leads: {
        where: { status: "WON" },
        orderBy: { createdAt: "desc" },
        take: 50,
        select: {
          id: true,
          firstName: true,
          lastName: true,
          phone: true,
          email: true,
          createdAt: true,
        },
      },
    },
  });

  if (!client) notFound();

  return (
    <ReviewsClient
      clientId={client.id}
      clientName={client.name}
      googleBusinessUrl={client.googleBusinessUrl}
      hasWhatsApp={!!(client.greenApiInstanceId && client.greenApiToken)}
      wonLeads={client.leads}
    />
  );
}
