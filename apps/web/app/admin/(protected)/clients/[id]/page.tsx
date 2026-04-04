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
  const leadsThisMonth = client.leads.filter((l) => l.createdAt >= startOfMonth).length;
  const wonLeads = client.leads.filter((l) => l.status === "WON").length;
  const conversionRate = client._count.leads > 0
    ? Math.round((wonLeads / client._count.leads) * 100)
    : 0;
  const revenue = client.leads
    .filter((l) => l.status === "WON")
    .reduce((s, l) => s + (l.value ?? 0), 0);

  const initials = client.name.split(" ").slice(0, 2).map((w: string) => w[0]).join("").toUpperCase();

  return (
    <div className="space-y-6" dir="rtl">
      {/* Header */}
      <div className="flex items-start gap-4">
        <Link href="/admin/clients" className="mt-1 text-gray-400 hover:text-gray-600">
          <ArrowRight size={18} />
        </Link>
        <div className="flex items-center gap-4 flex-1 flex-wrap">
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-lg flex-shrink-0"
            style={{ backgroundColor: client.primaryColor }}
          >
            {initials}
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-2xl font-semibold text-gray-900">{client.name}</h1>
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${client.isActive ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                {client.isActive ? "פעיל" : "לא פעיל"}
              </span>
              {client.industry && (
                <span className="text-xs px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 font-medium">
                  {INDUSTRY_HE[client.industry] ?? client.industry}
                </span>
              )}
              <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-600 font-medium">
                {PLAN_HE[client.plan] ?? client.plan}
              </span>
            </div>
            <p className="text-sm text-gray-500 mt-0.5">{client.slug} · {client.email}</p>
            {client.subdomain && (
              <p className="text-xs text-indigo-500 mt-0.5">
                {`${client.subdomain}.${process.env.NEXT_PUBLIC_ROOT_DOMAIN ?? "localhost"}`}
              </p>
            )}
          </div>
          <div className="mr-auto flex items-center gap-2">
            <CopyLinkButton url={`/${client.slug}/intake`} label="העתק קישור לטופס" />
            <a
              href={`/${client.slug}/intake`}
              target="_blank"
              className="flex items-center gap-1.5 text-sm text-indigo-500 hover:text-indigo-700 font-medium"
            >
              <ExternalLink size={14} />
              פתח טופס
            </a>
            <Link
              href={`/admin/clients/${client.id}/reviews`}
              className="flex items-center gap-1.5 text-sm text-yellow-600 hover:text-yellow-700 font-medium"
            >
              <Star size={14} />
              ביקורות
            </Link>
          </div>
        </div>
      </div>

      <ClientTabs tabs={TABS} panels={{
        "overview": (
          <div className="space-y-6">
            <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
              {[
                { label: "סה\"כ לידים", value: client._count.leads, icon: Users, color: "text-indigo-600 bg-indigo-50" },
                { label: "לידים החודש", value: leadsThisMonth, icon: TrendingUp, color: "text-blue-600 bg-blue-50" },
                { label: "אחוז המרה", value: `${conversionRate}%`, icon: TrendingUp, color: "text-green-600 bg-green-50" },
                { label: "הכנסה כוללת", value: `₪${revenue.toLocaleString("he-IL")}`, icon: Banknote, color: "text-amber-600 bg-amber-50" },
              ].map((s) => {
                const Icon = s.icon;
                return (
                  <div key={s.label} className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center mb-3 ${s.color}`}>
                      <Icon size={18} />
                    </div>
                    <p className="text-2xl font-bold text-gray-900">{s.value}</p>
                    <p className="text-sm text-gray-500 mt-0.5">{s.label}</p>
                  </div>
                );
              })}
            </div>
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm">
              <div><p className="text-xs text-gray-400 mb-1">טלפון</p><p className="font-medium text-gray-800">{client.phone ?? "—"}</p></div>
              <div><p className="text-xs text-gray-400 mb-1">וואטסאפ</p><p className="font-medium text-gray-800">{client.whatsappNumber ?? "—"}</p></div>
              <div><p className="text-xs text-gray-400 mb-1">תקציב חודשי</p><p className="font-medium text-gray-800">{client.monthlyBudget ? `₪${client.monthlyBudget.toLocaleString("he-IL")}` : "—"}</p></div>
              <div><p className="text-xs text-gray-400 mb-1">פיקסל פייסבוק</p><p className="font-medium text-gray-800 truncate">{client.facebookPixelId ?? "—"}</p></div>
              <div><p className="text-xs text-gray-400 mb-1">Google Ads ID</p><p className="font-medium text-gray-800 truncate">{client.googleAdsId ?? "—"}</p></div>
              <div><p className="text-xs text-gray-400 mb-1">Google Analytics 4</p><p className="font-medium text-gray-800 truncate">{client.googleAnalyticsId ?? "—"}</p></div>
              <div><p className="text-xs text-gray-400 mb-1">קישור Google Business</p><p className="font-medium text-gray-800 truncate">{client.googleBusinessUrl ?? "—"}</p></div>
              <div><p className="text-xs text-gray-400 mb-1">דוחות לאימייל</p><p className="font-medium text-gray-800 truncate">{client.reportEmail ?? "—"}</p></div>
            </div>
          </div>
        ),
        "leads": (
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
              <h2 className="font-semibold text-gray-900">לידים ({client._count.leads})</h2>
              <Link href={`/admin/leads?clientId=${client.id}`} className="text-xs text-indigo-500 hover:text-indigo-700 font-medium">
                הצג בדף לידים
              </Link>
            </div>
            <table className="min-w-full divide-y divide-gray-100">
              <thead className="bg-gray-50">
                <tr>
                  {["שם", "טלפון", "מקור", "סטטוס", "ניקוד", "תאריך"].map((h) => (
                    <th key={h} className="px-5 py-3 text-right text-xs font-semibold text-gray-500 uppercase">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {client.leads.map((lead) => (
                  <tr key={lead.id} className="hover:bg-gray-50">
                    <td className="px-5 py-3">
                      <p className="text-sm font-medium text-gray-900">{lead.firstName} {lead.lastName}</p>
                      <p className="text-xs text-gray-400">{lead.email ?? ""}</p>
                    </td>
                    <td className="px-5 py-3 text-sm text-gray-600">{lead.phone ?? "—"}</td>
                    <td className="px-5 py-3 text-sm text-gray-500">{lead.source ?? "—"}</td>
                    <td className="px-5 py-3">
                      <span className={`text-xs px-2 py-1 rounded-full font-medium ${STATUS_COLORS[lead.status] ?? "bg-gray-100 text-gray-600"}`}>
                        {STATUS_HE[lead.status] ?? lead.status}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-sm text-gray-500">{lead.leadScore}</td>
                    <td className="px-5 py-3 text-sm text-gray-400">{new Date(lead.createdAt).toLocaleDateString("he-IL")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {client.leads.length === 0 && (
              <p className="px-6 py-10 text-center text-sm text-gray-500">עדיין אין לידים.</p>
            )}
          </div>
        ),
        "analytics": <ClientAnalyticsTab clientId={client.id} />,
        "reports": (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-500">{client.reports.length} דוחות</p>
              <GenerateReportButton clients={[]} fixedClientId={client.id} />
            </div>
            {client.reports.length === 0 ? (
              <div className="bg-white rounded-xl border border-gray-100 shadow-sm flex flex-col items-center py-16">
                <ClipboardList size={28} className="text-gray-300 mb-3" />
                <p className="text-sm text-gray-500">עדיין אין דוחות.</p>
                <p className="text-xs text-gray-400 mt-1">לחץ על &quot;צור דוח&quot; כדי להתחיל</p>
              </div>
            ) : (
              client.reports.map((report) => (
                <div key={report.id} className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <p className="font-semibold text-gray-900">דוח {REPORT_TYPE_HE[report.type] ?? report.type}</p>
                      <p className="text-xs text-gray-500 mt-0.5">תקופה: {report.period}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <SendReportButton reportId={report.id} />
                      <p className="text-xs text-gray-400">{new Date(report.createdAt).toLocaleDateString("he-IL")}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-4 gap-3">
                    {[
                      { label: "לידים", val: report.totalLeads },
                      { label: "נסגרו", val: report.wonLeads },
                      { label: "המרה", val: `${report.conversionRate.toFixed(1)}%` },
                      { label: "הכנסה", val: report.revenue ? `₪${report.revenue.toLocaleString("he-IL")}` : "—" },
                    ].map((s) => (
                      <div key={s.label} className="bg-gray-50 rounded-lg p-3 text-center">
                        <p className="text-lg font-bold text-gray-900">{s.val}</p>
                        <p className="text-xs text-gray-500">{s.label}</p>
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
              <div className="bg-gradient-to-br from-indigo-50 to-purple-50 border border-indigo-200 rounded-2xl p-8 text-center mb-6">
                <div className="text-4xl mb-3">🧙</div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">בנה דף נחיתה עם אשף AI</h3>
                <p className="text-gray-500 text-sm mb-5 max-w-md mx-auto">
                  ענה על כמה שאלות פשוטות וה-AI יבנה לך דף נחיתה מקצועי תוך דקה
                </p>
                <Link
                  href={`/admin/clients/${client.id}/builder/wizard`}
                  className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl px-6 py-3 text-sm transition-colors shadow-lg shadow-indigo-500/20"
                >
                  ✨ התחל באשף
                </Link>
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
            <div className="border-t border-gray-200 pt-4">
              <Link
                href={`/admin/clients/${client.id}/chatbot`}
                className="inline-flex items-center gap-2 text-sm text-indigo-600 hover:text-indigo-700 font-medium"
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
