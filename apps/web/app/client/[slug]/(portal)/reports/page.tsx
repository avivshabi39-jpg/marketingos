import { notFound, redirect } from "next/navigation";
import { getClientSession } from "@/lib/clientAuth";
import { prisma } from "@/lib/prisma";
import { FileBarChart, TrendingUp, Users, CheckCircle } from "lucide-react";
import { LeadsChart } from "@/components/LeadsChart";

const TYPE_HE: Record<string, string> = {
  WEEKLY: "שבועי",
  MONTHLY: "חודשי",
};

const TYPE_COLOR: Record<string, string> = {
  WEEKLY: "bg-blue-100 text-blue-700",
  MONTHLY: "bg-purple-100 text-purple-700",
};

export default async function ClientReportsPage({
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
    select: { id: true, isActive: true, primaryColor: true },
  });

  if (!client || !client.isActive) notFound();

  const reports = await prisma.report.findMany({
    where: { clientId: client.id },
    orderBy: { createdAt: "desc" },
    take: 50,
    select: {
      id: true,
      type: true,
      period: true,
      totalLeads: true,
      wonLeads: true,
      lostLeads: true,
      conversionRate: true,
      topSource: true,
      revenue: true,
      createdAt: true,
    },
  });

  return (
    <div className="space-y-6" dir="rtl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">דוחות</h1>
        <p className="text-gray-500 mt-0.5 text-sm">{reports.length} דוחות</p>
      </div>

      {/* Leads over time chart */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
        <LeadsChart clientId={client.id} days={30} color={client.primaryColor} />
      </div>

      {/* Empty state */}
      {reports.length === 0 && (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
          <div className="text-center py-20">
            <div className="w-16 h-16 rounded-full bg-purple-50 flex items-center justify-center mx-auto mb-4">
              <FileBarChart size={28} className="text-purple-400" />
            </div>
            <p className="text-gray-600 font-medium text-lg">אין דוחות עדיין</p>
            <p className="text-gray-400 text-sm mt-2 max-w-xs mx-auto">
              דוחות שבועיים וחודשיים יופיעו כאן לאחר שייווצרו
            </p>
          </div>
        </div>
      )}

      {/* Reports grid */}
      {reports.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {reports.map((report) => (
            <div
              key={report.id}
              className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 space-y-4 hover:shadow-md transition-shadow"
            >
              {/* Header row */}
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs text-gray-400">תקופה</p>
                  <p className="font-semibold text-gray-900 mt-0.5">{report.period}</p>
                </div>
                <span
                  className={`text-xs font-medium px-2.5 py-1 rounded-full ${
                    TYPE_COLOR[report.type] ?? "bg-gray-100 text-gray-600"
                  }`}
                >
                  {TYPE_HE[report.type] ?? report.type}
                </span>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-3">
                <div className="text-center bg-gray-50 rounded-lg py-3">
                  <div className="w-7 h-7 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-1.5">
                    <Users size={14} className="text-blue-600" />
                  </div>
                  <p className="text-lg font-bold text-gray-900">{report.totalLeads}</p>
                  <p className="text-xs text-gray-500">לידים</p>
                </div>
                <div className="text-center bg-gray-50 rounded-lg py-3">
                  <div className="w-7 h-7 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-1.5">
                    <CheckCircle size={14} className="text-green-600" />
                  </div>
                  <p className="text-lg font-bold text-gray-900">{report.wonLeads}</p>
                  <p className="text-xs text-gray-500">נסגרו</p>
                </div>
                <div className="text-center bg-gray-50 rounded-lg py-3">
                  <div
                    className="w-7 h-7 rounded-lg flex items-center justify-center mx-auto mb-1.5"
                    style={{ backgroundColor: `${client.primaryColor}22` }}
                  >
                    <TrendingUp size={14} style={{ color: client.primaryColor }} />
                  </div>
                  <p className="text-lg font-bold text-gray-900">
                    {report.conversionRate.toFixed(1)}%
                  </p>
                  <p className="text-xs text-gray-500">המרה</p>
                </div>
              </div>

              {/* Conversion bar */}
              <div>
                <div className="flex justify-between text-xs text-gray-500 mb-1.5">
                  <span>שיעור המרה</span>
                  <span>{report.conversionRate.toFixed(1)}%</span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: `${Math.min(100, report.conversionRate)}%`,
                      backgroundColor: client.primaryColor,
                    }}
                  />
                </div>
              </div>

              {/* Revenue & Source */}
              {(report.revenue || report.topSource) && (
                <div className="pt-1 border-t border-gray-50 space-y-1">
                  {report.revenue && (
                    <p className="text-xs text-gray-600">
                      הכנסות:{" "}
                      <span className="font-semibold text-gray-900">
                        ₪{Number(report.revenue).toLocaleString("he-IL")}
                      </span>
                    </p>
                  )}
                  {report.topSource && (
                    <p className="text-xs text-gray-600">
                      מקור מוביל:{" "}
                      <span className="font-medium text-gray-700">{report.topSource}</span>
                    </p>
                  )}
                </div>
              )}

              {/* Date */}
              <p className="text-xs text-gray-400">
                {new Date(report.createdAt).toLocaleDateString("he-IL", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
