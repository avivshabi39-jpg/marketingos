import { notFound } from "next/navigation";
import { getClientSession } from "@/lib/clientAuth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";

const STATUS_HE: Record<string, string> = {
  NEW: "חדש",
  CONTACTED: "נוצר קשר",
  QUALIFIED: "מוסמך",
  PROPOSAL: "הצעה",
  WON: "נסגר",
  LOST: "אבוד",
};

const STATUS_COLOR: Record<string, string> = {
  NEW: "bg-blue-100 text-blue-700",
  CONTACTED: "bg-yellow-100 text-yellow-700",
  QUALIFIED: "bg-purple-100 text-purple-700",
  PROPOSAL: "bg-orange-100 text-orange-700",
  WON: "bg-green-100 text-green-700",
  LOST: "bg-red-100 text-red-700",
};

const SOURCE_HE: Record<string, string> = {
  facebook: "פייסבוק",
  google: "גוגל",
  organic: "אורגני",
  manual: "ידני",
  other: "אחר",
};

const SOURCE_COLOR: Record<string, string> = {
  facebook: "bg-blue-500 text-white",
  google: "bg-red-500 text-white",
  organic: "bg-green-500 text-white",
  manual: "bg-gray-400 text-white",
  other: "bg-purple-400 text-white",
};

function srcKey(source: string | null): string {
  const s = source?.toLowerCase() ?? "";
  if (s.includes("facebook") || s.includes("fb")) return "facebook";
  if (s.includes("google")) return "google";
  if (s === "organic") return "organic";
  if (s === "manual") return "manual";
  return "other";
}

export default async function ClientLeadsPage({
  params,
}: {
  params: { slug: string };
}) {
  const session = await getClientSession();
  if (!session || session.slug !== params.slug) {
    redirect(`/client/${params.slug}/login`);
  }

  const client = await prisma.client.findUnique({
    where: { slug: params.slug },
    select: { id: true, isActive: true },
  });

  if (!client || !client.isActive) notFound();

  const leads = await prisma.lead.findMany({
    where: { clientId: client.id },
    orderBy: { createdAt: "desc" },
    take: 200,
    select: {
      id: true,
      firstName: true,
      lastName: true,
      phone: true,
      source: true,
      status: true,
      createdAt: true,
    },
  });

  return (
    <div className="space-y-6" dir="rtl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">לידים</h1>
        <p className="text-gray-500 mt-0.5 text-sm">{leads.length} לידים בסה"כ</p>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        {leads.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-14 h-14 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">📋</span>
            </div>
            <p className="text-gray-500 font-medium">אין לידים עדיין</p>
            <p className="text-gray-400 text-sm mt-1">לידים חדשים יופיעו כאן ברגע שיתקבלו</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-100">
              <thead className="bg-gray-50">
                <tr>
                  {["שם", "טלפון", "מקור", "סטטוס", "תאריך"].map((h) => (
                    <th
                      key={h}
                      className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 bg-white">
                {leads.map((lead) => {
                  const key = srcKey(lead.source);
                  return (
                    <tr key={lead.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-4 py-3">
                        <p className="text-sm font-medium text-gray-900 whitespace-nowrap">
                          {lead.firstName} {lead.lastName}
                        </p>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        {lead.phone ? (
                          <div className="flex items-center gap-1.5">
                            <span className="text-sm text-gray-600" dir="ltr">{lead.phone}</span>
                            <a
                              href={`tel:${lead.phone.replace(/[^0-9+]/g, "")}`}
                              className="inline-flex items-center gap-1 bg-green-500 hover:bg-green-600 text-white text-xs font-semibold px-2 py-1 rounded-lg transition-colors"
                            >
                              📞 שיחה
                            </a>
                            <a
                              href={`https://wa.me/972${lead.phone.replace(/[^0-9]/g, "").replace(/^0/, "")}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 bg-[#25d366] hover:bg-[#1da851] text-white text-xs font-semibold px-2 py-1 rounded-lg transition-colors"
                            >
                              💬 WA
                            </a>
                          </div>
                        ) : <span className="text-sm text-gray-400">—</span>}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-block text-xs px-2 py-0.5 rounded font-medium whitespace-nowrap ${
                            SOURCE_COLOR[key] ?? "bg-gray-100 text-gray-600"
                          }`}
                        >
                          {SOURCE_HE[key] ?? lead.source ?? "אחר"}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-block text-xs px-2.5 py-1 rounded-full font-medium whitespace-nowrap ${
                            STATUS_COLOR[lead.status] ?? "bg-gray-100 text-gray-600"
                          }`}
                        >
                          {STATUS_HE[lead.status] ?? lead.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-400 whitespace-nowrap">
                        {new Date(lead.createdAt).toLocaleDateString("he-IL")}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
