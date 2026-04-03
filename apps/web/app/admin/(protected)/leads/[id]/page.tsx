import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { notFound } from "next/navigation";
import Link from "next/link";
import { LeadTimeline } from "@/components/admin/LeadTimeline";
import { ChevronRight } from "lucide-react";

const STATUS_HE: Record<string, string> = {
  NEW: "חדש",
  CONTACTED: "פנייה בוצעה",
  QUALIFIED: "מוסמך",
  PROPOSAL: "הצעה",
  WON: "סגור",
  LOST: "אבוד",
};

export default async function LeadDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const session = await getSession();
  if (!session) notFound();

  const lead = await prisma.lead.findUnique({
    where: { id: params.id },
    include: { client: { select: { id: true, name: true, ownerId: true } } },
  });

  if (!lead) notFound();

  // Enforce tenant isolation
  const canView =
    session.role === "SUPER_ADMIN" ||
    lead.client.ownerId === session.userId ||
    session.clientId === lead.clientId;
  if (!canView) notFound();

  return (
    <div className="p-6 max-w-3xl mx-auto" dir="rtl">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1 text-sm text-gray-500 mb-6">
        <Link href="/admin/leads" className="hover:text-indigo-600">לידים</Link>
        <ChevronRight size={14} />
        <span className="text-gray-800">{lead.firstName} {lead.lastName}</span>
      </nav>

      {/* Header */}
      <div className="bg-white rounded-xl border border-gray-100 p-6 mb-6 shadow-sm">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900">
              {lead.firstName} {lead.lastName}
            </h1>
            <p className="text-sm text-gray-500 mt-1">{lead.client.name}</p>
          </div>
          <span className="px-3 py-1 rounded-full text-xs font-medium bg-indigo-50 text-indigo-700">
            {STATUS_HE[lead.status] ?? lead.status}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-4 mt-4 text-sm">
          {lead.phone && (
            <div>
              <span className="text-gray-400 block text-xs mb-0.5">טלפון</span>
              <a href={`tel:${lead.phone}`} className="text-gray-800 hover:text-indigo-600">{lead.phone}</a>
            </div>
          )}
          {lead.email && (
            <div>
              <span className="text-gray-400 block text-xs mb-0.5">אימייל</span>
              <a href={`mailto:${lead.email}`} className="text-gray-800 hover:text-indigo-600">{lead.email}</a>
            </div>
          )}
          {lead.source && (
            <div>
              <span className="text-gray-400 block text-xs mb-0.5">מקור</span>
              <span className="text-gray-800">{lead.source}</span>
            </div>
          )}
          {lead.leadScore > 0 && (
            <div>
              <span className="text-gray-400 block text-xs mb-0.5">ניקוד</span>
              <span className="text-gray-800">{lead.leadScore}</span>
            </div>
          )}
        </div>

        {lead.notes && (
          <div className="mt-4 pt-4 border-t border-gray-100">
            <span className="text-gray-400 block text-xs mb-1">הערות</span>
            <p className="text-sm text-gray-700 whitespace-pre-wrap">{lead.notes}</p>
          </div>
        )}
      </div>

      {/* Timeline */}
      <LeadTimeline leadId={lead.id} />
    </div>
  );
}
