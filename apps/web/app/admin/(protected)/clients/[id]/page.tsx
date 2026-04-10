import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { ArrowRight, Users, TrendingUp, Banknote, ClipboardList, ExternalLink, Star } from "lucide-react";
import { ClientTabs } from "@/components/admin/ClientTabs";
import { ClientSettingsForm } from "@/components/admin/ClientSettingsForm";
import { LandingPageEditor } from "@/components/admin/LandingPageEditor";
import { CopyLinkButton } from "@/components/admin/CopyLinkButton";
import { GenerateReportButton } from "@/components/admin/GenerateReportButton";
import { SendReportButton } from "@/components/admin/SendReportButton";
import { ClientAnalyticsTab } from "@/components/admin/ClientAnalyticsTab";
import { AbTestResults } from "@/components/admin/AbTestResults";
import { ClientAiAgentWithPreview } from "@/components/admin/ClientAiAgent";
import { QRCodePanel } from "@/components/admin/QRCodePanel";
import { WhatsAppSetup } from "@/components/admin/WhatsAppSetup";
import { ClientOverviewHeader } from "@/components/admin/ClientOverviewHeader";

const STATUS_COLORS: Record<string, string> = {
  NEW:       "bg-blue-100 text-blue-700",
  CONTACTED: "bg-yellow-100 text-yellow-700",
  QUALIFIED: "bg-purple-100 text-purple-700",
  PROPOSAL:  "bg-orange-100 text-orange-700",
  WON:       "bg-green-100 text-green-700",
  LOST:      "bg-red-100 text-red-700",
};
const STATUS_HE: Record<string, string> = {
  NEW: "חדש", CONTACTED: "נוצר קשר", QUALIFIED: "מוסמך",
  PROPOSAL: "הצעה", WON: "נסגר", LOST: "אבוד",
};

const INDUSTRY_HE: Record<string, string> = {
  ROOFING: "גגות", ALUMINUM: "אלומיניום", COSMETICS: "קוסמטיקה",
  CLEANING: "ניקיון", REAL_ESTATE: "נדל\"ן", OTHER: "אחר",
  AVIATION: "תעופה", TOURISM: "תיירות", FINANCE: "פיננסים",
  LEGAL: "משפטי", MEDICAL: "רפואה", FOOD: "מזון ומסעדנות",
  FITNESS: "כושר ובריאות", EDUCATION: "חינוך", GENERAL: "כללי",
};

const PLAN_HE: Record<string, string> = { BASIC: "בסיסי", PRO: "פרו", AGENCY: "סוכנות" };

const REPORT_TYPE_HE: Record<string, string> = { WEEKLY: "שבועי", MONTHLY: "חודשי" };

const TABS = [
  { key: "overview",    label: "סקירה"      },
  { key: "leads",       label: "לידים"      },
  { key: "analytics",   label: "אנליטיקס"   },
  { key: "reports",     label: "דוחות"      },
  { key: "landing",     label: "דף נחיתה"  },
  { key: "ai-agent",    label: "סוכן AI 🤖" },
  { key: "chatbot",     label: "וואצאפ 💬" },
  { key: "settings",    label: "הגדרות"     },
];

