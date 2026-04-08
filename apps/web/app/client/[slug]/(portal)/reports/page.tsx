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

  // Live stats
  const thirtyDaysAgo = new Date(Date.now() - 30 * 86400000);
  const [totalLeads, monthLeads, wonLeads, pageViews, byStatus, bySource] = await Promise.all([
    prisma.lead.count({ where: { clientId: client.id } }),
    prisma.lead.count({ where: { clientId: client.id, createdAt: { gte: thirtyDaysAgo } } }),
    prisma.lead.count({ where: { clientId: client.id, status: "WON" } }),
    prisma.pageView.count({ where: { clientId: client.id } }),
    prisma.lead.groupBy({ by: ["status"], where: { clientId: client.id }, _count: { status: true } }),
    prisma.lead.groupBy({ by: ["source"], where: { clientId: client.id, source: { not: null } }, _count: { source: true }, orderBy: { _count: { source: "desc" } }, take: 5 }),
  ]);
  const convRate = totalLeads > 0 ? Math.round((wonLeads / totalLeads) * 100) : 0;

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
      <div>
        <h1 className="text-2xl font-bold text-slate-900">📊 הדוחות שלי</h1>
        <p className="text-slate-500 mt-0.5 text-sm">נתונים בזמן אמת + דוחות שנוצרו</p>
      </div>

      {/* Live stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { l: "לידים החודש", v: monthLeads, i: "🎯", c: "#6366f1" },
          { l: "צפיות בדף", v: pageViews, i: "👁", c: "#3b82f6" },
          { l: "עסקאות סגורות", v: wonLeads, i: "✅", c: "#22c55e" },
          { l: "אחוז המרה", v: `${convRate}%`, i: "📈", c: "#f59e0b" },
        ].map((s) => (
          <div key={s.l} className="bg-white rounded-xl border border-slate-100 shadow-sm p-4 text-center">
            <div className="text-xl mb-1">{s.i}</div>
            <div className="text-2xl font-extrabold" style={{ color: s.c }}>{s.v}</div>
            <div className="text-xs text-slate-500 mt-1">{s.l}</div>
          </div>
        ))}
      </div>

      {/* Status breakdown */}
      <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-5">
        <h3 className="font-bold text-sm mb-3">📊 לידים לפי סטטוס</h3>
        {(byStatus as { status: string; _count: { status: number } }[]).map((s) => {
          const pct = totalLeads > 0 ? Math.round((s._count.status / totalLeads) * 100) : 0;
          const colors: Record<string, string> = { NEW: "#3b82f6", CONTACTED: "#f59e0b", QUALIFIED: "#8b5cf6", PROPOSAL: "#f97316", WON: "#22c55e", LOST: "#ef4444" };
          const labels: Record<string, string> = { NEW: "חדש", CONTACTED: "נוצר קשר", QUALIFIED: "מתאים", PROPOSAL: "הצעה", WON: "סגור", LOST: "לא רלוונטי" };
          return (
            <div key={s.status} className="mb-2">
              <div className="flex justify-between text-xs mb-1"><span>{labels[s.status] ?? s.status}</span><span>{s._count.status} ({pct}%)</span></div>
              <div className="h-2 bg-slate-100 rounded-full overflow-hidden"><div className="h-full rounded-full" style={{ width: `${pct}%`, background: colors[s.status] ?? "#6366f1" }} /></div>
            </div>
          );
        })}
      </div>

      {/* Top sources */}
      {(bySource as { source: string | null; _count: { source: number } }[]).length > 0 && (
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-5">
          <h3 className="font-bold text-sm mb-3">🌐 מקורות לידים</h3>
          {(bySource as { source: string | null; _count: { source: number } }[]).map((s) => (
            <div key={s.source} className="flex justify-between py-1.5 border-b border-slate-50 text-sm last:border-0">
              <span className="text-slate-700">{s.source ?? "ישיר"}</span>
              <span className="font-bold text-blue-600">{s._count.source}</span>
            </div>
          ))}
        </div>
      )}

      {/* Leads over time chart */}
      <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-5">
        <LeadsChart clientId={client.id} days={30} color={client.primaryColor} />
      </div>

      {/* Empty state */}
      {reports.length === 0 && (
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm">
          <div className="text-center py-20">
            <div className="w-16 h-16 rounded-full bg-purple-50 flex items-center justify-center mx-auto mb-4">
              <FileBarChart size={28} className="text-purple-400" />
            </div>
            <p className="text-slate-600 font-medium text-lg">אין דוחות עדיין</p>
            <p className="text-slate-400 text-sm mt-2 max-w-xs mx-auto">
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
              className="bg-white rounded-xl border border-slate-100 shadow-sm p-6 space-y-4 hover:shadow-md transition-shadow"
            >
              {/* Header row */}
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs text-slate-400">תקופה</p>
                  <p className="font-semibold text-slate-900 mt-0.5">{report.period}</p>
                </div>
                <span
                  className={`text-xs font-medium px-2.5 py-1 rounded-full ${
                    TYPE_COLOR[report.type] ?? "bg-slate-100 text-slate-600"
                  }`}
                >
                  {TYPE_HE[report.type] ?? report.type}
                </span>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-3">
                <div className="text-center bg-slate-50 rounded-lg py-3">
                  <div className="w-7 h-7 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-1.5">
                    <Users size={14} className="text-blue-600" />
                  </div>
                  <p className="text-lg font-bold text-slate-900">{report.totalLeads}</p>
                  <p className="text-xs text-slate-500">לידים</p>
                </div>
                <div className="text-center bg-slate-50 rounded-lg py-3">
                  <div className="w-7 h-7 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-1.5">
                    <CheckCircle size={14} className="text-green-600" />
                  </div>
                  <p className="text-lg font-bold text-slate-900">{report.wonLeads}</p>
                  <p className="text-xs text-slate-500">נסגרו</p>
                </div>
                <div className="text-center bg-slate-50 rounded-lg py-3">
                  <div
                    className="w-7 h-7 rounded-lg flex items-center justify-center mx-auto mb-1.5"
                    style={{ backgroundColor: `${client.primaryColor}22` }}
                  >
                    <TrendingUp size={14} style={{ color: client.primaryColor }} />
                  </div>
                  <p className="text-lg font-bold text-slate-900">
                    {report.conversionRate.toFixed(1)}%
                  </p>
                  <p className="text-xs text-slate-500">המרה</p>
                </div>
              </div>

              {/* Conversion bar */}
              <div>
                <div className="flex justify-between text-xs text-slate-500 mb-1.5">
                  <span>שיעור המרה</span>
                  <span>{report.conversionRate.toFixed(1)}%</span>
                </div>
                <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
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
                <div className="pt-1 border-t border-slate-50 space-y-1">
                  {report.revenue && (
                    <p className="text-xs text-slate-600">
                      הכנסות:{" "}
                      <span className="font-semibold text-slate-900">
                        ₪{Number(report.revenue).toLocaleString("he-IL")}
                      </span>
                    </p>
                  )}
                  {report.topSource && (
                    <p className="text-xs text-slate-600">
                      מקור מוביל:{" "}
                      <span className="font-medium text-slate-700">{report.topSource}</span>
                    </p>
                  )}
                </div>
              )}

              {/* Date */}
              <p className="text-xs text-slate-400">
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
