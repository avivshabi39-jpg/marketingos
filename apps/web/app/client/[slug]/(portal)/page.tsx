import { notFound } from "next/navigation";
import { getClientSession } from "@/lib/clientAuth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Phone, Mail, Calendar } from "lucide-react";
import { getSourceLabel } from "@/lib/leadSource";
import Link from "next/link";
import { CopyButton } from "./CopyButton";
import { ClientAiTools } from "@/components/client/ClientAiTools";
import { ClientPageAgent } from "@/components/client/ClientPageAgent";
import { PerformanceSection } from "@/components/client/PerformanceSection";
import { ChecklistCard } from "@/components/client/ChecklistCard";
import { ShareCenter } from "@/components/client/ShareCenter";
import { AiProactiveMessage } from "@/components/client/AiProactiveMessage";
import { QuickDesignControls } from "@/components/client/QuickDesignControls";
import { WhatsAppSetupGuide } from "@/components/client/WhatsAppSetupGuide";
import { DashboardAiSection } from "@/components/client/DashboardAiSection";
import { BusinessValueStrip } from "@/components/client/BusinessValueStrip";
import { UntreatedLeadsAlert } from "@/components/client/UntreatedLeadsAlert";
import { ConversionInsightsBlock } from "@/components/client/ConversionInsightsBlock";
import { computeUntreatedStats } from "@/lib/untreatedLeads";
import { computeConversionInsights } from "@/lib/conversionInsights";
import { OnboardingTour } from "@/components/portal/OnboardingTour";

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

