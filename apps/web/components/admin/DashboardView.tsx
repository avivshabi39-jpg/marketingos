"use client";

import { useState } from "react";
import Link from "next/link";
import { Circle, Users, Globe, Target, TrendingUp } from "lucide-react";
import { useRouter } from "next/navigation";
import { Tooltip } from "@/components/ui/Tooltip";
import { KPICard } from "@/components/ui/Card";
import dynamic from "next/dynamic";

const N8nDashboard = dynamic(() => import("./N8nDashboard").then((m) => ({ default: m.N8nDashboard })), { ssr: false });

// ─── Industry helpers ─────────────────────────────────────────────────────────
const INDUSTRY_EMOJI: Record<string, string> = {
  REAL_ESTATE: "🏡",
  FINANCE: "💰",
  COSMETICS: "💄",
  BEAUTY: "💄",
  CLEANING: "🧹",
  ROOFING: "🏗️",
  ALUMINUM: "🪟",
  FOOD: "🍕",
  FITNESS: "💪",
  MEDICAL: "🏥",
  AVIATION: "✈️",
  LEGAL: "⚖️",
  EDUCATION: "📚",
  CONSTRUCTION: "🏗️",
  TOURISM: "🌍",
  SOLAR: "☀️",
  GENERAL: "🏢",
  OTHER: "🏢",
};

const INDUSTRY_LABELS: Record<string, string> = {
  REAL_ESTATE: 'נדל"ן',
  ROOFING: "גגות",
  ALUMINUM: "אלומיניום",
  COSMETICS: "קוסמטיקה",
  BEAUTY: "קוסמטיקה",
  CLEANING: "ניקיון",
  SOLAR: "סולארי",
  OTHER: "אחר",
  AVIATION: "תעופה",
  TOURISM: "תיירות",
  FINANCE: "פיננסים",
  LEGAL: "משפטי",
  MEDICAL: "רפואה",
  FOOD: "מזון",
  FITNESS: "כושר",
  EDUCATION: "חינוך",
  GENERAL: "כללי",
};

const STATUS_COLORS: Record<string, string> = {
  NEW: "bg-blue-50 text-blue-700 border border-blue-200",
  CONTACTED: "bg-amber-50 text-amber-700 border border-amber-200",
  QUALIFIED: "bg-purple-50 text-purple-700 border border-purple-200",
  PROPOSAL: "bg-orange-50 text-orange-700 border border-orange-200",
  WON: "bg-emerald-50 text-emerald-700 border border-emerald-200",
  LOST: "bg-red-50 text-red-700 border border-red-200",
};

const STATUS_HE: Record<string, string> = {
  NEW: "חדש",
  CONTACTED: "נוצר קשר",
  QUALIFIED: "מוסמך",
  PROPOSAL: "הצעה",
  WON: "נסגר",
  LOST: "אבוד",
};

const SOURCE_COLORS: Record<string, string> = {
  facebook: "bg-blue-500",
  google: "bg-red-500",
  organic: "bg-emerald-500",
  manual: "bg-slate-400",
  other: "bg-purple-400",
};

const SOURCE_LABELS: Record<string, string> = {
  facebook: "פייסבוק",
  google: "גוגל",
  organic: "אורגני",
  manual: "ידני",
  other: "אחר",
};

// ─── Types ────────────────────────────────────────────────────────────────────
type ClientType = {
  id: string;
  name: string;
  slug: string;
  primaryColor: string;
  industry: string | null;
  isActive: boolean;
  pagePublished: boolean;
  createdAt: Date;
  leadsThisMonth: number;
  totalLeads: number;
  wonLeads: number;
  leads7d: number;
};

type LandingPageItem = {
  id: string;
  title: string;
  slug: string;
  isPublished: boolean;
  createdAt: Date;
  leadsCount: number;
  client: { id: string; name: string; primaryColor: string; slug: string };
};

