import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getSession, isSuperAdmin } from "@/lib/auth";
import { Button } from "@/components/ui/Button";
import { HelpButton } from "@/components/HelpButton";
import { Plus, Users, FileText, GitBranch, ArrowLeft } from "lucide-react";
import type { Metadata } from "next";
import { EmptyState } from "@/components/ui/EmptyState";

export const metadata: Metadata = {
  title: "לקוחות | MarketingOS",
  description: "ניהול לקוחות ועסקים במערכת",
};

const INDUSTRY_HE: Record<string, string> = {
  ROOFING:      "גגות",
  ALUMINUM:     "אלומיניום",
  COSMETICS:    "קוסמטיקה",
  CLEANING:     "ניקיון",
  REAL_ESTATE:  "נדל\"ן",
  OTHER:        "אחר",
  AVIATION:     "תעופה",
  TOURISM:      "תיירות",
  FINANCE:      "פיננסים",
  LEGAL:        "משפטי",
  MEDICAL:      "רפואה",
  FOOD:         "מזון ומסעדנות",
  FITNESS:      "כושר ובריאות",
  EDUCATION:    "חינוך",
  GENERAL:      "כללי",
};

const PLAN_COLORS: Record<string, string> = {
  BASIC:  "bg-gray-100 text-gray-600",
  PRO:    "bg-indigo-100 text-indigo-700",
  AGENCY: "bg-amber-100 text-amber-700",
};

const PLAN_HE: Record<string, string> = {
  BASIC:  "בסיסי",
  PRO:    "פרו",
  AGENCY: "סוכנות",
};

function initials(name: string) {
  return name
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
}

export default async function ClientsPage() {
  const session = await getSession();
  const clientWhere = isSuperAdmin(session!)
    ? {}
    : { ownerId: session?.userId };

  const clients = await prisma.client.findMany({
    where: clientWhere,
    orderBy: { createdAt: "desc" },
    include: {
      _count: { select: { leads: true, landingPages: true, workflows: true } },
    },
  });

  const now = new Date();
  const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const clientStats = await Promise.all(
    clients.map(async (client) => {
      const [leadsThisWeek, totalLeads, wonLeads, recentReport] = await Promise.all([
        prisma.lead.count({ where: { clientId: client.id, createdAt: { gte: oneWeekAgo } } }),
        prisma.lead.count({ where: { clientId: client.id } }),
        prisma.lead.count({ where: { clientId: client.id, status: "WON" } }),
        prisma.report.findFirst({ where: { clientId: client.id, createdAt: { gte: startOfMonth } } }),
      ]);

      let score = 0;
      if (leadsThisWeek > 0) score += 20;
      if (totalLeads > 0 && wonLeads / totalLeads > 0.2) score += 20;
      if (client.n8nWebhookUrl) score += 20;
      if (recentReport) score += 20;
      if (client.landingPageActive) score += 20;

      return { clientId: client.id, score };
    })
  );

  const healthMap = Object.fromEntries(clientStats.map((s) => [s.clientId, s.score]));

  return (
    <div className="space-y-6" dir="rtl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-semibold text-gray-900">👥 הלקוחות שלי</h1>
            <HelpButton page="clients" />
          </div>
          <p className="text-sm text-gray-500 mt-0.5">{clients.length} לקוחות בסה"כ</p>
        </div>
        <Link href="/admin/clients/new">
          <Button className="flex items-center gap-2">
            <Plus size={16} />
            לקוח חדש
          </Button>
        </Link>
      </div>

      {/* Cards grid */}
      {clients.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
          <EmptyState
            icon="🏢"
            title="אין לקוחות עדיין"
            subtitle="הוסף את הלקוח הראשון שלך ותתחיל לנהל את השיווק שלו"
            actionLabel="הוסף לקוח"
            actionHref="/admin/clients/new"
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {clients.map((client) => (
            <div
              key={client.id}
              className="bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="p-5">
                {/* Top row */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    {/* Initials circle */}
                    <div
                      className="w-11 h-11 rounded-xl flex items-center justify-center text-white font-bold text-sm flex-shrink-0"
                      style={{ backgroundColor: client.primaryColor }}
                    >
                      {initials(client.name)}
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 text-sm leading-tight">
                        {client.name}
                      </h3>
                      <p className="text-xs text-gray-400 mt-0.5">{client.slug}</p>
                    </div>
                  </div>
                  {/* Status dot */}
                  <span
                    className={`text-xs px-2 py-1 rounded-full font-medium ${
                      client.isActive
                        ? "bg-green-100 text-green-700"
                        : "bg-gray-100 text-gray-500"
                    }`}
                  >
                    {client.isActive ? "פעיל" : "לא פעיל"}
                  </span>
                </div>

                {/* Badges row */}
                <div className="flex flex-wrap gap-2 mb-4">
                  {client.industry && (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 font-medium">
                      {INDUSTRY_HE[client.industry] ?? client.industry}
                    </span>
                  )}
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      PLAN_COLORS[client.plan] ?? PLAN_COLORS.BASIC
                    }`}
                  >
                    {PLAN_HE[client.plan] ?? client.plan}
                  </span>
                </div>

                {/* Stats row */}
                <div className="grid grid-cols-3 gap-2 mb-4">
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-1 text-gray-500 mb-0.5">
                      <Users size={13} />
                    </div>
                    <p className="text-sm font-bold text-gray-900">{client._count.leads}</p>
                    <p className="text-xs text-gray-400">לידים</p>
                  </div>
                  <div className="text-center border-x border-gray-100">
                    <div className="flex items-center justify-center gap-1 text-gray-500 mb-0.5">
                      <FileText size={13} />
                    </div>
                    <p className="text-sm font-bold text-gray-900">{client._count.landingPages}</p>
                    <p className="text-xs text-gray-400">דפים</p>
                  </div>
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-1 text-gray-500 mb-0.5">
                      <GitBranch size={13} />
                    </div>
                    <p className="text-sm font-bold text-gray-900">{client._count.workflows}</p>
                    <p className="text-xs text-gray-400">אוטומציות</p>
                  </div>
                </div>

                {/* Footer */}
                <div className="pt-3 border-t border-gray-50">
                  <p className="text-xs text-gray-400 mb-2">{client.email}</p>
                  <div className="flex items-center justify-between">
                    <Link
                      href={`/admin/clients/${client.id}`}
                      className="flex items-center gap-1.5 text-sm text-indigo-500 hover:text-indigo-700 font-medium"
                    >
                      צפה בפרטים
                      <ArrowLeft size={14} />
                    </Link>
                    {/* Health score */}
                    {(() => {
                      const score = healthMap[client.id] ?? 0;
                      const scoreColor =
                        score >= 80
                          ? "bg-green-500"
                          : score >= 50
                          ? "bg-yellow-400"
                          : "bg-red-500";
                      return (
                        <div className="flex items-center gap-1.5">
                          <div
                            className={`w-3 h-3 rounded-full ${scoreColor}`}
                            title={`ציון בריאות: ${score}/100`}
                          />
                          <span className="text-xs text-gray-500">{score}</span>
                        </div>
                      );
                    })()}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
