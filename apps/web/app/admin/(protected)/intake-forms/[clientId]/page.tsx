import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { ArrowRight, Download } from "lucide-react";
import { IntakeResponsesTable } from "@/components/admin/IntakeResponsesTable";

export default async function IntakeResponsesPage({
  params,
}: {
  params: { clientId: string };
}) {
  const client = await prisma.client.findUnique({
    where: { id: params.clientId },
    select: { id: true, name: true, slug: true, primaryColor: true, industry: true },
  });

  if (!client) notFound();

  const forms = await prisma.intakeForm.findMany({
    where: { clientId: params.clientId },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-6" dir="rtl">
      <div className="flex items-center gap-3">
        <Link href="/admin/intake-forms" className="text-slate-400 hover:text-slate-600">
          <ArrowRight size={18} />
        </Link>
        <div className="flex items-center gap-3 flex-1">
          <div
            className="w-9 h-9 rounded-lg flex items-center justify-center text-white font-bold text-sm flex-shrink-0"
            style={{ backgroundColor: client.primaryColor }}
          >
            {client.name[0]}
          </div>
          <div>
            <h1 className="text-xl font-semibold text-slate-900">
              טפסי קבלה — {client.name}
            </h1>
            <p className="text-sm text-slate-500">{forms.length} תגובות</p>
          </div>
        </div>
      </div>

      <IntakeResponsesTable
        forms={forms}
        clientName={client.name}
        clientId={client.id}
        clientSlug={client.slug}
      />
    </div>
  );
}
