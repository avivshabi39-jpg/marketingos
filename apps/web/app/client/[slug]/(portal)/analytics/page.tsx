import { redirect, notFound } from "next/navigation";
import { getClientSession } from "@/lib/clientAuth";
import { prisma } from "@/lib/prisma";
import { BarChart2, Eye, Users, TrendingUp } from "lucide-react";

export default async function ClientAnalyticsPage({ params }: { params: { slug: string } }) {
  const session = await getClientSession();
  if (!session) redirect(`/client/${params.slug}/login`);
  if (session.slug !== params.slug) redirect(`/client/${session.slug}/analytics`);

  const client = await prisma.client.findUnique({
    where: { slug: params.slug },
    select: { id: true, isActive: true },
  });
  if (!client || !client.isActive) notFound();

  const since = new Date();
  since.setDate(since.getDate() - 30);

  const [totalViews, leadCount, pageViews] = await Promise.all([
    prisma.pageView.count({ where: { clientId: client.id } }),
    prisma.lead.count({ where: { clientId: client.id, createdAt: { gte: since } } }),
    prisma.pageView.findMany({
      where: { clientId: client.id, createdAt: { gte: since } },
      orderBy: { createdAt: "asc" },
      select: { createdAt: true, source: true },
    }),
  ]);

  // Group by day
  const byDay: Record<string, number> = {};
  for (const pv of pageViews) {
    const day = pv.createdAt.toISOString().slice(0, 10);
    byDay[day] = (byDay[day] ?? 0) + 1;
  }
  const dayEntries = Object.entries(byDay).sort(([a], [b]) => a.localeCompare(b));
  const maxViews = Math.max(...dayEntries.map(([, v]) => v), 1);

  // Group by source
  const bySource: Record<string, number> = {};
  for (const pv of pageViews) {
    const src = pv.source ?? "direct";
    bySource[src] = (bySource[src] ?? 0) + 1;
  }

  const monthViews = pageViews.length;
  const convRate = monthViews > 0 ? Math.round((leadCount / monthViews) * 100 * 10) / 10 : 0;

  const SOURCE_LABELS: Record<string, string> = {
    facebook: "פייסבוק", google: "גוגל", whatsapp: "וואצאפ",
    direct: "ישיר", organic: "אורגני",
  };

  return (
    <div className="space-y-6" dir="rtl">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <BarChart2 size={22} className="text-indigo-500" /> אנליטיקס
        </h1>
        <p className="text-sm text-gray-500 mt-1">30 הימים האחרונים</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "צפיות (חודש)", value: monthViews, icon: Eye, color: "bg-blue-50 text-blue-600" },
          { label: "צפיות (סה\"כ)", value: totalViews, icon: TrendingUp, color: "bg-indigo-50 text-indigo-600" },
          { label: "לידים (חודש)", value: leadCount, icon: Users, color: "bg-green-50 text-green-600" },
          { label: "המרה", value: `${convRate}%`, icon: BarChart2, color: "bg-purple-50 text-purple-600" },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
            <div className="flex items-center gap-3">
              <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${color}`}>
                <Icon size={16} />
              </div>
              <div>
                <p className="text-xl font-bold text-gray-900">{value}</p>
                <p className="text-xs text-gray-500">{label}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Bar chart */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <h3 className="font-semibold text-gray-900 text-sm mb-4">צפיות לפי יום</h3>
          {dayEntries.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-gray-300">
              <Eye size={32} className="mb-2" />
              <p className="text-sm">אין נתוני צפיות עדיין</p>
            </div>
          ) : (
            <div className="flex items-end gap-1 h-28">
              {dayEntries.map(([day, count]) => (
                <div key={day} title={`${new Date(day).toLocaleDateString("he-IL")}: ${count}`} className="flex-1">
                  <div
                    className="w-full bg-indigo-400 hover:bg-indigo-500 rounded-t transition-all"
                    style={{ height: `${Math.max((count / maxViews) * 100, 4)}%` }}
                  />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Sources */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <h3 className="font-semibold text-gray-900 text-sm mb-4">מקורות תנועה</h3>
          {Object.keys(bySource).length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-8">אין נתונים</p>
          ) : (
            <div className="space-y-3">
              {Object.entries(bySource).sort(([, a], [, b]) => b - a).slice(0, 6).map(([src, count]) => (
                <div key={src}>
                  <div className="flex justify-between text-xs text-gray-600 mb-1">
                    <span>{SOURCE_LABELS[src] ?? src}</span>
                    <span className="font-medium">{count}</span>
                  </div>
                  <div className="h-1.5 bg-gray-100 rounded-full">
                    <div
                      className="h-full bg-indigo-400 rounded-full"
                      style={{ width: `${(count / Math.max(...Object.values(bySource))) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {monthViews === 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-sm text-blue-800">
          📊 <strong>הדף שלך טרם קיבל ביקורים.</strong> שתף את הקישור לדף הנחיתה שלך כדי להתחיל לצבור נתונים.
        </div>
      )}
    </div>
  );
}
