import { prisma } from "@/lib/prisma";
import { CreateLeadForm } from "@/components/admin/CreateLeadForm";

export default async function NewLeadPage() {
  const clients = await prisma.client.findMany({
    where: { isActive: true },
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Create Lead</h1>
        <p className="text-gray-500 mt-1">Add a new lead manually and assign it to a client.</p>
      </div>

      {clients.length === 0 ? (
        <p className="text-sm text-gray-500">
          No active clients found. Please create a client first.
        </p>
      ) : (
        <CreateLeadForm clients={clients} />
      )}
    </div>
  );
}
