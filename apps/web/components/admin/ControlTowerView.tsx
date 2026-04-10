"use client";

import Link from "next/link";
import {
  Building2,
  Users,
  Target,
  Activity,
  CheckCircle,
  AlertTriangle,
  Globe,
  ExternalLink,
  TrendingUp,
  Bot,
} from "lucide-react";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type ClientRow = {
  id: string;
  name: string;
  slug: string;
  primaryColor: string;
  industry: string | null;
  isActive: boolean;
  pagePublished: boolean;
  createdAt: Date;
  totalLeads: number;
  leads7d: number;
  wonLeads: number;
};

type Props = {
  userName: string;
  clients: ClientRow[];
  totalClients: number;
  totalLeadsToday: number;
  totalLeads7d: number;
  publishedCount: number;
  broadcastCount: number;
};

// ---------------------------------------------------------------------------
// Industry labels
// ---------------------------------------------------------------------------

const INDUSTRY_HE: Record<string, string> = {
  REAL_ESTATE: 'נדל"ן', ROOFING: "גגות", ALUMINUM: "אלומיניום",
  COSMETICS: "קוסמטיקה", CLEANING: "ניקיון", SOLAR: "סולארי",
  FINANCE: "פיננסים", LEGAL: "משפטי", MEDICAL: "רפואה",
  FOOD: "מזון", FITNESS: "כושר", EDUCATION: "חינוך",
  GENERAL: "כללי", OTHER: "אחר",
};

// ---------------------------------------------------------------------------
// Owner AI Summary — rule-based recommendations from existing data
// ---------------------------------------------------------------------------

type Recommendation = {
  text: string;
  clientName: string;
  clientId: string;
  clientSlug: string;
  level: "critical" | "watch" | "opportunity";
};

function buildRecommendations(clients: ClientRow[]): Recommendation[] {
  const recs: Recommendation[] = [];

  // Rule 1: No page published → critical
  for (const c of clients) {
    if (!c.pagePublished) {
      recs.push({
        text: "אין דף נחיתה — בנה דף כדי להתחיל לקבל לידים",
        clientName: c.name,
        clientId: c.id,
        clientSlug: c.slug,
        level: "critical",
      });
    }
  }

  // Rule 2: Page exists, 0 total leads → critical
  for (const c of clients) {
    if (c.pagePublished && c.totalLeads === 0) {
      recs.push({
        text: "דף מפורסם אבל 0 לידים — שתף את הקישור או שפר תנועה",
        clientName: c.name,
        clientId: c.id,
        clientSlug: c.slug,
        level: "critical",
      });
    }
  }

  // Rule 3: Has leads but 0 in 7d → watch
  for (const c of clients) {
    if (c.pagePublished && c.totalLeads > 0 && c.leads7d === 0) {
      recs.push({
        text: "אין לידים חדשים השבוע — בדוק תנועה ושיווק",
        clientName: c.name,
        clientId: c.id,
        clientSlug: c.slug,
        level: "watch",
      });
    }
  }

  // Rule 4: New leads in 7d → opportunity
  for (const c of clients) {
    if (c.leads7d > 0 && c.wonLeads === 0) {
      recs.push({
        text: `${c.leads7d} לידים חדשים — עקוב וסגור עסקאות`,
        clientName: c.name,
        clientId: c.id,
        clientSlug: c.slug,
        level: "opportunity",
      });
    }
  }

  // Sort: critical first, then watch, then opportunity. Max 3.
  const order = { critical: 0, watch: 1, opportunity: 2 };
  return recs.sort((a, b) => order[a.level] - order[b.level]).slice(0, 3);
}

const LEVEL_STYLES = {
  critical: { dot: "bg-red-500", text: "text-red-700", bg: "bg-red-50", label: "דחוף" },
  watch:    { dot: "bg-amber-400", text: "text-amber-700", bg: "bg-amber-50", label: "מעקב" },
  opportunity: { dot: "bg-blue-500", text: "text-blue-700", bg: "bg-blue-50", label: "הזדמנות" },
};