export default async function ClientDetailPage({ params }: { params: { id: string } }) {
  const client = await prisma.client.findUnique({
    where: { id: params.id },
    include: {
      leads: { orderBy: { createdAt: "desc" }, take: 50 },
      reports: { orderBy: { createdAt: "desc" }, take: 20 },
      _count: { select: { leads: true, reports: true, workflows: true } },
    },
  });

  if (!client) notFound();

  // Stats
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const leadsThisMonth = client.leads.filter((l) => l.createdAt >= startOfMonth).length;
  const leads7d = client.leads.filter((l) => l.createdAt >= sevenDaysAgo).length;
  const wonLeads = client.leads.filter((l) => l.status === "WON").length;
  const conversionRate = client._count.leads > 0
    ? Math.round((wonLeads / client._count.leads) * 100)
    : 0;
  const revenue = client.leads
    .filter((l) => l.status === "WON")
    .reduce((s, l) => s + (l.value ?? 0), 0);

  return (
    <div className="space-y-6" dir="rtl">
      {/* ── New: Client Overview Header with 4 sections ── */}
      <ClientOverviewHeader
        client={{
          id: client.id,
          name: client.name,
          slug: client.slug,
          primaryColor: client.primaryColor,
          industry: client.industry,
          plan: client.plan,
          isActive: client.isActive,
          pagePublished: client.pagePublished,
          whatsappNumber: client.whatsappNumber,
        }}
        stats={{
          totalLeads: client._count.leads,
          leadsThisMonth,
          leads7d,
          wonLeads,
          conversionRate,
        }}
      />

      {/* ── Tabs for detailed views ── */}
      <ClientTabs tabs={TABS} panels={{
        "overview": (
          <div className="space-y-6">
            <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
              {[
                { label: "סה\"כ לידים", value: client._count.leads, icon: Users, color: "text-blue-600 bg-blue-50" },
                { label: "לידים החודש", value: leadsThisMonth, icon: TrendingUp, color: "text-blue-600 bg-blue-50" },
                { label: "אחוז המרה", value: `${conversionRate}%`, icon: TrendingUp, color: "text-green-600 bg-green-50" },
                { label: "הכנסה כוללת", value: `₪${revenue.toLocaleString("he-IL")}`, icon: Banknote, color: "text-amber-600 bg-amber-50" },
              ].map((s) => {
                const Icon = s.icon;
                return (
                  <div key={s.label} className="bg-white rounded-xl border border-slate-100 shadow-sm p-5">
                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center mb-3 ${s.color}`}>
                      <Icon size={18} />
                    </div>
                    <p className="text-2xl font-bold text-slate-900">{s.value}</p>
                    <p className="text-sm text-slate-500 mt-0.5">{s.label}</p>
                  </div>
                );
              })}
            </div>
          </div>
        ),
        "leads": (
          <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
              <h2 className="font-semibold text-slate-900">לידים ({client._count.leads})</h2>
              <Link href={`/admin/leads?clientId=${client.id}`} className="text-xs text-blue-500 hover:text-blue-700 font-medium">
                הצג בדף לידים
              </Link>
            </div>
            <table className="min-w-full divide-y divide-slate-100">
              <thead className="bg-slate-50">
                <tr>
                  {["שם", "טלפון", "מקור", "סטטוס", "ניקוד", "תאריך"].map((h) => (
                    <th key={h} className="px-5 py-3 text-right text-xs font-semibold text-slate-500 uppercase">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {client.leads.map((lead) => (
                  <tr key={lead.id} className="hover:bg-slate-50">
                    <td className="px-5 py-3">
                      <p className="text-sm font-medium text-slate-900">{lead.firstName} {lead.lastName}</p>
                      <p className="text-xs text-slate-400">{lead.email ?? ""}</p>
                    </td>
                    <td className="px-5 py-3 text-sm text-slate-600">{lead.phone ?? "—"}</td>
                    <td className="px-5 py-3 text-sm text-slate-500">{lead.source ?? "—"}</td>
                    <td className="px-5 py-3">
                      <span className={`text-xs px-2 py-1 rounded-full font-medium ${STATUS_COLORS[lead.status] ?? "bg-slate-100 text-slate-600"}`}>
                        {STATUS_HE[lead.status] ?? lead.status}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-sm text-slate-500">{lead.leadScore}</td>
                    <td className="px-5 py-3 text-sm text-slate-400">{new Date(lead.createdAt).toLocaleDateString("he-IL")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {client.leads.length === 0 && (
              <p className="px-6 py-10 text-center text-sm text-slate-500">עדיין אין לידים.</p>
            )}
          </div>
        ),
        "analytics": <ClientAnalyticsTab clientId={client.id} />,
        "reports": (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-slate-500">{client.reports.length} דוחות</p>
              <GenerateReportButton clients={[]} fixedClientId={client.id} />
            </div>
            {client.reports.length === 0 ? (
              <div className="bg-white rounded-xl border border-slate-100 shadow-sm flex flex-col items-center py-16">
                <ClipboardList size={28} className="text-slate-300 mb-3" />
                <p className="text-sm text-slate-500">עדיין אין דוחות.</p>
                <p className="text-xs text-slate-400 mt-1">לחץ על &quot;צור דוח&quot; כדי להתחיל</p>
              </div>
            ) : (
              client.reports.map((report) => (
                <div key={report.id} className="bg-white rounded-xl border border-slate-100 shadow-sm p-5">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <p className="font-semibold text-slate-900">דוח {REPORT_TYPE_HE[report.type] ?? report.type}</p>
                      <p className="text-xs text-slate-500 mt-0.5">תקופה: {report.period}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <SendReportButton reportId={report.id} />
                      <p className="text-xs text-slate-400">{new Date(report.createdAt).toLocaleDateString("he-IL")}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-4 gap-3">
                    {[
                      { label: "לידים", val: report.totalLeads },
                      { label: "נסגרו", val: report.wonLeads },
                      { label: "המרה", val: `${report.conversionRate.toFixed(1)}%` },
                      { label: "הכנסה", val: report.revenue ? `₪${report.revenue.toLocaleString("he-IL")}` : "—" },
                    ].map((s) => (
                      <div key={s.label} className="bg-slate-50 rounded-lg p-3 text-center">
                        <p className="text-lg font-bold text-slate-900">{s.val}</p>
                        <p className="text-xs text-slate-500">{s.label}</p>
                      </div>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>
        ),
        "landing": (
          <>
            {!client.pagePublished && (
              <div className="bg-gradient-to-br from-blue-50 to-purple-50 border border-blue-200 rounded-2xl py-14 px-8 text-center mb-6">
                <div className="text-6xl mb-4">🧙</div>
                <h3 className="text-2xl font-bold text-slate-900 mb-2">בוא נבנה את הדף שלך!</h3>
                <p className="text-slate-500 text-sm mb-6 max-w-md mx-auto">
                  15 שאלות פשוטות → AI בונה דף מקצועי מושלם
                </p>
                <Link
                  href={`/admin/page-builder/${client.id}`}
                  className="inline-flex items-center gap-2 bg-gradient-to-l from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-bold rounded-xl px-8 py-4 text-lg transition-all shadow-lg shadow-blue-500/20"
                >
                  🧙 בנה דף נחיתה מקצועי
                </Link>
                <p className="text-xs text-slate-400 mt-3">לוקח כ-5 דקות</p>
              </div>
            )}
            <AbTestResults clientId={client.id} />
            <LandingPageEditor client={{
              id: client.id,
              slug: client.slug,
              primaryColor: client.primaryColor,
              landingPageTitle:    client.landingPageTitle    ?? null,
              landingPageSubtitle: client.landingPageSubtitle ?? null,
              landingPageCta:      client.landingPageCta      ?? null,
              landingPageColor:    client.landingPageColor    ?? null,
              landingPageLogo:     client.landingPageLogo     ?? null,
              landingPageActive:   client.landingPageActive,
              whatsappTemplate:    client.whatsappTemplate    ?? null,
              autoReplyActive:     client.autoReplyActive,
            }} />
            <QRCodePanel slug={client.slug} clientName={client.name} />
          </>
        ),
        "ai-agent": (
          <ClientAiAgentWithPreview
            clientId={client.id}
            clientSlug={client.slug}
            clientName={client.name}
            industry={client.industry ?? null}
            pagePublished={client.pagePublished}
          />
        ),
        "chatbot": (
          <div className="space-y-6">
            <WhatsAppSetup clientId={client.id} />
            <div className="border-t border-slate-200 pt-4">
              <Link
                href={`/admin/clients/${client.id}/chatbot`}
                className="inline-flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700 font-medium"
              >
                הגדרות צ׳אטבוט מתקדמות →
              </Link>
            </div>
          </div>
        ),
        "settings": (
          <ClientSettingsForm client={{
            id: client.id,
            name: client.name,
            email: client.email,
            phone: client.phone,
            slug: client.slug,
            primaryColor: client.primaryColor,
            isActive: client.isActive,
            industry: client.industry,
            plan: client.plan,
            monthlyBudget: client.monthlyBudget,
            reportEmail: client.reportEmail,
            reportFrequency: client.reportFrequency,
            whatsappNumber: client.whatsappNumber,
            n8nWebhookUrl: client.n8nWebhookUrl,
            facebookPixelId: client.facebookPixelId,
            facebookPageId: client.facebookPageId,
            facebookAccessToken: client.facebookAccessToken,
            googleAdsId: client.googleAdsId,
            googleAnalyticsId: client.googleAnalyticsId,
            googleBusinessUrl: client.googleBusinessUrl,
            greenApiInstanceId: client.greenApiInstanceId,
            greenApiToken: client.greenApiToken,
          }} />
        ),
      }} />
    </div>
  );
}
