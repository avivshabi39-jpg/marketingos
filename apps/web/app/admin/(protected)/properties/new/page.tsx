import { prisma } from "@/lib/prisma";
import { NewPropertyForm } from "./NewPropertyForm";

export const dynamic = "force-dynamic";

export default async function NewPropertyPage() {
  const clients = await prisma.client.findMany({
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });

  return <NewPropertyForm clients={clients} />;
}
