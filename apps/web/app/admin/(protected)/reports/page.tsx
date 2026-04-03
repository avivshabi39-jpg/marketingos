import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { FileBarChart, TrendingUp, Users, Award, Send, Download } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "דוחות | MarketingOS",
  description: "דוחות ביצועים שבועיים וחודשיים",
};
import { GenerateReportButton } from "@/components/admin/GenerateReportButton";
import { SendReportButton } from "@/components/admin/SendReportButton";
import { ReportAiSummary } from "@/components/admin/ReportAiSummary";
import { LeadsChart } from "@/components/LeadsChart";

const TYPE_HE: Record<string, string> = {
  WEEKLY: "שבועי",
  MONTHLY: "חודשי",
};

export default async function ReportsPage({
  searchParams,
}: {
  searchParams: Promise<{ clientId?: string; type?: string }>;
}) {
  const session = await getSession();
  const scopeFilter = session?.clientId ? { clientId: session.clientId } : {};
  const params = await searchParams;

  const [reports, clients] = await Promise.all([
    prisma.report.findMany({
      where: {
        ...scopeFilter,
        ...(params.clientId ? { clientId: params.clientId } : {}),
        ...(params.type ? { type: params.type as "WEEKLY" | "MONTHLY" } : {}),
      },
      orderBy: { createdAt: "desc" },
      take: 50,
      include: { client: { select: { name: true, primaryColor: true } } },
    }),
    session?.clientId
      ? Promise.resolve([] as { id: string; name: string }[])
      : prisma.client.findMany({
          select: { id: true, name: true },
          orderBy: { name: "asc" },
        }),
  ]);

  return (
    <div className="space-y-6" dir="rtl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">דוחות</h1>
          <p className="text-sm text-gray-500 mt-0.5">דוחות ביצועים אוטומטיים ללקוחות</p>
        </div>
        <GenerateReportButton clients={clients} />
      </div>

      {/* Filters */}
      <form className="flex flex-wrap gap-3 items-center bg-white border border-gray-100 rounded-xl p-4 shadow-sm">
        {!session?.clientId && (
          <select
            name="clientId"
            defaultValue={params.clientId ?? ""}
            className="rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-400"
          >
            <option value="">כל הלקוחות</option>
            {clients.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        )}
        <select
          name="type"
          defaultValue={params.type ?? ""}
          className="rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-400"
        >
          <option value="">כל הסוגים</option>
          <option value="WEEKLY">שבועי</option>
          <option value="MONTHLY">חודשי</option>
        </select>
        <button
          type="submit"
          className="px-4 py-2 rounded-lg bg-indigo-500 text-white text-sm font-medium hover:bg-indigo-600 transition-colors"
        >
          סנן
        </button>
      </form>

      {/* Leads chart — shown when a specific client is filtered */}
      {params.clientId && (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <LeadsChart clientId={params.clientId} days={30} />
        </div>
      )}

      {/* Reports list */}
      {reports.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm flex flex-col items-center justify-center py-20">
          <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-3">
            <FileBarChart size={22} className="text-gray-400" />
          </div>
          <p className="text-gray-500 text-sm">עדיין אין דוחות. לחץ על "צור דוח" כדי להתחיל.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {reports.map((report) => (
            <div
              key={report.id}
              className="bg-white rounded-xl border border-gray-100 shadow-sm p-5"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold text-sm"
                    style={{ backgroundColor: report.client.primaryColor }}
                  >
                    {report.client.name[0]}
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{report.client.name}</h3>
                    <p className="text-xs text-gray-500">
                      {TYPE_HE[report.type]} · תקופה: {report.period}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-400">
                    {new Date(report.createdAt).toLocaleDateString("he-IL")}
                  </span>
                  <a
                    href={`/api/reports/${report.id}/pdf`}
                    download
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-gray-200 text-xs text-gray-600 hover:bg-gray-50 transition-colors"
                  >
                    <Download size={12} />
                    PDF
                  </a>
                  <SendReportButton reportId={report.id} />
                </div>
              </div>

              {/* Stats grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="bg-gray-50 rounded-lg p-3 text-center">
                  <div className="flex justify-center mb-1">
                    <Users size={16} className="text-indigo-500" />
                  </div>
                  <p className="text-xl font-bold text-gray-900">{report.totalLeads}</p>
                  <p className="text-xs text-gray-500">סה"כ לידים</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-3 text-center">
                  <div className="flex justify-center mb-1">
                    <Award size={16} className="text-green-500" />
                  </div>
                  <p className="text-xl font-bold text-gray-900">{report.wonLeads}</p>
                  <p className="text-xs text-gray-500">עסקאות שנסגרו</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-3 text-center">
                  <div className="flex justify-center mb-1">
                    <TrendingUp size={16} className="text-blue-500" />
                  </div>
                  <p className="text-xl font-bold text-gray-900">
                    {report.conversionRate.toFixed(1)}%
                  </p>
                  <p className="text-xs text-gray-500">אחוז המרה</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-3 text-center">
                  <div className="flex justify-center mb-1">
                    <Send size={16} className="text-amber-500" />
                  </div>
                  <p className="text-xl font-bold text-gray-900">
                    {report.revenue ? `₪${report.revenue.toLocaleString("he-IL")}` : "—"}
                  </p>
                  <p className="text-xs text-gray-500">הכנסה</p>
                </div>
              </div>

              {report.topSource && (
                <p className="mt-3 text-xs text-gray-500">
                  מקור מוביל: <span className="font-medium text-gray-700">{report.topSource}</span>
                </p>
              )}

              <ReportAiSummary
                clientName={report.client.name}
                leads={report.totalLeads}
                conversions={report.wonLeads}
                topSource={report.topSource ?? null}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