export default async function ClientDashboardPage({
  params,
}: {
  params: { slug: string };
}) {
  const session = await getClientSession();

  if (!session) {
    redirect(`/client/${params.slug}/login`);
  }

  if (session.slug !== params.slug) {
    redirect(`/client/${session.slug}`);
  }

  const client = await prisma.client.findUnique({
    where: { slug: params.slug },
    select: {
      id: true,
      name: true,
      slug: true,
      primaryColor: true,
      isActive: true,
      n8nWebhookUrl: true,
      industry: true,
      aiAgentEnabled: true,
      pagePublished: true,
      pageBlocks: true,
      whatsappNumber: true,
      landingPageTitle: true,
      landingPageCta: true,
      _count: {
        select: { leads: true, reports: true },
      },
    },
  });

  if (!client || !client.isActive) notFound();

  const now = new Date();
  const firstOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const prevSevenDaysAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

  const [
    recentLeads,
    reports,
    totalLeads,
    leadsThisMonth,
    wonLeads,
    leadsLast7Days,
    leadsPrev7Days,
    newLeadsCount,
    ,  // pipelineValue (unused — kept for future)
    pipelineOpen,
    ,  // wonThisMonth (unused — kept for future)
    contactedCount,
    lostCount,
    proposalCount,
  ] = await Promise.all([
    prisma.lead.findMany({
      where: { clientId: client.id },
      orderBy: { createdAt: "desc" },
      take: 10,
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        status: true,
        source: true,
        createdAt: true,
      },
    }),
    prisma.report.findMany({
      where: { clientId: client.id },
      orderBy: { createdAt: "desc" },
      take: 5,
      select: {
        id: true,
        type: true,
        period: true,
        totalLeads: true,
        wonLeads: true,
        conversionRate: true,
        createdAt: true,
      },
    }),
    prisma.lead.count({ where: { clientId: client.id } }),
    prisma.lead.count({
      where: { clientId: client.id, createdAt: { gte: firstOfMonth } },
    }),
    prisma.lead.count({ where: { clientId: client.id, status: "WON" } }),
    prisma.lead.count({
      where: { clientId: client.id, createdAt: { gte: sevenDaysAgo } },
    }),
    prisma.lead.count({
      where: {
        clientId: client.id,
        createdAt: { gte: prevSevenDaysAgo, lt: sevenDaysAgo },
      },
    }),
    prisma.lead.count({
      where: { clientId: client.id, status: "NEW" },
    }),
    prisma.lead.aggregate({
      where: { clientId: client.id },
      _sum: { value: true },
    }),
    prisma.lead.aggregate({
      where: { clientId: client.id, status: { in: ["NEW", "CONTACTED", "QUALIFIED", "PROPOSAL"] } },
      _sum: { value: true },
      _count: { _all: true },
    }),
    prisma.lead.aggregate({
      where: { clientId: client.id, status: "WON", updatedAt: { gte: firstOfMonth } },
      _sum: { value: true },
    }),
    prisma.lead.count({
      where: { clientId: client.id, status: "CONTACTED" },
    }),
    prisma.lead.count({
      where: { clientId: client.id, status: "LOST" },
    }),
    prisma.lead.count({
      where: { clientId: client.id, status: "PROPOSAL" },
    }),
  ]);

  const conversionRate =
    totalLeads > 0 ? Math.round((wonLeads / totalLeads) * 100) : 0;

  // Untreated leads stats (computed from recent leads with createdAt + status)
  const untreatedStats = computeUntreatedStats(recentLeads);

  // Conversion insights
  const conversionInsights = computeConversionInsights({
    totalLeads,
    newLeadsCount,
    contactedCount,
    proposalCount,
    wonLeads,
    lostCount,
    conversionRate,
    leadsThisWeek: leadsLast7Days,
    untreatedCriticalCount: untreatedStats.criticalCount,
    slug: params.slug,
  });

  // AI proactive message type
  let aiMessageType: "no_page" | "no_leads" | "new_leads" | "performance_up" | null = null;
  const changePercent =
    leadsPrev7Days > 0
      ? Math.round(((leadsLast7Days - leadsPrev7Days) / leadsPrev7Days) * 100)
      : 0;

  if (!client.pagePublished) {
    aiMessageType = "no_page";
  } else if (newLeadsCount > 0) {
    aiMessageType = "new_leads";
  } else if (leadsLast7Days === 0 && totalLeads > 0) {
    aiMessageType = "no_leads";
  } else if (changePercent >= 20) {
    aiMessageType = "performance_up";
  }

  const hasWhatsapp = !!client.whatsappNumber;
  const hasLeads = totalLeads > 0;
  const hasReports = reports.length > 0;
  // pipelineValue and wonThisMonth kept in query for future use (prefixed with _)

  const appUrl =
    process.env.NEXT_PUBLIC_APP_URL ?? process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000";

  const intakeFormUrl = `${appUrl}/intake/${client.slug}`;

  const dateHe = now.toLocaleDateString("he-IL", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <div className="min-h-screen bg-[#F8FAFC] p-6 md:p-8" dir="rtl">
      <div className="max-w-5xl mx-auto space-y-8">

        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">
              שלום {client.name}! 👋
            </h1>
            <p className="text-slate-500 mt-1">{dateHe}</p>
          </div>
          <div className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-full px-3 py-1.5 flex-shrink-0">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            <span className="text-xs font-medium text-green-700">מחובר</span>
          </div>
        </div>

        {/* ── Michael AI Section — primary entry point ── */}
        <DashboardAiSection
          clientId={client.id}
          clientName={client.name}
          slug={params.slug}
          pagePublished={client.pagePublished}
          stats={{
            totalLeads,
            newLeads7d: leadsLast7Days,
            leadsThisMonth,
            wonLeads,
            conversionRate,
          }}
        />

        {/* AI Proactive Message Banner (secondary — only shows when AI section greeting doesn't cover the case) */}
        {aiMessageType === "performance_up" && (
          <AiProactiveMessage
            type={aiMessageType}
            newLeadsCount={newLeadsCount}
            changePercent={changePercent}
          />
        )}

        {/* Onboarding Checklist */}
        <ChecklistCard
          pagePublished={client.pagePublished}
          hasWhatsapp={hasWhatsapp}
          hasLeads={hasLeads}
          hasReports={hasReports}
          slug={params.slug}
          clientId={client.id}
        />

        {/* ── Business Value Strip — compact metrics + insight ── */}
        <BusinessValueStrip
          totalLeads={totalLeads}
          leadsThisWeek={leadsLast7Days}
          contactedCount={contactedCount}
          wonLeads={wonLeads}
          conversionRate={conversionRate}
          newLeadsCount={newLeadsCount}
          pipelineValue={pipelineOpen._sum.value ?? 0}
        />

        {/* ── Untreated Leads Alert ── */}
        <UntreatedLeadsAlert
          untreatedCount={untreatedStats.untreatedCount}
          criticalCount={untreatedStats.criticalCount}
          slug={params.slug}
        />

        {/* ── Conversion Insights ── */}
        <ConversionInsightsBlock insights={conversionInsights} />

        {/* ── Secondary widgets: only show when page is published ── */}
        {client.pagePublished && (
          <>
            <QuickDesignControls
              clientId={client.id}
              slug={params.slug}
              initialColor={client.primaryColor ?? "#4f46e5"}
              initialTitle={client.landingPageTitle ?? ""}
              initialCta={client.landingPageCta ?? ""}
            />
            <ShareCenter
              slug={params.slug}
              clientName={client.name}
              appUrl={appUrl}
            />
          </>
        )}

        {/* WhatsApp Setup Guide (only when no whatsapp configured) */}
        {!hasWhatsapp && (
          <WhatsAppSetupGuide
            clientId={client.id}
            initialNumber=""
          />
        )}

        {/* Recent leads */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm">
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
            <h2 className="font-semibold text-slate-900">לידים אחרונים</h2>
            <Link
              href={`/client/${params.slug}/leads`}
              className="text-xs text-blue-600 hover:text-blue-700 font-medium"
            >
              הצג הכל
            </Link>
          </div>

          {recentLeads.length === 0 ? (
            <div className="py-10 text-center px-6">
              <p className="text-3xl mb-3">🎯</p>
              <p className="text-sm font-medium text-slate-600 mb-1">אין לידים עדיין</p>
              <p className="text-xs text-slate-400 mb-4">
                {client.pagePublished
                  ? "הדף שלך באוויר — שתף את הקישור כדי להתחיל לקבל לידים"
                  : "בנה דף נחיתה ושתף אותו כדי להתחיל לקבל לידים"}
              </p>
              <Link
                href={client.pagePublished ? `/client/${params.slug}/settings` : `/client/${params.slug}/build-page`}
                className="inline-flex items-center gap-2 bg-blue-600 text-white text-xs font-semibold px-4 py-2.5 rounded-xl hover:bg-blue-700 transition-colors"
              >
                {client.pagePublished ? "🔗 שתף את הקישור" : "🌐 בנה דף נחיתה"}
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-slate-50">
              {recentLeads.map((lead) => (
                <div
                  key={lead.id}
                  className="px-6 py-3.5 flex items-center gap-4"
                >
                  {/* Avatar */}
                  <div
                    className="w-9 h-9 rounded-full flex items-center justify-center text-white font-bold text-xs flex-shrink-0"
                    style={{ backgroundColor: client.primaryColor ?? "#4f46e5" }}
                  >
                    {lead.firstName[0]}
                  </div>

                  {/* Name + contact */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-900 truncate">
                      {lead.firstName} {lead.lastName}
                    </p>
                    <div className="flex items-center gap-3 mt-0.5">
                      {lead.email && (
                        <span className="flex items-center gap-1 text-xs text-slate-400 truncate">
                          <Mail size={10} />
                          {lead.email}
                        </span>
                      )}
                      {lead.phone && !lead.email && (
                        <span className="flex items-center gap-1 text-xs text-slate-400">
                          <Phone size={10} />
                          {lead.phone}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Source + Date + status */}
                  <div className="hidden sm:flex items-center gap-2 flex-shrink-0">
                    <span className="bg-slate-100 text-slate-500 text-[10px] font-medium px-1.5 py-0.5 rounded">
                      {getSourceLabel(lead.source)}
                    </span>
                    <span className="text-xs text-slate-400 flex items-center gap-1">
                      <Calendar size={11} />
                      {new Date(lead.createdAt).toLocaleDateString("he-IL")}
                    </span>
                    <span
                      className={`text-xs font-medium px-2.5 py-1 rounded-full ${
                        STATUS_COLOR[lead.status] ?? "bg-slate-100 text-slate-600"
                      }`}
                    >
                      {STATUS_HE[lead.status] ?? lead.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Reports (if any) */}
        {reports.length > 0 && (
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <h2 className="font-semibold text-slate-900">דוחות אחרונים</h2>
              <Link
                href={`/client/${params.slug}/reports`}
                className="text-xs text-blue-600 hover:text-blue-700 font-medium"
              >
                הצג הכל
              </Link>
            </div>
            <div className="divide-y divide-slate-50">
              {reports.map((report) => (
                <div
                  key={report.id}
                  className="px-6 py-3.5 flex items-center justify-between gap-3"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-slate-800 truncate">
                      {report.period}
                    </p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {report.totalLeads} לידים · {report.conversionRate.toFixed(1)}%
                    </p>
                  </div>
                  <span
                    className={`text-xs font-medium px-2.5 py-1 rounded-full flex-shrink-0 ${
                      report.type === "WEEKLY"
                        ? "bg-blue-50 text-blue-600"
                        : "bg-purple-50 text-purple-600"
                    }`}
                  >
                    {report.type === "WEEKLY" ? "שבועי" : "חודשי"}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Performance stats + AI recommendations */}
        <PerformanceSection slug={params.slug} />

        {/* Personal AI Agent */}
        {client.aiAgentEnabled && (
          <ClientPageAgent
            clientId={client.id}
            clientSlug={client.slug}
            clientName={client.name}
            industry={client.industry ?? null}
          />
        )}

        {/* AI Tools */}
        <ClientAiTools
          clientName={client.name}
          industry={client.industry ?? "שירותים"}
        />

        {/* Landing page preview */}
        {client.pagePublished ? (
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <h2 className="font-semibold text-slate-900">🌐 הדף שלי</h2>
              <div className="flex items-center gap-2">
                <a
                  href={`${appUrl}/${client.slug}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                >
                  👁 צפה בדף ↗
                </a>
                <CopyButton text={`${appUrl}/${client.slug}`} />
              </div>
            </div>
            <div className="h-[250px] overflow-hidden relative bg-slate-50">
              <iframe
                src={`${appUrl}/${client.slug}`}
                className="border-none pointer-events-none"
                style={{
                  width: "250%",
                  height: "250%",
                  transform: "scale(0.4)",
                  transformOrigin: "top right",
                }}
                loading="lazy"
                title="תצוגה מקדימה של דף הנחיתה"
              />
            </div>
            <div className="px-6 py-3 bg-slate-50 border-t border-slate-100">
              <div className="flex items-center gap-3">
                <p className="text-xs font-mono text-slate-500 flex-1 truncate text-left" dir="ltr">
                  {appUrl}/{client.slug}
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border-2 border-dashed border-slate-200 p-8 text-center">
            <div className="text-4xl mb-3">🌐</div>
            <p className="text-slate-600 font-medium mb-1">הדף שלך עדיין לא פורסם</p>
            <p className="text-sm text-slate-400 mb-4">פרסם את דף הנחיתה כדי להתחיל לקבל לידים</p>
            <Link
              href={`/client/${params.slug}/settings`}
              className="inline-flex items-center gap-2 bg-blue-600 text-white font-semibold px-5 py-2.5 rounded-xl text-sm hover:bg-blue-500 transition-colors"
            >
              ✨ בנה את הדף שלי
            </Link>
          </div>
        )}

        {/* Lead form link */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
          <h2 className="font-semibold text-slate-900 mb-2">טופס קבלת לידים</h2>
          <p className="text-sm text-slate-500 mb-4">
            שתפו את הקישור הזה כדי לקבל לידים ישירות
          </p>
          <div className="flex items-center gap-3 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3">
            <p
              className="text-sm font-mono text-slate-600 flex-1 truncate text-left"
              dir="ltr"
            >
              {intakeFormUrl}
            </p>
            <CopyButton text={intakeFormUrl} />
          </div>
        </div>

      </div>
      <OnboardingTour />
    </div>
  );
}