type Props = {
  session: { email: string; userId: string; role: string } | null;
  statsCards: Array<{
    title: string;
    value: string | number;
    delta: string | null;
    positive?: boolean;
    iconName: string;
    color: string;
  }>;
  clients: ClientType[];
  recentLeads: Array<{
    id: string;
    firstName: string;
    lastName: string;
    phone: string | null;
    status: string;
    source: string | null;
    createdAt: Date;
    client: { name: string; primaryColor: string };
  }>;
  recentActivities: Array<{
    id: string;
    type: string;
    content: string;
    createdAt: Date;
    lead: {
      firstName: string;
      lastName: string;
      client: { name: string; primaryColor: string };
    };
  }>;
  sourceSorted: Array<[string, number]>;
  totalSourceLeads: number;
  clientCount: number;
  landingPages?: LandingPageItem[];
  pipelineValue?: number;
  pipelineCount?: number;
  wonValue?: number;
  wonCount?: number;
  todayLeads?: number;
  newLeads7d?: number;
  publishedCount?: number;
  userName?: string;
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
function initials(first: string, last: string): string {
  return `${first[0] ?? ""}${last[0] ?? ""}`.toUpperCase();
}

function timeAgo(date: Date | string): string {
  const d = new Date(date);
  const diff = Date.now() - d.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "עכשיו";
  if (mins < 60) return `לפני ${mins} דקות`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `לפני ${hrs} שעות`;
  return `לפני ${Math.floor(hrs / 24)} ימים`;
}

// ─── Quick Actions ────────────────────────────────────────────────────────────
const QUICK_ACTIONS = [
  { icon: "👤", label: "הוסף לקוח",    href: "/admin/clients/new",  color: "#3B82F6" },
  { icon: "🎯", label: "הוסף ליד",     href: "/admin/leads?new=1",  color: "#059669" },
  { icon: "✨", label: "בנה דף",       href: "/admin/ai-agent",     color: "#D97706" },
  { icon: "📢", label: "שלח שידור",    href: "/admin/broadcast",    color: "#DC2626" },
  { icon: "📊", label: "צור דוח",      href: "/admin/reports",      color: "#7C3AED" },
  { icon: "🚀", label: "תבנית מהירה", href: "/admin/snapshots",    color: "#0891B2" },
];

// ─── Clients Table ────────────────────────────────────────────────────────────
function ClientsTable({ clients }: { clients: ClientType[] }) {
  const router = useRouter();
  const [search, setSearch] = useState("");

  const filtered = clients.filter((c) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return c.name.toLowerCase().includes(q) || c.slug?.toLowerCase().includes(q);
  });

  if (clients.length === 0) {
    return (
      <div className="text-center py-16 px-5">
        <div className="text-6xl mb-4">🚀</div>
        <h3 className="text-xl font-semibold mb-2 text-slate-900">
          עדיין אין לקוחות
        </h3>
        <p className="text-slate-500 mb-6">
          הוסף לקוח ראשון ובנה לו דף נחיתה תוך דקות
        </p>
        <a
          href="/admin/clients/new"
          className="inline-block bg-blue-600 hover:bg-blue-700 text-white px-7 py-3 rounded-xl font-semibold text-sm transition-colors shadow-sm hover:shadow-md"
        >
          + הוסף לקוח ראשון
        </a>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      {/* Search */}
      <div className="px-6 py-3 border-b border-slate-100">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="חפש לקוח..."
          className="w-full max-w-xs border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 bg-white transition-all duration-150 placeholder:text-slate-400"
          dir="rtl"
        />
      </div>
      <table className="w-full">
        <thead>
          <tr className="border-b border-slate-100 bg-slate-50">
            {["לקוח", "ענף", "דף", "לידים 7י׳", "הצטרף", ""].map((h) => (
              <th
                key={h}
                className="px-6 py-4 text-right text-xs font-semibold text-slate-500 uppercase tracking-wide whitespace-nowrap"
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {filtered.map((c) => {
            const emoji = INDUSTRY_EMOJI[c.industry ?? ""] ?? "🏢";
            const label = INDUSTRY_LABELS[c.industry ?? ""] ?? "כללי";
            const joined = new Date(c.createdAt).toLocaleDateString("he-IL", {
              day: "2-digit",
              month: "2-digit",
            });
            return (
              <tr
                key={c.id}
                onClick={() => router.push(`/admin/clients/${c.id}/overview`)}
                className="cursor-pointer border-b border-slate-50 hover:bg-slate-50/50 transition-colors duration-100"
              >
                {/* Name */}
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                      style={{ backgroundColor: c.primaryColor }}
                    >
                      {c.name[0]}
                    </div>
                    <span className="font-semibold text-sm text-slate-900">
                      {c.name}
                    </span>
                  </div>
                </td>
                {/* Industry */}
                <td className="px-6 py-4 text-sm text-slate-600 whitespace-nowrap">
                  {emoji} {label}
                </td>
                {/* Page status */}
                <td className="px-6 py-4 whitespace-nowrap">
                  {c.pagePublished ? (
                    <span className="text-emerald-600 text-sm font-medium">פורסם</span>
                  ) : (
                    <span className="text-slate-400 text-sm">טיוטה</span>
                  )}
                </td>
                {/* 7-day leads */}
                <td className="px-6 py-4 text-center">
                  <span
                    className={`inline-block min-w-[28px] rounded-lg px-2.5 py-0.5 text-sm text-center ${
                      c.leads7d > 0
                        ? "bg-blue-50 text-blue-700 font-bold border border-blue-200"
                        : "bg-slate-50 text-slate-400"
                    }`}
                  >
                    {c.leads7d}
                  </span>
                </td>
                {/* Joined */}
                <td className="px-6 py-4 text-xs text-slate-400 whitespace-nowrap">
                  {joined}
                </td>
                {/* Actions */}
                <td className="px-6 py-4">
                  <div className="flex gap-2 justify-end" onClick={(e) => e.stopPropagation()}>
                    {c.pagePublished ? (
                      <a
                        href={`/${c.slug}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg text-xs font-medium hover:bg-emerald-100 transition-colors"
                      >
                        צפה
                      </a>
                    ) : (
                      <a
                        href={`/admin/page-builder/${c.id}`}
                        className="px-2.5 py-1 bg-blue-50 text-blue-600 border border-blue-200 rounded-lg text-xs font-medium hover:bg-blue-100 transition-colors"
                      >
                        בנה
                      </a>
                    )}
                    <a
                      href={`/admin/clients/${c.id}`}
                      className="px-2.5 py-1 bg-slate-50 text-slate-600 border border-slate-200 rounded-lg text-xs hover:bg-slate-100 transition-colors"
                    >
                      פתח
                    </a>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

// ─── Main DashboardView ───────────────────────────────────────────────────────
export default function DashboardView({
  session,
  clients,
  recentLeads,
  recentActivities,
  sourceSorted,
  totalSourceLeads,
  pipelineValue = 0,
  pipelineCount = 0,
  wonValue = 0,
  wonCount = 0,
  todayLeads = 0,
  newLeads7d = 0,
  publishedCount = 0,
  userName,
}: Props) {
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "בוקר טוב" : hour < 17 ? "צהריים טובים" : "ערב טוב";

  const displayName =
    userName ??
    (() => {
      const prefix = session?.email?.split("@")[0] ?? "Admin";
      return prefix.charAt(0).toUpperCase() + prefix.slice(1);
    })();

  return (
    <div dir="rtl">
      <div className="max-w-7xl mx-auto space-y-6">

        {/* Welcome Bar */}
        <div className="bg-gradient-to-l from-slate-900 to-blue-900 rounded-2xl p-6 text-white flex justify-between items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold">
              {greeting}, {displayName}!
            </h1>
            <p className="text-blue-200 mt-1 text-sm">
              {todayLeads > 0
                ? `היום הגיעו ${todayLeads} לידים חדשים`
                : "הכל שקט היום — זה זמן טוב לשפר את הדפים"}
            </p>
          </div>
          <Tooltip content="הוסף לקוח חדש למערכת" position="bottom">
            <a
              href="/admin/clients/new"
              className="bg-white/15 hover:bg-white/25 text-white px-4 py-2.5 rounded-xl text-sm font-semibold whitespace-nowrap flex-shrink-0 transition-colors"
            >
              + הוסף לקוח
            </a>
          </Tooltip>
        </div>

        {/* KPI Stats */}
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
          <KPICard
            title="לקוחות פעילים"
            value={clients.length}
            icon={<Users size={20} />}
            iconBg="bg-blue-50"
            iconColor="text-blue-600"
          />
          <KPICard
            title="דפים פורסמו"
            value={publishedCount}
            icon={<Globe size={20} />}
            iconBg="bg-emerald-50"
            iconColor="text-emerald-600"
          />
          <KPICard
            title="לידים היום"
            value={todayLeads}
            icon={<Target size={20} />}
            iconBg="bg-amber-50"
            iconColor="text-amber-600"
          />
          <KPICard
            title="לידים 7 ימים"
            value={newLeads7d}
            icon={<TrendingUp size={20} />}
            iconBg="bg-purple-50"
            iconColor="text-purple-600"
          />
        </div>

        {/* n8n Automation Hub */}
        <N8nDashboard />

        {/* Quick Actions */}
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
          {QUICK_ACTIONS.map(({ icon, label, href, color }) => (
            <a
              key={href}
              href={href}
              className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 flex flex-col items-center gap-2.5 hover:shadow-md hover:-translate-y-0.5 hover:border-slate-200 transition-all duration-200 no-underline"
            >
              <div
                className="w-11 h-11 rounded-xl flex items-center justify-center text-xl"
                style={{ backgroundColor: color + "15" }}
              >
                {icon}
              </div>
              <span className="text-xs font-semibold text-slate-700 text-center">
                {label}
              </span>
            </a>
          ))}
        </div>

        {/* Pipeline Banner */}
        <div className="bg-gradient-to-l from-slate-900 to-blue-900 rounded-2xl p-6 text-white">
          <h3 className="text-sm font-semibold mb-4 text-blue-200">מצב הצינור העסקי</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white/10 rounded-xl p-5 text-center backdrop-blur-sm">
              <p className="text-2xl font-extrabold mb-1">
                ₪{pipelineValue.toLocaleString("he-IL")}
              </p>
              <p className="text-xs text-blue-200">כסף בצינור</p>
              <p className="text-xs text-blue-300/60 mt-1">{pipelineCount} לידים פתוחים</p>
            </div>
            <div className="bg-emerald-500/15 rounded-xl p-5 text-center border border-emerald-400/20">
              <p className="text-2xl font-extrabold mb-1 text-emerald-300">
                ₪{wonValue.toLocaleString("he-IL")}
              </p>
              <p className="text-xs text-blue-200">נסגר החודש</p>
              <p className="text-xs text-blue-300/60 mt-1">{wonCount} עסקאות</p>
            </div>
            <div className="bg-blue-500/15 rounded-xl p-5 text-center border border-blue-400/20">
              <p className="text-2xl font-extrabold mb-1 text-blue-300">
                {wonCount > 0 && pipelineCount > 0
                  ? Math.round((wonCount / (wonCount + pipelineCount)) * 100)
                  : wonCount > 0 ? 100 : 0}%
              </p>
              <p className="text-xs text-blue-200">אחוז המרה</p>
              <p className="text-xs text-blue-300/60 mt-1">החודש</p>
            </div>
          </div>
        </div>

        {/* Clients Table */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
            <h2 className="text-lg font-bold text-slate-900">הלקוחות שלי</h2>
            <Link
              href="/admin/clients/new"
              className="text-sm text-blue-600 hover:text-blue-700 font-medium transition-colors"
            >
              + הוסף לקוח
            </Link>
          </div>
          <ClientsTable clients={clients} />
        </div>

        {/* Bottom row — Sources + Activity */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <div className="space-y-6">
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-100">
                <h2 className="font-semibold text-slate-900">מקורות לידים</h2>
                <p className="text-xs text-slate-500 mt-0.5">החודש הנוכחי</p>
              </div>
              <div className="px-6 py-5 space-y-4">
                {sourceSorted.length === 0 ? (
                  <p className="text-sm text-slate-500 text-center py-6">אין נתונים</p>
                ) : (
                  sourceSorted.map(([src, count]) => {
                    const pct = Math.round((count / (totalSourceLeads || 1)) * 100);
                    return (
                      <div key={src} className="space-y-1.5">
                        <div className="flex justify-between text-sm">
                          <span className="text-slate-700 font-medium">
                            {SOURCE_LABELS[src] ?? src}
                          </span>
                          <span className="text-slate-500">{count} ({pct}%)</span>
                        </div>
                        <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${
                              SOURCE_COLORS[src] ?? "bg-slate-400"
                            }`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {recentActivities.length > 0 && (
              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-100">
                  <h2 className="font-semibold text-slate-900">פעילות אחרונה</h2>
                </div>
                <div className="px-6 py-3 divide-y divide-slate-50">
                  {recentActivities.slice(0, 5).map((activity) => (
                    <div key={activity.id} className="flex items-start gap-3 py-3">
                      <div
                        className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                        style={{ backgroundColor: activity.lead.client.primaryColor }}
                      >
                        {activity.lead.firstName[0]}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-slate-700 leading-snug">
                          <span className="font-medium">
                            {activity.lead.firstName} {activity.lead.lastName}
                          </span>
                          {" — "}
                          {activity.content}
                        </p>
                        <p className="text-xs text-slate-400 mt-0.5">
                          {timeAgo(activity.createdAt)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
