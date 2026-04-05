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
    select: {
      id: true, isActive: true,
      name: true, slug: true, pagePublished: true, pageBlocks: true,
      landingPageTitle: true, seoDescription: true, seoKeywords: true,
      logoUrl: true, phone: true, email: true,
      customDomain: true, customDomainVerified: true,
    },
  });
  if (!client || !client.isActive) notFound();

  const seoClient = client;

  function computeSeo() {
    if (!seoClient) return null;
    const blocks = Array.isArray(seoClient.pageBlocks)
      ? (seoClient.pageBlocks as Record<string, unknown>[])
      : [];
    const heroBlock = blocks.find((b) => b.type === "hero") as Record<string, unknown> | undefined;
    const heroContent = heroBlock?.content as Record<string, string> | undefined;
    const testimonialCount = blocks.filter((b) => b.type === "testimonial" || b.type === "testimonials").length;
    const hasForm = blocks.some((b) => b.type === "form" || b.type === "cta" || b.type === "whatsapp");

    const checks = [
      { name: "דף נחיתה פורסם", passed: !!seoClient.pagePublished, impact: "high" as const, tip: "פרסם את הדף שלך" },
      { name: "כותרת SEO", passed: !!(seoClient.landingPageTitle && seoClient.landingPageTitle.length > 10), impact: "high" as const, tip: "הוסף כותרת SEO בהגדרות" },
      { name: "תיאור Meta", passed: !!(seoClient.seoDescription && seoClient.seoDescription.length > 50), impact: "high" as const, tip: "הוסף תיאור Meta בהגדרות" },
      { name: "כותרת Hero", passed: !!(heroContent?.title && heroContent.title.length > 5), impact: "high" as const, tip: "הוסף כותרת ראשית לדף" },
      { name: "טלפון", passed: !!seoClient.phone, impact: "medium" as const, tip: "הוסף טלפון בהגדרות" },
      { name: "המלצות", passed: testimonialCount >= 2, impact: "medium" as const, tip: "הוסף 2+ המלצות לקוחות" },
      { name: "טופס", passed: hasForm, impact: "high" as const, tip: "הוסף טופס ליצירת קשר" },
      { name: "לוגו", passed: !!seoClient.logoUrl, impact: "low" as const, tip: "הוסף לוגו לעסק" },
      { name: "דומיין מותאם", passed: !!(seoClient.customDomain && seoClient.customDomainVerified), impact: "medium" as const, tip: "חבר דומיין משלך" },
      { name: "מילות מפתח", passed: !!(seoClient.seoKeywords && seoClient.seoKeywords.length > 5), impact: "medium" as const, tip: "הוסף מילות מפתח" },
    ];
    const w: Record<string, number> = { high: 3, medium: 2, low: 1 };
    const maxS = checks.reduce((s, c) => s + w[c.impact], 0);
    const sc = checks.filter((c) => c.passed).reduce((s, c) => s + w[c.impact], 0);
    const pct = Math.round((sc / maxS) * 100);
    const grade = pct >= 90 ? "A" : pct >= 75 ? "B" : pct >= 60 ? "C" : pct >= 40 ? "D" : "F";
    const tips = checks.filter((c) => !c.passed).sort((a, b) => w[b.impact] - w[a.impact]).slice(0, 3).map((c) => c.tip);
    return { score: pct, grade, checks, topTips: tips };
  }
  const seo = computeSeo();

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

      {/* SEO Score */}
      {seo && (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-bold text-gray-900 flex items-center gap-2">
              🔍 ציון SEO שלך
            </h3>
            <div
              className="w-14 h-14 rounded-full flex items-center justify-center text-white font-black text-xl"
              style={{
                background: seo.score >= 75 ? "#22c55e" : seo.score >= 50 ? "#f59e0b" : "#ef4444",
              }}
            >
              {seo.grade}
            </div>
          </div>

          {/* Score bar */}
          <div className="mb-4">
            <div className="flex justify-between text-sm mb-1">
              <span className="text-gray-600">ציון כולל</span>
              <span className="font-bold">{seo.score}%</span>
            </div>
            <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-1000"
                style={{
                  width: `${seo.score}%`,
                  background: seo.score >= 75 ? "#22c55e" : seo.score >= 50 ? "#f59e0b" : "#ef4444",
                }}
              />
            </div>
          </div>

          {/* Checks grid */}
          <div className="grid grid-cols-2 gap-1.5 mb-4">
            {seo.checks.map((check, i) => (
              <div
                key={i}
                className={`flex gap-1.5 items-center text-xs px-2 py-1.5 rounded ${
                  check.passed ? "bg-green-50 text-green-700" : "bg-red-50 text-red-600"
                }`}
              >
                <span>{check.passed ? "✅" : "❌"}</span>
                {check.name}
              </div>
            ))}
          </div>

          {/* Top tips */}
          {seo.topTips.length > 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
              <p className="font-bold text-xs text-amber-800 mb-2">
                💡 הצעדים הבאים לשיפור SEO:
              </p>
              {seo.topTips.map((tip, i) => (
                <p key={i} className="text-xs text-amber-700 py-0.5 border-b border-amber-100 last:border-0">
                  {i + 1}. {tip}
                </p>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