function OwnerAiSummary({
  clients,
  totalClients,
  totalLeadsToday,
  totalLeads7d,
  activeClientCount,
  clientsWithNoPage,
  clientsWithNoLeads,
}: {
  clients: ClientRow[];
  totalClients: number;
  totalLeadsToday: number;
  totalLeads7d: number;
  activeClientCount: number;
  clientsWithNoPage: ClientRow[];
  clientsWithNoLeads: ClientRow[];
}) {
  const recs = buildRecommendations(clients);
  const needsAttention = clientsWithNoPage.length + clientsWithNoLeads.length;

  // Build one-line summary
  const summaryParts: string[] = [];
  if (totalLeadsToday > 0) summaryParts.push(`${totalLeadsToday} לידים חדשים היום`);
  else if (totalLeads7d > 0) summaryParts.push(`${totalLeads7d} לידים ב-7 ימים`);
  summaryParts.push(`${activeClientCount} לקוחות פעילים`);
  if (needsAttention > 0) summaryParts.push(`${needsAttention} דורשים תשומת לב`);
  const summaryLine = summaryParts.join(" · ");

  const allHealthy = recs.length === 0;

  return (
    <div className="bg-gradient-to-l from-slate-900 to-slate-800 rounded-2xl overflow-hidden">
      {/* Header row */}
      <div className="px-6 py-4 flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center flex-shrink-0">
          <Bot size={20} className="text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-white font-semibold text-sm">מיכאל — יועץ ניהולי</p>
          <p className="text-slate-400 text-xs mt-0.5">{summaryLine}</p>
        </div>
        {allHealthy && (
          <div className="flex items-center gap-1.5 bg-green-500/20 rounded-full px-3 py-1">
            <div className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
            <span className="text-[11px] text-green-300 font-medium">הכל תקין</span>
          </div>
        )}
      </div>

      {/* Recommendations */}
      {recs.length > 0 && (
        <div className="border-t border-slate-700/50 px-6 py-3 space-y-2">
          {recs.map((rec, i) => {
            const style = LEVEL_STYLES[rec.level];
            return (
              <div key={i} className="flex items-center gap-3 group">
                <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${style.dot}`} />
                <div className="flex-1 min-w-0">
                  <span className="text-white text-xs font-medium">{rec.clientName}</span>
                  <span className="text-slate-400 text-xs"> — {rec.text}</span>
                </div>
                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${style.bg} ${style.text}`}>
                  {style.label}
                </span>
                <Link
                  href={`/admin/clients/${rec.clientId}`}
                  className="text-[11px] text-blue-400 hover:text-blue-300 font-medium opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
                >
                  צפה →
                </Link>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export function ControlTowerView({
  userName,
  clients,
  totalClients,
  totalLeadsToday,
  totalLeads7d,
  publishedCount,
  broadcastCount,
}: Props) {
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "בוקר טוב" : hour < 17 ? "צהריים טובים" : "ערב טוב";

  // Compute alerts from existing data
  const clientsWithNoLeads = clients.filter((c) => c.totalLeads === 0 && c.pagePublished);
  const clientsWithNoPage = clients.filter((c) => !c.pagePublished);
  const activeClients = clients.filter((c) => c.leads7d > 0);
  const hasAlerts = clientsWithNoLeads.length > 0 || clientsWithNoPage.length > 0;

  return (
    <div className="min-h-screen bg-[#F8FAFC] p-6 md:p-8" dir="rtl">
      <div className="max-w-6xl mx-auto space-y-8">

        {/* ── Header ── */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">
              {greeting}, {userName}! 👋
            </h1>
            <p className="text-sm text-slate-500 mt-1">מרכז בקרה — סקירת כל הלקוחות והמערכת</p>
          </div>
          <Link
            href="/admin/clients/new"
            className="bg-blue-600 text-white text-sm font-semibold px-4 py-2.5 rounded-xl hover:bg-blue-700 transition-colors flex items-center gap-2"
          >
            <Users size={15} />
            + לקוח חדש
          </Link>
        </div>

        {/* ── Michael — Owner AI Summary Layer ── */}
        <OwnerAiSummary
          clients={clients}
          totalClients={totalClients}
          totalLeadsToday={totalLeadsToday}
          totalLeads7d={totalLeads7d}
          activeClientCount={activeClients.length}
          clientsWithNoPage={clientsWithNoPage}
          clientsWithNoLeads={clientsWithNoLeads}
        />

        {/* ═══════════════════════════════════════════════════════════════════ */}
        {/* SECTION 1 — KPI Cards                                            */}
        {/* ═══════════════════════════════════════════════════════════════════ */}

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          {/* Total Clients */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
            <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center mb-3">
              <Building2 size={18} className="text-blue-600" />
            </div>
            <p className="text-2xl font-bold text-slate-900">{totalClients}</p>
            <p className="text-xs text-slate-500 mt-0.5">לקוחות</p>
          </div>

          {/* Active Clients (leads in 7d) */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
            <div className="w-9 h-9 rounded-xl bg-green-50 flex items-center justify-center mb-3">
              <Activity size={18} className="text-green-600" />
            </div>
            <p className="text-2xl font-bold text-slate-900">{activeClients.length}</p>
            <p className="text-xs text-slate-500 mt-0.5">לקוחות פעילים (7 ימים)</p>
          </div>

          {/* Leads today */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
            <div className="w-9 h-9 rounded-xl bg-amber-50 flex items-center justify-center mb-3">
              <Target size={18} className="text-amber-600" />
            </div>
            <p className="text-2xl font-bold text-slate-900">{totalLeadsToday}</p>
            <p className="text-xs text-slate-500 mt-0.5">לידים היום</p>
          </div>

          {/* Pages published */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
            <div className="w-9 h-9 rounded-xl bg-purple-50 flex items-center justify-center mb-3">
              <Globe size={18} className="text-purple-600" />
            </div>
            <p className="text-2xl font-bold text-slate-900">{publishedCount}</p>
            <p className="text-xs text-slate-500 mt-0.5">דפים מפורסמים</p>
          </div>

          {/* System health */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
            <div className="w-9 h-9 rounded-xl bg-emerald-50 flex items-center justify-center mb-3">
              <CheckCircle size={18} className="text-emerald-600" />
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              <p className="text-lg font-bold text-emerald-700">תקין</p>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">סטטוס מערכת</p>
          </div>
        </div>

        {/* ═══════════════════════════════════════════════════════════════════ */}
        {/* SECTION 2 — Clients Table                                        */}
        {/* ═══════════════════════════════════════════════════════════════════ */}

        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm">
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <h2 className="font-semibold text-slate-900">הלקוחות שלי</h2>
              <span className="text-xs text-slate-400">{clients.length} לקוחות</span>
            </div>
            <Link
              href="/admin/clients"
              className="text-xs text-blue-600 hover:text-blue-700 font-medium"
            >
              הצג הכל →
            </Link>
          </div>

          {clients.length === 0 ? (
            <div className="py-16 text-center">
              <Building2 size={32} className="mx-auto text-slate-300 mb-3" />
              <p className="text-slate-500 font-medium mb-1">אין לקוחות עדיין</p>
              <Link
                href="/admin/clients/new"
                className="text-sm text-blue-600 hover:text-blue-700 font-medium"
              >
                + הוסף לקוח ראשון
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-xs text-slate-500 border-b border-slate-50 bg-slate-50/50">
                    <th className="text-right px-6 py-3 font-medium">לקוח</th>
                    <th className="text-right px-3 py-3 font-medium hidden sm:table-cell">תחום</th>
                    <th className="text-center px-3 py-3 font-medium">לידים</th>
                    <th className="text-center px-3 py-3 font-medium hidden md:table-cell">7 ימים</th>
                    <th className="text-center px-3 py-3 font-medium hidden md:table-cell">דף</th>
                    <th className="text-center px-3 py-3 font-medium">סטטוס</th>
                    <th className="text-center px-3 py-3 font-medium hidden lg:table-cell">עדיפות</th>
                    <th className="text-center px-4 py-3 font-medium">פעולות</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {clients.map((client) => {
                    // Activity status logic
                    const status: { label: string; color: string } =
                      !client.pagePublished
                        ? { label: "דרוש הגדרה", color: "bg-slate-100 text-slate-600" }
                        : client.leads7d > 0
                        ? { label: "פעיל", color: "bg-green-50 text-green-700" }
                        : client.totalLeads > 0
                        ? { label: "שקט", color: "bg-amber-50 text-amber-700" }
                        : { label: "לא פעיל", color: "bg-red-50 text-red-600" };

                    // Priority logic: 3 levels
                    const priority: { label: string; color: string; dot: string } =
                      !client.pagePublished
                        ? { label: "קריטי", color: "text-red-600", dot: "bg-red-500" }
                        : client.pagePublished && client.totalLeads === 0
                        ? { label: "קריטי", color: "text-red-600", dot: "bg-red-500" }
                        : client.pagePublished && client.leads7d === 0
                        ? { label: "מעקב", color: "text-amber-600", dot: "bg-amber-400" }
                        : { label: "תקין", color: "text-green-600", dot: "bg-green-500" };

                    return (
                      <tr key={client.id} className="hover:bg-slate-50/50 transition-colors">
                        {/* Name */}
                        <td className="px-6 py-3.5">
                          <div className="flex items-center gap-3">
                            <div
                              className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                              style={{ backgroundColor: client.primaryColor || "#6366f1" }}
                            >
                              {client.name[0]}
                            </div>
                            <div className="min-w-0">
                              <p className="font-medium text-slate-900 truncate">{client.name}</p>
                              <p className="text-[11px] text-slate-400 truncate">{client.slug}</p>
                            </div>
                          </div>
                        </td>

                        {/* Industry */}
                        <td className="px-3 py-3.5 hidden sm:table-cell">
                          <span className="text-xs text-slate-500">
                            {INDUSTRY_HE[client.industry ?? ""] ?? client.industry ?? "—"}
                          </span>
                        </td>

                        {/* Total leads */}
                        <td className="px-3 py-3.5 text-center">
                          <span className={`text-sm font-bold ${client.totalLeads > 0 ? "text-slate-900" : "text-slate-300"}`}>
                            {client.totalLeads}
                          </span>
                        </td>

                        {/* Leads 7d */}
                        <td className="px-3 py-3.5 text-center hidden md:table-cell">
                          {client.leads7d > 0 ? (
                            <span className="inline-flex items-center gap-1 bg-green-50 text-green-700 text-xs font-semibold px-2 py-0.5 rounded-full">
                              <TrendingUp size={10} />
                              {client.leads7d}
                            </span>
                          ) : (
                            <span className="text-xs text-slate-300">0</span>
                          )}
                        </td>

                        {/* Page status */}
                        <td className="px-3 py-3.5 text-center hidden md:table-cell">
                          {client.pagePublished ? (
                            <span className="inline-flex items-center gap-1 text-xs text-green-600 font-medium">
                              <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
                              פורסם
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-xs text-slate-400">
                              <div className="w-1.5 h-1.5 rounded-full bg-slate-300" />
                              טיוטה
                            </span>
                          )}
                        </td>

                        {/* Activity status */}
                        <td className="px-3 py-3.5 text-center">
                          <span className={`inline-block text-[11px] font-semibold px-2.5 py-1 rounded-full ${status.color}`}>
                            {status.label}
                          </span>
                        </td>

                        {/* Priority */}
                        <td className="px-3 py-3.5 text-center hidden lg:table-cell">
                          <span className={`inline-flex items-center gap-1.5 text-[11px] font-semibold ${priority.color}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${priority.dot}`} />
                            {priority.label}
                          </span>
                        </td>

                        {/* Actions */}
                        <td className="px-4 py-3.5">
                          <div className="flex items-center justify-center gap-1.5">
                            <Link
                              href={`/admin/clients/${client.id}`}
                              className="text-xs text-blue-600 hover:text-blue-700 font-semibold px-2.5 py-1.5 rounded-lg hover:bg-blue-50 transition-colors"
                            >
                              צפה
                            </Link>
                            <Link
                              href={`/client/${client.slug}`}
                              target="_blank"
                              className="text-xs text-slate-400 hover:text-slate-600 px-2 py-1.5 rounded-lg hover:bg-slate-100 transition-colors"
                              title="כנס כלקוח"
                            >
                              <ExternalLink size={13} />
                            </Link>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* ═══════════════════════════════════════════════════════════════════ */}
        {/* SECTION 3 — Alerts / Issues                                      */}
        {/* ═══════════════════════════════════════════════════════════════════ */}

        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm">
          <div className="px-6 py-4 border-b border-slate-100">
            <h2 className="font-semibold text-slate-900">
              {hasAlerts ? "⚠️ דורש תשומת לב" : "✅ מצב המערכת"}
            </h2>
          </div>

          {!hasAlerts ? (
            <div className="px-6 py-8 text-center">
              <CheckCircle size={28} className="mx-auto text-green-500 mb-2" />
              <p className="text-sm font-medium text-green-700">הכל תקין — אין בעיות פתוחות</p>
              <p className="text-xs text-slate-400 mt-1">כל הלקוחות פעילים ודפים מפורסמים</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-50">
              {/* Clients with published page but 0 leads */}
              {clientsWithNoLeads.length > 0 && (
                <div className="px-6 py-4 flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <AlertTriangle size={16} className="text-amber-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-900">
                      {clientsWithNoLeads.length} לקוחות עם דף מפורסם אבל 0 לידים
                    </p>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {clientsWithNoLeads.map((c) => c.name).join(", ")}
                    </p>
                  </div>
                </div>
              )}

              {/* Clients with no published page */}
              {clientsWithNoPage.length > 0 && (
                <div className="px-6 py-4 flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-red-50 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Globe size={16} className="text-red-500" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-900">
                      {clientsWithNoPage.length} לקוחות בלי דף נחיתה
                    </p>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {clientsWithNoPage.map((c) => c.name).join(", ")}
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
