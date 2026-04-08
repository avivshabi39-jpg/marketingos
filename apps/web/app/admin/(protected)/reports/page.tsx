import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { FileBarChart, TrendingUp, Users, Award, Send, Download, Calendar } from "lucide-react";
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

const PRESETS = [
  { label: "היום", value: "today" },
  { label: "7 ימים", value: "last7" },
  { label: "30 ימים", value: "last30" },
  { label: "החודש", value: "thisMonth" },
  { label: "חודש קודם", value: "lastMonth" },
];

export default async function ReportsPage({
  searchParams,
}: {
  searchParams: Promise<{ clientId?: string; type?: string; from?: string; to?: string; preset?: string }>;
}) {
  const session = await getSession();
  const scopeFilter = session?.clientId ? { clientId: session.clientId } : {};
  const params = await searchParams;

  // Calculate date range from preset or custom dates
  let dateFilter: { createdAt?: { gte?: Date; lte?: Date } } = {};
  const now = new Date();

  if (params.preset) {
    const ranges: Record<string, () => { gte: Date; lte: Date }> = {
      today: () => ({ gte: new Date(now.getFullYear(), now.getMonth(), now.getDate()), lte: now }),
      last7: () => ({ gte: new Date(now.getTime() - 7 * 86400000), lte: now }),
      last30: () => ({ gte: new Date(now.getTime() - 30 * 86400000), lte: now }),
      thisMonth: () => ({ gte: new Date(now.getFullYear(), now.getMonth(), 1), lte: now }),
      lastMonth: () => ({
        gte: new Date(now.getFullYear(), now.getMonth() - 1, 1),
        lte: new Date(now.getFullYear(), now.getMonth(), 0),
      }),
    };
    const range = ranges[params.preset]?.();
    if (range) dateFilter = { createdAt: range };
  } else if (params.from || params.to) {
    dateFilter = {
      createdAt: {
        ...(params.from ? { gte: new Date(params.from) } : {}),
        ...(params.to ? { lte: new Date(params.to + "T23:59:59Z") } : {}),
      },
    };
  }

  const [reports, clients] = await Promise.all([
    prisma.report.findMany({
      where: {
        ...scopeFilter,
        ...(params.clientId ? { clientId: params.clientId } : {}),
        ...(params.type ? { type: params.type as "WEEKLY" | "MONTHLY" } : {}),
        ...dateFilter,
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

  // Aggregate stats for the filtered reports
  const totalLeads = reports.reduce((sum, r) => sum + r.totalLeads, 0);
  const totalWon = reports.reduce((sum, r) => sum + r.wonLeads, 0);
  const totalRevenue = reports.reduce((sum, r) => sum + (r.revenue ?? 0), 0);
  const avgConversion = reports.length > 0 ? reports.reduce((sum, r) => sum + r.conversionRate, 0) / reports.length : 0;

  return (
    <div className="space-y-6" dir="rtl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">דוחות</h1>
          <p className="text-sm text-slate-500 mt-1">דוחות ביצועים אוטומטיים ללקוחות</p>
        </div>
        <GenerateReportButton clients={clients} />
      </div>

      {/* Date range picker + Filters */}
      <form className="bg-white rounded-2xl border border-slate-100 p-5 space-y-4 shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
        {/* Date presets */}
        <div className="flex flex-wrap gap-2">
          {PRESETS.map((p) => (
            <button
              key={p.value}
              type="submit"
              name="preset"
              value={p.value}
              className={`px-4 py-2 rounded-xl text-sm font-medium border transition-all duration-150 ${
                params.preset === p.value
                  ? "bg-blue-600 text-white border-blue-600 shadow-sm"
                  : "border-slate-200 text-slate-600 hover:border-slate-300 hover:text-slate-900 bg-white"
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>

        {/* Custom date range + other filters */}
        <div className="flex flex-wrap gap-3 items-end">
          <div>
            <label className="text-xs font-medium text-slate-500 mb-1 block">מתאריך</label>
            <input
              type="date"
              name="from"
              defaultValue={params.from ?? ""}
              className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm text-slate-700 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all duration-150"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-slate-500 mb-1 block">עד תאריך</label>
            <input
              type="date"
              name="to"
              defaultValue={params.to ?? ""}
              className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm text-slate-700 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all duration-150"
            />
          </div>
          {!session?.clientId && (
            <div>
              <label className="text-xs font-medium text-slate-500 mb-1 block">לקוח</label>
              <select
                name="clientId"
                defaultValue={params.clientId ?? ""}
                className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm text-slate-700 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 bg-white transition-all duration-150"
              >
                <option value="">כל הלקוחות</option>
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
          )}
          <div>
            <label className="text-xs font-medium text-slate-500 mb-1 block">סוג</label>
            <select
              name="type"
              defaultValue={params.type ?? ""}
              className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm text-slate-700 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 bg-white transition-all duration-150"
            >
              <option value="">כל הסוגים</option>
              <option value="WEEKLY">שבועי</option>
              <option value="MONTHLY">חודשי</option>
            </select>
          </div>
          <button
            type="submit"
            className="px-5 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-colors shadow-sm"
          >
            סנן
          </button>
        </div>
      </form>

      {/* Aggregate KPIs */}
      {reports.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-white rounded-2xl border border-slate-100 p-5 relative overflow-hidden group hover:border-blue-200 transition-all duration-200">
            <div className="absolute top-0 left-0 w-20 h-20 bg-gradient-to-br from-blue-50/60 to-transparent rounded-br-full" />
            <div className="relative">
              <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mb-3">
                <Users size={18} />
              </div>
              <p className="text-2xl font-bold text-slate-900">{totalLeads}</p>
              <p className="text-xs text-slate-500 mt-1">סה"כ לידים</p>
            </div>
          </div>
          <div className="bg-white rounded-2xl border border-slate-100 p-5 relative overflow-hidden group hover:border-emerald-200 transition-all duration-200">
            <div className="absolute top-0 left-0 w-20 h-20 bg-gradient-to-br from-emerald-50/60 to-transparent rounded-br-full" />
            <div className="relative">
              <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-3">
                <Award size={18} />
              </div>
              <p className="text-2xl font-bold text-slate-900">{totalWon}</p>
              <p className="text-xs text-slate-500 mt-1">עסקאות שנסגרו</p>
            </div>
          </div>
          <div className="bg-white rounded-2xl border border-slate-100 p-5 relative overflow-hidden group hover:border-purple-200 transition-all duration-200">
            <div className="absolute top-0 left-0 w-20 h-20 bg-gradient-to-br from-purple-50/60 to-transparent rounded-br-full" />
            <div className="relative">
              <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center mb-3">
                <TrendingUp size={18} />
              </div>
              <p className="text-2xl font-bold text-slate-900">{avgConversion.toFixed(1)}%</p>
              <p className="text-xs text-slate-500 mt-1">אחוז המרה ממוצע</p>
            </div>
          </div>
          <div className="bg-white rounded-2xl border border-slate-100 p-5 relative overflow-hidden group hover:border-amber-200 transition-all duration-200">
            <div className="absolute top-0 left-0 w-20 h-20 bg-gradient-to-br from-amber-50/60 to-transparent rounded-br-full" />
            <div className="relative">
              <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center mb-3">
                <Send size={18} />
              </div>
              <p className="text-2xl font-bold text-slate-900">₪{totalRevenue.toLocaleString("he-IL")}</p>
              <p className="text-xs text-slate-500 mt-1">סה"כ הכנסה</p>
            </div>
          </div>
        </div>
      )}

      {/* Leads chart — shown when a specific client is filtered */}
      {params.clientId && (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
          <LeadsChart clientId={params.clientId} days={30} />
        </div>
      )}

      {/* Reports list */}
      {reports.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm flex flex-col items-center justify-center py-20">
          <div className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center mb-4">
            <FileBarChart size={24} className="text-slate-400" />
          </div>
          <p className="text-slate-500 text-sm">עדיין אין דוחות. לחץ על "צור דוח" כדי להתחיל.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {reports.map((report) => (
            <div
              key={report.id}
              className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 hover:border-slate-200 transition-all duration-200"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-sm"
                    style={{ backgroundColor: report.client.primaryColor }}
                  >
                    {report.client.name[0]}
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-900">{report.client.name}</h3>
                    <p className="text-xs text-slate-500 flex items-center gap-1.5">
                      <span className="px-2 py-0.5 rounded-lg bg-blue-50 text-blue-600 border border-blue-200 font-medium">
                        {TYPE_HE[report.type]}
                      </span>
                      <span>תקופה: {report.period}</span>
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-400 flex items-center gap-1">
                    <Calendar size={11} />
                    {new Date(report.createdAt).toLocaleDateString("he-IL")}
                  </span>
                  <a
                    href={`/api/reports/${report.id}/pdf`}
                    download
                    className="flex items-center gap-1 px-3 py-1.5 rounded-xl border border-slate-200 text-xs text-slate-600 hover:bg-slate-50 hover:border-slate-300 transition-all duration-150 font-medium"
                  >
                    <Download size={12} />
                    PDF
                  </a>
                  <SendReportButton reportId={report.id} />
                </div>
              </div>

              {/* Stats grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-slate-50 rounded-xl p-3 text-center">
                  <div className="flex justify-center mb-1">
                    <Users size={16} className="text-blue-500" />
                  </div>
                  <p className="text-xl font-bold text-slate-900">{report.totalLeads}</p>
                  <p className="text-xs text-slate-500">לידים</p>
                </div>
                <div className="bg-slate-50 rounded-xl p-3 text-center">
                  <div className="flex justify-center mb-1">
                    <Award size={16} className="text-emerald-500" />
                  </div>
                  <p className="text-xl font-bold text-slate-900">{report.wonLeads}</p>
                  <p className="text-xs text-slate-500">נסגרו</p>
                </div>
                <div className="bg-slate-50 rounded-xl p-3 text-center">
                  <div className="flex justify-center mb-1">
                    <TrendingUp size={16} className="text-purple-500" />
                  </div>
                  <p className="text-xl font-bold text-slate-900">
                    {report.conversionRate.toFixed(1)}%
                  </p>
                  <p className="text-xs text-slate-500">המרה</p>
                </div>
                <div className="bg-slate-50 rounded-xl p-3 text-center">
                  <div className="flex justify-center mb-1">
                    <Send size={16} className="text-amber-500" />
                  </div>
                  <p className="text-xl font-bold text-slate-900">
                    {report.revenue ? `₪${report.revenue.toLocaleString("he-IL")}` : "—"}
                  </p>
                  <p className="text-xs text-slate-500">הכנסה</p>
                </div>
              </div>

              {report.topSource && (
                <p className="mt-3 text-xs text-slate-500">
                  מקור מוביל: <span className="font-medium text-slate-700">{report.topSource}</span>
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
