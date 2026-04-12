"use client";

import { useState } from "react";
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
  Search,
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
  plan: string;
  isActive: boolean;
  pagePublished: boolean;
  createdAt: Date;
  totalLeads: number;
  leads7d: number;
  wonLeads: number;
  newLeads: number;
};

const PLAN_LABELS: Record<string, { label: string; color: string; price: string }> = {
  BASIC:  { label: "ניסיון", color: "bg-slate-100 text-slate-600", price: "₪0" },
  PRO:    { label: "Pro",    color: "bg-blue-50 text-blue-700",    price: "₪375" },
  AGENCY: { label: 'נדל"ן',  color: "bg-emerald-50 text-emerald-700", price: "₪425" },
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

  // Rule 3: Untreated leads (status=NEW) → critical if many, watch if few
  for (const c of clients) {
    if (c.newLeads >= 3) {
      recs.push({
        text: `${c.newLeads} לידים לא טופלו — הגב עכשיו לפני שיתקררו`,
        clientName: c.name,
        clientId: c.id,
        clientSlug: c.slug,
        level: "critical",
      });
    } else if (c.newLeads > 0) {
      recs.push({
        text: `${c.newLeads} לידים חדשים ממתינים למענה`,
        clientName: c.name,
        clientId: c.id,
        clientSlug: c.slug,
        level: "watch",
      });
    }
  }

  // Rule 4: Has leads but 0 in 7d → watch
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

  // Sort: critical first, then watch, then opportunity. Max 4.
  const order = { critical: 0, watch: 1, opportunity: 2 };
  return recs.sort((a, b) => order[a.level] - order[b.level]).slice(0, 4);
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
// Clients Table with Filter Tabs + Search
// ---------------------------------------------------------------------------

type FilterKey = "all" | "critical" | "watch" | "active" | "no_page" | "no_leads";

const FILTER_TABS: { key: FilterKey; label: string; color: string }[] = [
  { key: "all",       label: "הכל",          color: "bg-slate-100 text-slate-700" },
  { key: "critical",  label: "🔴 קריטי",     color: "bg-red-50 text-red-700" },
  { key: "watch",     label: "🟡 מעקב",      color: "bg-amber-50 text-amber-700" },
  { key: "active",    label: "🟢 פעיל",      color: "bg-green-50 text-green-700" },
  { key: "no_page",   label: "ללא דף",       color: "bg-slate-100 text-slate-600" },
  { key: "no_leads",  label: "ללא לידים",    color: "bg-slate-100 text-slate-600" },
];

function getClientPriority(c: ClientRow): "critical" | "watch" | "active" {
  if (!c.pagePublished) return "critical";
  if (c.pagePublished && c.totalLeads === 0) return "critical";
  if (c.pagePublished && c.leads7d === 0) return "watch";
  return "active";
}

function filterClients(clients: ClientRow[], filter: FilterKey, search: string): ClientRow[] {
  let filtered = clients;
  switch (filter) {
    case "critical":  filtered = clients.filter((c) => getClientPriority(c) === "critical"); break;
    case "watch":     filtered = clients.filter((c) => getClientPriority(c) === "watch"); break;
    case "active":    filtered = clients.filter((c) => getClientPriority(c) === "active"); break;
    case "no_page":   filtered = clients.filter((c) => !c.pagePublished); break;
    case "no_leads":  filtered = clients.filter((c) => c.totalLeads === 0); break;
  }
  if (search) {
    const q = search.toLowerCase();
    filtered = filtered.filter((c) =>
      c.name.toLowerCase().includes(q) || c.slug.toLowerCase().includes(q)
    );
  }
  // Sort: critical first, then watch, then active
  const order = { critical: 0, watch: 1, active: 2 };
  return filtered.sort((a, b) => order[getClientPriority(a)] - order[getClientPriority(b)]);
}

function ClientsTableSection({ clients }: { clients: ClientRow[] }) {
  const [filter, setFilter] = useState<FilterKey>("all");
  const [search, setSearch] = useState("");
  const filtered = filterClients(clients, filter, search);

  // Count per filter for badges
  const counts: Record<FilterKey, number> = {
    all:       clients.length,
    critical:  clients.filter((c) => getClientPriority(c) === "critical").length,
    watch:     clients.filter((c) => getClientPriority(c) === "watch").length,
    active:    clients.filter((c) => getClientPriority(c) === "active").length,
    no_page:   clients.filter((c) => !c.pagePublished).length,
    no_leads:  clients.filter((c) => c.totalLeads === 0).length,
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm">
      {/* Header + Search */}
      <div className="px-6 py-4 border-b border-slate-100">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <h2 className="font-semibold text-slate-900">הלקוחות שלי</h2>
            <span className="text-xs text-slate-400">{filtered.length} מתוך {clients.length}</span>
          </div>
          <Link href="/admin/clients" className="text-xs text-blue-600 hover:text-blue-700 font-medium">
            הצג הכל →
          </Link>
        </div>

        {/* Filter tabs */}
        <div className="flex gap-1.5 flex-wrap mb-3">
          {FILTER_TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setFilter(tab.key)}
              className={`text-[11px] font-semibold px-3 py-1.5 rounded-lg transition-colors ${
                filter === tab.key
                  ? tab.color + " ring-1 ring-slate-300"
                  : "bg-white text-slate-400 hover:bg-slate-50"
              }`}
            >
              {tab.label}
              {counts[tab.key] > 0 && filter !== tab.key && (
                <span className="mr-1 text-[10px] opacity-60">({counts[tab.key]})</span>
              )}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative">
          <Search size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="חפש לקוח..."
            className="w-full pr-9 pl-3 py-2 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-blue-200 focus:border-blue-400 outline-none"
          />
        </div>
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <div className="py-12 text-center">
          {clients.length === 0 ? (
            <>
              <Building2 size={32} className="mx-auto text-slate-300 mb-3" />
              <p className="text-slate-500 font-medium mb-1">אין לקוחות עדיין</p>
              <Link href="/admin/clients/new" className="text-sm text-blue-600 hover:text-blue-700 font-medium">
                + הוסף לקוח ראשון
              </Link>
            </>
          ) : (
            <p className="text-sm text-slate-400">אין לקוחות מתאימים לסינון</p>
          )}
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs text-slate-500 border-b border-slate-50 bg-slate-50/50">
                <th className="text-right px-6 py-3 font-medium">לקוח</th>
                <th className="text-center px-3 py-3 font-medium">לידים</th>
                <th className="text-center px-3 py-3 font-medium hidden md:table-cell">7 ימים</th>
                <th className="text-center px-3 py-3 font-medium hidden md:table-cell">דף</th>
                <th className="text-center px-3 py-3 font-medium">סטטוס</th>
                <th className="text-center px-4 py-3 font-medium">פעולות</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filtered.map((client) => {
                const prio = getClientPriority(client);
                const statusStyle = {
                  critical: { label: prio === "critical" && !client.pagePublished ? "דרוש הגדרה" : "קריטי", color: "bg-red-50 text-red-600" },
                  watch:    { label: "שקט", color: "bg-amber-50 text-amber-700" },
                  active:   { label: "פעיל", color: "bg-green-50 text-green-700" },
                }[prio];

                return (
                  <tr key={client.id} className={`hover:bg-slate-50/50 transition-colors ${prio === "critical" ? "bg-red-50/20" : ""}`}>
                    {/* Name + industry */}
                    <td className="px-6 py-3.5">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                          style={{ backgroundColor: client.primaryColor || "#6366f1" }}
                        >
                          {client.name[0]}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <p className="font-medium text-slate-900 truncate">{client.name}</p>
                            {(() => {
                              const p = PLAN_LABELS[client.plan] ?? PLAN_LABELS.BASIC;
                              return (
                                <span className={`text-[9px] font-semibold px-1.5 py-0.5 rounded ${p.color}`}>
                                  {p.label}
                                </span>
                              );
                            })()}
                          </div>
                          <p className="text-[11px] text-slate-400 truncate">
                            {INDUSTRY_HE[client.industry ?? ""] ?? client.industry ?? "כללי"}
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* Total leads */}
                    <td className="px-3 py-3.5 text-center">
                      <span className={`text-sm font-bold ${client.totalLeads > 0 ? "text-slate-900" : "text-slate-300"}`}>
                        {client.totalLeads}
                      </span>
                    </td>

                    {/* 7d leads */}
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

                    {/* Page */}
                    <td className="px-3 py-3.5 text-center hidden md:table-cell">
                      {client.pagePublished ? (
                        <span className="inline-flex items-center gap-1 text-xs text-green-600 font-medium">
                          <span className="w-1.5 h-1.5 rounded-full bg-green-500" /> פורסם
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs text-slate-400">
                          <span className="w-1.5 h-1.5 rounded-full bg-slate-300" /> טיוטה
                        </span>
                      )}
                    </td>

                    {/* Status */}
                    <td className="px-3 py-3.5 text-center">
                      <span className={`inline-block text-[11px] font-semibold px-2.5 py-1 rounded-full ${statusStyle.color}`}>
                        {statusStyle.label}
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
        {/* SECTION 2 — Clients Table with filters                           */}
        {/* ═══════════════════════════════════════════════════════════════════ */}

        <ClientsTableSection clients={clients} />

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
