import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { Button } from "@/components/ui/Button";
import { LeadsView } from "@/components/admin/LeadsView";
import { HelpButton } from "@/components/HelpButton";
import { Plus, Filter, Download } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "לידים | MarketingOS",
  description: "ניהול ומעקב אחר לידים",
};

const VALID_STATUSES = ["NEW", "CONTACTED", "QUALIFIED", "PROPOSAL", "WON", "LOST"] as const;
type LeadStatus = (typeof VALID_STATUSES)[number];

export default async function LeadsPage({
  searchParams,
}: {
  searchParams: { status?: string; clientId?: string; source?: string };
}) {
  const session = await getSession();
  const superAdmin = session?.role === "SUPER_ADMIN";

  const status = VALID_STATUSES.includes(searchParams.status as LeadStatus)
    ? (searchParams.status as LeadStatus)
    : undefined;

  // Multi-tenant: build the clientId scope for this user
  const clientScope = session?.clientId
    ? [session.clientId]
    : superAdmin
    ? null // no restriction for super-admin
    : await prisma.client
        .findMany({ where: { ownerId: session?.userId }, select: { id: true } })
        .then((cs) => cs.map((c) => c.id));

  const where = {
    ...(clientScope ? { clientId: { in: clientScope } } : {}),
    ...(searchParams.clientId ? { clientId: searchParams.clientId } : {}),
    ...(status ? { status } : {}),
    ...(searchParams.source ? { source: searchParams.source } : {}),
  };

  const [leads, total, clients] = await Promise.all([
    prisma.lead.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: 200,
      include: { client: { select: { id: true, name: true, primaryColor: true } } },
    }),
    prisma.lead.count({ where }),
    session?.clientId
      ? Promise.resolve([] as { id: string; name: string }[])
      : prisma.client.findMany({
          where: superAdmin ? undefined : { ownerId: session?.userId },
          select: { id: true, name: true },
          orderBy: { name: "asc" },
        }),
  ]);

  const STATUS_HE: Record<string, string> = {
    NEW: "חדש", CONTACTED: "נוצר קשר", QUALIFIED: "מוסמך",
    PROPOSAL: "הצעה", WON: "נסגר", LOST: "אבוד",
  };

  return (
    <div className="space-y-6" dir="rtl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-semibold text-gray-900">🎯 לידים חדשים</h1>
            <HelpButton page="leads" />
          </div>
          <p className="text-sm text-gray-500 mt-0.5">{total} לידים בסה"כ</p>
        </div>
        <div className="flex items-center gap-2">
          <a
            href="/api/leads/export?format=xlsx"
            download
            className="flex items-center gap-2 px-3 py-2 rounded-lg border border-green-200 bg-white text-sm font-medium text-green-700 hover:bg-green-50 transition-colors shadow-sm"
          >
            <Download size={15} className="text-green-600" />
            ייצוא Excel
          </a>
          <Link href="/admin/leads/new">
            <Button className="flex items-center gap-2">
              <Plus size={16} />
              צור ליד
            </Button>
          </Link>
        </div>
      </div>

      {/* Filters */}
      <form className="flex flex-wrap gap-3 items-center bg-white border border-gray-100 rounded-xl p-4 shadow-sm">
        <Filter size={16} className="text-gray-400 flex-shrink-0" />

        {!session?.clientId && (
          <select
            name="clientId"
            defaultValue={searchParams.clientId ?? ""}
            className="rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-400 bg-white"
          >
            <option value="">כל הלקוחות</option>
            {clients.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        )}

        <select
          name="status"
          defaultValue={searchParams.status ?? ""}
          className="rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-400 bg-white"
        >
          <option value="">כל הסטטוסים</option>
          {VALID_STATUSES.map((s) => (
            <option key={s} value={s}>{STATUS_HE[s]}</option>
          ))}
        </select>

        <select
          name="source"
          defaultValue={searchParams.source ?? ""}
          className="rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-400 bg-white"
        >
          <option value="">כל המקורות</option>
          {["facebook", "google", "organic", "manual", "other"].map((s) => (
            <option key={s} value={s}>
              {s === "facebook" ? "פייסבוק" : s === "google" ? "גוגל" : s === "organic" ? "אורגני" : s === "manual" ? "ידני" : "אחר"}
            </option>
          ))}
        </select>

        <button
          type="submit"
          className="px-4 py-2 rounded-lg bg-indigo-500 text-white text-sm font-medium hover:bg-indigo-600 transition-colors"
        >
          סנן
        </button>

        {(searchParams.status || searchParams.clientId || searchParams.source) && (
          <a href="/admin/leads" className="text-sm text-gray-400 hover:text-gray-600">
            נקה
          </a>
        )}
      </form>

      {/* View (Kanban / List) */}
      <LeadsView
        leads={leads}
        clients={clients}
        clientId={session?.clientId ?? undefined}
      />
    </div>
  );
}
