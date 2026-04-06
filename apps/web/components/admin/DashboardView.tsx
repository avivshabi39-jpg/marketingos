"use client";

import { useState } from "react";
import Link from "next/link";
import { Circle } from "lucide-react";
import { useRouter } from "next/navigation";
import { N8nDashboard } from "./N8nDashboard";

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
  NEW: "bg-blue-100 text-blue-700",
  CONTACTED: "bg-yellow-100 text-yellow-700",
  QUALIFIED: "bg-purple-100 text-purple-700",
  PROPOSAL: "bg-orange-100 text-orange-700",
  WON: "bg-green-100 text-green-700",
  LOST: "bg-red-100 text-red-700",
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
  organic: "bg-green-500",
  manual: "bg-gray-400",
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
  { icon: "👤", label: "הוסף לקוח",    href: "/admin/clients/new",  color: "#6366f1" },
  { icon: "🎯", label: "הוסף ליד",     href: "/admin/leads?new=1",  color: "#22c55e" },
  { icon: "✨", label: "בנה דף",       href: "/admin/ai-agent",     color: "#f59e0b" },
  { icon: "📢", label: "שלח שידור",    href: "/admin/broadcast",    color: "#ef4444" },
  { icon: "📊", label: "צור דוח",      href: "/admin/reports",      color: "#8b5cf6" },
  { icon: "🚀", label: "תבנית מהירה", href: "/admin/snapshots",    color: "#06b6d4" },
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
      <div style={{ textAlign: "center", padding: "60px 20px", color: "#6b7280" }}>
        <div style={{ fontSize: "64px", marginBottom: "16px" }}>🚀</div>
        <h3 style={{ fontSize: "20px", fontWeight: 600, marginBottom: "8px", color: "#111827" }}>
          עדיין אין לקוחות
        </h3>
        <p style={{ marginBottom: "24px" }}>
          הוסף לקוח ראשון ובנה לו דף נחיתה תוך דקות
        </p>
        <a
          href="/admin/clients/new"
          style={{
            background: "#6366f1", color: "white",
            padding: "12px 28px", borderRadius: "10px",
            textDecoration: "none", fontWeight: 600, fontSize: "15px",
          }}
        >
          + הוסף לקוח ראשון
        </a>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      {/* Search */}
      <div className="px-4 py-3 border-b border-gray-100">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="🔍 חפש לקוח..."
          className="w-full max-w-xs border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-indigo-400"
          dir="rtl"
        />
      </div>
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr style={{ borderBottom: "1px solid #f3f4f6" }}>
            {["לקוח", "ענף", "דף", "לידים 7י׳", "הצטרף", ""].map((h) => (
              <th
                key={h}
                style={{
                  padding: "10px 16px",
                  textAlign: "right",
                  fontSize: "12px",
                  fontWeight: 600,
                  color: "#6b7280",
                  whiteSpace: "nowrap",
                }}
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
                style={{ cursor: "pointer", borderBottom: "1px solid #f9fafb" }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLTableRowElement).style.background = "#f9fafb";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLTableRowElement).style.background = "";
                }}
              >
                {/* Name */}
                <td style={{ padding: "12px 16px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <div
                      style={{
                        width: "32px", height: "32px",
                        borderRadius: "8px",
                        background: c.primaryColor,
                        color: "white",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: "12px", fontWeight: 700, flexShrink: 0,
                      }}
                    >
                      {c.name[0]}
                    </div>
                    <span style={{ fontWeight: 600, fontSize: "14px", color: "#111827" }}>
                      {c.name}
                    </span>
                  </div>
                </td>
                {/* Industry */}
                <td style={{ padding: "12px 16px", fontSize: "13px", color: "#374151", whiteSpace: "nowrap" }}>
                  {emoji} {label}
                </td>
                {/* Page status */}
                <td style={{ padding: "12px 16px", whiteSpace: "nowrap" }}>
                  {c.pagePublished ? (
                    <span style={{ color: "#16a34a", fontSize: "13px", fontWeight: 500 }}>✅ פורסם</span>
                  ) : (
                    <span style={{ color: "#9ca3af", fontSize: "13px" }}>⚪ טיוטה</span>
                  )}
                </td>
                {/* 7-day leads */}
                <td style={{ padding: "12px 16px", textAlign: "center" }}>
                  <span
                    style={{
                      display: "inline-block",
                      minWidth: "28px",
                      background: c.leads7d > 0 ? "#eff6ff" : "#f9fafb",
                      color: c.leads7d > 0 ? "#2563eb" : "#9ca3af",
                      borderRadius: "20px",
                      padding: "2px 10px",
                      fontSize: "13px",
                      fontWeight: c.leads7d > 0 ? 700 : 400,
                      textAlign: "center",
                    }}
                  >
                    {c.leads7d}
                  </span>
                </td>
                {/* Joined */}
                <td style={{ padding: "12px 16px", fontSize: "12px", color: "#9ca3af", whiteSpace: "nowrap" }}>
                  {joined}
                </td>
                {/* Actions */}
                <td style={{ padding: "12px 16px" }}>
                  <div style={{ display: "flex", gap: "4px", justifyContent: "flex-end" }} onClick={(e) => e.stopPropagation()}>
                    {c.pagePublished ? (
                      <a href={`/${c.slug}`} target="_blank" rel="noopener noreferrer" style={{ padding: "3px 8px", background: "#f0fdf4", color: "#166534", border: "1px solid #bbf7d0", borderRadius: "6px", fontSize: "11px", textDecoration: "none", fontWeight: 500 }}>
                        👁 דף
                      </a>
                    ) : (
                      <a href={`/admin/page-builder/${c.id}`} style={{ padding: "3px 8px", background: "#eef2ff", color: "#6366f1", border: "1px solid #c7d2fe", borderRadius: "6px", fontSize: "11px", textDecoration: "none", fontWeight: 500 }}>
                        🧙 בנה
                      </a>
                    )}
                    <a href={`/admin/clients/${c.id}`} style={{ padding: "3px 8px", background: "#f9fafb", color: "#374151", border: "1px solid #e5e7eb", borderRadius: "6px", fontSize: "11px", textDecoration: "none" }}>
                      פתח ↗
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

  const statsBar = [
    { icon: "👥", label: "לקוחות פעילים", value: clients.length },
    { icon: "🌐", label: "דפים פורסמו",    value: publishedCount },
    { icon: "🎯", label: "לידים היום",      value: todayLeads },
    { icon: "📊", label: "לידים 7 ימים",    value: newLeads7d },
  ];

  return (
    <div className="min-h-screen bg-[#F8FAFC]" dir="rtl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-6">

        {/* Welcome Bar */}
        <div style={{
          background: "linear-gradient(135deg, #1e1b4b 0%, #312e81 100%)",
          borderRadius: "16px", padding: "20px 24px",
          color: "white", display: "flex",
          justifyContent: "space-between", alignItems: "center",
          gap: "12px",
        }}>
          <div>
            <h1 style={{ fontSize: "22px", fontWeight: 700, margin: 0 }}>
              {greeting}, {displayName}! 👋
            </h1>
            <p style={{ opacity: 0.75, margin: "4px 0 0", fontSize: "14px" }}>
              {todayLeads > 0
                ? `🎯 היום הגיעו ${todayLeads} לידים חדשים`
                : "הכל שקט היום — זה זמן טוב לשפר את הדפים"}
            </p>
          </div>
          <a
            href="/admin/clients/new"
            style={{
              background: "rgba(255,255,255,0.2)", color: "white",
              padding: "8px 16px", borderRadius: "8px",
              textDecoration: "none", fontSize: "13px",
              fontWeight: 600, whiteSpace: "nowrap", flexShrink: 0,
            }}
          >
            + הוסף לקוח
          </a>
        </div>

        {/* Stats Bar */}
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
          {statsBar.map(({ icon, label, value }) => (
            <div
              key={label}
              className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5"
            >
              <div style={{ fontSize: "28px", marginBottom: "8px" }}>{icon}</div>
              <p className="text-3xl font-bold text-gray-900 tabular-nums">{value}</p>
              <p className="text-sm text-gray-500 mt-1">{label}</p>
            </div>
          ))}
        </div>

        {/* n8n Automation Hub */}
        <N8nDashboard />

        {/* Quick Actions */}
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
          {QUICK_ACTIONS.map(({ icon, label, href, color }) => (
            <a
              key={href}
              href={href}
              style={{ textDecoration: "none" }}
              className="bg-white rounded-xl border border-gray-100 shadow-sm p-3 flex flex-col items-center gap-2 hover:shadow-md hover:-translate-y-0.5 transition-all duration-150"
            >
              <div
                style={{
                  width: "40px", height: "40px", borderRadius: "10px",
                  background: color + "1a", display: "flex",
                  alignItems: "center", justifyContent: "center",
                  fontSize: "20px",
                }}
              >
                {icon}
              </div>
              <span style={{ fontSize: "11px", fontWeight: 600, color: "#374151", textAlign: "center" }}>
                {label}
              </span>
            </a>
          ))}
        </div>

        {/* Pipeline Banner */}
        <div
          className="rounded-2xl p-6 text-white"
          style={{ background: "linear-gradient(135deg, #1e1b4b 0%, #312e81 100%)" }}
        >
          <h3 className="text-sm font-semibold mb-4 opacity-90">💰 מצב הצינור העסקי</h3>
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-white/10 rounded-xl p-4 text-center">
              <p className="text-2xl font-extrabold mb-1">
                ₪{pipelineValue.toLocaleString("he-IL")}
              </p>
              <p className="text-xs opacity-80">כסף בצינור</p>
              <p className="text-xs opacity-60 mt-1">{pipelineCount} לידים פתוחים</p>
            </div>
            <div
              className="rounded-xl p-4 text-center border border-green-400/30"
              style={{ background: "rgba(34,197,94,0.15)" }}
            >
              <p className="text-2xl font-extrabold mb-1 text-green-300">
                ₪{wonValue.toLocaleString("he-IL")}
              </p>
              <p className="text-xs opacity-80">נסגר החודש</p>
              <p className="text-xs opacity-60 mt-1">{wonCount} עסקאות</p>
            </div>
            <div
              className="rounded-xl p-4 text-center border border-indigo-400/30"
              style={{ background: "rgba(99,102,241,0.15)" }}
            >
              <p className="text-2xl font-extrabold mb-1 text-indigo-300">
                {wonCount > 0 && pipelineCount > 0
                  ? Math.round((wonCount / (wonCount + pipelineCount)) * 100)
                  : wonCount > 0 ? 100 : 0}%
              </p>
              <p className="text-xs opacity-80">אחוז המרה</p>
              <p className="text-xs opacity-60 mt-1">החודש</p>
            </div>
          </div>
        </div>

        {/* Clients Table */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
            <h2 className="text-lg font-bold text-gray-900">הלקוחות שלי</h2>
            <Link
              href="/admin/clients/new"
              className="text-sm text-indigo-600 hover:text-indigo-700 font-medium"
            >
              + הוסף לקוח
            </Link>
          </div>
          <ClientsTable clients={clients} />
        </div>

        {/* Bottom row */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

          {/* Recent Leads — 2 cols */}
          <div className="xl:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h2 className="font-semibold text-gray-900">לידים אחרונים</h2>
              <Link
                href="/admin/leads"
                className="text-xs text-indigo-500 hover:text-indigo-700 font-medium"
              >
                הצג הכל
              </Link>
            </div>
            <div className="divide-y divide-gray-50">
              {recentLeads.length === 0 ? (
                <div className="px-6 py-10 text-center space-y-2">
                  <p className="text-sm text-gray-500">אין לידים עדיין.</p>
                  <Link
                    href="/admin/intake-forms"
                    className="inline-flex items-center gap-1.5 text-xs text-indigo-500 hover:text-indigo-700 font-medium"
                  >
                    שתף את הטופס עם הלקוח שלך ←
                  </Link>
                </div>
              ) : (
                recentLeads.map((lead) => {
                  const srcKey = (() => {
                    const s = lead.source?.toLowerCase() ?? "other";
                    if (s.includes("facebook") || s.includes("fb")) return "facebook";
                    if (s.includes("google")) return "google";
                    if (s === "organic") return "organic";
                    if (s === "manual") return "manual";
                    return "other";
                  })();
                  return (
                    <div
                      key={lead.id}
                      className="flex items-center gap-4 px-6 py-3.5 hover:bg-gray-50/50 transition-colors"
                    >
                      <div
                        className="w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                        style={{ backgroundColor: lead.client.primaryColor }}
                      >
                        {initials(lead.firstName, lead.lastName)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {lead.firstName} {lead.lastName}
                        </p>
                        <p className="text-xs text-gray-500">{lead.phone ?? "—"}</p>
                      </div>
                      <span
                        className={`hidden sm:inline-flex items-center gap-1.5 text-xs px-2 py-1 rounded-full font-medium text-white ${
                          SOURCE_COLORS[srcKey] ?? SOURCE_COLORS.other
                        }`}
                      >
                        <Circle size={5} className="fill-current" />
                        {SOURCE_LABELS[srcKey] ?? lead.source ?? "אחר"}
                      </span>
                      <span
                        className={`text-xs px-2 py-1 rounded-full font-medium ${
                          STATUS_COLORS[lead.status] ?? "bg-gray-100 text-gray-600"
                        }`}
                      >
                        {STATUS_HE[lead.status] ?? lead.status}
                      </span>
                      <span className="hidden md:block text-xs text-gray-400 flex-shrink-0">
                        {new Date(lead.createdAt).toLocaleDateString("he-IL")}
                      </span>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Right column: Sources + Activity */}
          <div className="space-y-6">
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
              <div className="px-6 py-4 border-b border-gray-100">
                <h2 className="font-semibold text-gray-900">מקורות לידים</h2>
                <p className="text-xs text-gray-500 mt-0.5">החודש הנוכחי</p>
              </div>
              <div className="px-6 py-5 space-y-4">
                {sourceSorted.length === 0 ? (
                  <p className="text-sm text-gray-500 text-center py-6">אין נתונים</p>
                ) : (
                  sourceSorted.map(([src, count]) => {
                    const pct = Math.round((count / (totalSourceLeads || 1)) * 100);
                    return (
                      <div key={src} className="space-y-1.5">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-700 font-medium">
                            {SOURCE_LABELS[src] ?? src}
                          </span>
                          <span className="text-gray-500">{count} ({pct}%)</span>
                        </div>
                        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              SOURCE_COLORS[src] ?? "bg-gray-400"
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
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
                <div className="px-6 py-4 border-b border-gray-100">
                  <h2 className="font-semibold text-gray-900">פעילות אחרונה</h2>
                </div>
                <div className="px-6 py-3 divide-y divide-gray-50">
                  {recentActivities.slice(0, 5).map((activity) => (
                    <div key={activity.id} className="flex items-start gap-3 py-3">
                      <div
                        className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                        style={{ backgroundColor: activity.lead.client.primaryColor }}
                      >
                        {activity.lead.firstName[0]}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-gray-700 leading-snug">
                          <span className="font-medium">
                            {activity.lead.firstName} {activity.lead.lastName}
                          </span>
                          {" — "}
                          {activity.content}
                        </p>
                        <p className="text-xs text-gray-400 mt-0.5">
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
