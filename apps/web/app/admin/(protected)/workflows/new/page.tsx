import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { CreateWorkflowForm } from "@/components/admin/CreateWorkflowForm";

export default async function NewWorkflowPage({
  searchParams,
}: {
  searchParams: { clientId?: string };
}) {
  const session = await getSession();

  const clients = await prisma.client.findMany({
    where: {
      isActive: true,
      ...(session?.clientId ? { id: session.clientId } : {}),
    },
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Create Workflow</h1>
        <p className="text-slate-500 mt-1">Add a new workflow and assign it to a client.</p>
      </div>

      {clients.length === 0 ? (
        <p className="text-sm text-slate-500">No active clients found. Please create a client first.</p>
      ) : (
        <CreateWorkflowForm
          clients={clients}
          defaultClientId={searchParams.clientId ?? clients[0]?.id}
        />
      )}
    </div>
  );
}
