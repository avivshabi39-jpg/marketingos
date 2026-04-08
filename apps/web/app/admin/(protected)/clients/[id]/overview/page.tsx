import { getSession, isSuperAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";

const INDUSTRY_EMOJI: Record<string, string> = { CLEANING: "🧹", REAL_ESTATE: "🏠", COSMETICS: "💄", FITNESS: "💪", LEGAL: "⚖️", FOOD: "🍽️", FINANCE: "📊", CONSTRUCTION: "🔨", GENERAL: "🏢", ROOFING: "🏗️" };
const STATUS_LABEL: Record<string, string> = { NEW: "חדש", CONTACTED: "נוצר קשר", QUALIFIED: "מתאים", PROPOSAL: "הצעה", WON: "סגור", LOST: "לא רלוונטי" };
const STATUS_COLOR: Record<string, string> = { NEW: "#dbeafe", CONTACTED: "#fef9c3", QUALIFIED: "#e9d5ff", PROPOSAL: "#ffedd5", WON: "#d1fae5", LOST: "#fee2e2" };

export default async function ClientOverviewPage({ params }: { params: { id: string } }) {
  const session = await getSession();
  if (!session) redirect("/admin/login");

  const client = await prisma.client.findUnique({
    where: { id: params.id },
    include: {
      leads: { orderBy: { createdAt: "desc" }, take: 50, select: { id: true, firstName: true, lastName: true, phone: true, status: true, source: true, createdAt: true, value: true, city: true, gender: true } },
      appointments: { orderBy: { scheduledAt: "desc" }, take: 5, select: { id: true, name: true, scheduledAt: true, status: true } },
      _count: { select: { leads: true, appointments: true, socialPosts: true, reports: true, campaignImages: true, broadcastLogs: true } },
    },
  });

  if (!client) redirect("/admin/clients");
  if (!isSuperAdmin(session) && client.ownerId !== session.userId) redirect("/admin/clients");

  const total = client._count.leads;
  const newL = client.leads.filter((l) => l.status === "NEW").length;
  const contacted = client.leads.filter((l) => l.status === "CONTACTED").length;
  const won = client.leads.filter((l) => l.status === "WON").length;
  const lost = client.leads.filter((l) => l.status === "LOST").length;
  const conv = total > 0 ? Math.round((won / total) * 100) : 0;
  const pipeline = client.leads.filter((l) => !["LOST", "WON"].includes(l.status)).reduce((s, l) => s + (l.value ?? 0), 0);
  const storageKB = 20 + client._count.leads * 2 + client._count.appointments + client._count.socialPosts * 3 + client._count.reports * 10 + client._count.campaignImages * 5 + client._count.broadcastLogs;
  const revenue = client.plan === "AGENCY" ? 425 : client.plan === "PRO" ? 375 : 0;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "";

  return (
    <div className="max-w-6xl space-y-5" dir="rtl">
      {/* Breadcrumb */}
      <div className="text-xs text-slate-500">
        <Link href="/admin/dashboard" className="hover:text-blue-600">🏠 ראשי</Link> → <Link href="/admin/clients" className="hover:text-blue-600">לקוחות</Link> → <span className="text-slate-900 font-semibold">{client.name}</span>
      </div>

      {/* Header */}
      <div className="bg-gradient-to-l from-slate-800 to-slate-900 rounded-2xl p-5 text-white flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center text-2xl">{INDUSTRY_EMOJI[client.industry ?? ""] ?? "🏢"}</div>
          <div>
            <h1 className="text-xl font-extrabold">{client.name}</h1>
            <p className="text-xs text-slate-300">{client.phone ?? ""} {client.email ? `• ${client.email}` : ""}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Link href={`/admin/page-builder/${client.id}`} className="px-4 py-2 bg-white/15 rounded-lg text-xs font-semibold border border-white/20">🧙 בנה דף</Link>
          {client.pagePublished && <a href={`/${client.slug}`} target="_blank" rel="noopener noreferrer" className="px-4 py-2 bg-white/10 rounded-lg text-xs">👁 צפה</a>}
          <Link href={`/admin/clients/${client.id}`} className="px-4 py-2 bg-blue-600 rounded-lg text-xs font-semibold">⚙️ הגדרות</Link>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-6 gap-3">
        {[
          { label: 'סה"כ לידים', value: total, icon: "🎯", color: "#6366f1" },
          { label: "חדשים", value: newL, icon: "🔵", color: "#3b82f6" },
          { label: "נוצר קשר", value: contacted, icon: "🟡", color: "#f59e0b" },
          { label: "עסקאות", value: won, icon: "✅", color: "#22c55e" },
          { label: "המרה", value: `${conv}%`, icon: "📈", color: "#8b5cf6" },
          { label: "אחסון", value: storageKB < 1024 ? `${storageKB}KB` : `${(storageKB / 1024).toFixed(1)}MB`, icon: "💾", color: "#ec4899" },
        ].map((s) => (
          <div key={s.label} className="bg-white rounded-2xl border border-slate-100 p-4 text-center shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
            <div className="text-lg">{s.icon}</div>
            <div className="text-xl font-extrabold" style={{ color: s.color }}>{s.value}</div>
            <div className="text-[11px] text-slate-500">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Status breakdown */}
      <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
        <p className="font-bold text-sm mb-3">📊 פילוח לידים</p>
        <div className="flex gap-2">
          {[
            { l: "חדש", c: newL, bg: "#3b82f6" },
            { l: "נוצר קשר", c: contacted, bg: "#f59e0b" },
            { l: "מתאים", c: client.leads.filter((x) => x.status === "QUALIFIED").length, bg: "#8b5cf6" },
            { l: "סגור", c: won, bg: "#22c55e" },
            { l: "אבוד", c: lost, bg: "#ef4444" },
          ].map((s) => (
            <div key={s.l} className="flex-1 rounded-lg p-2.5 text-center" style={{ background: s.bg + "15", border: `1px solid ${s.bg}30` }}>
              <div className="text-lg font-extrabold" style={{ color: s.bg }}>{s.c}</div>
              <div className="text-[10px] text-slate-500">{s.l}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-5 gap-4">
        {/* Leads list */}
        <div className="col-span-3 bg-white rounded-2xl border border-slate-100 flex flex-col shadow-[0_1px_3px_rgba(0,0,0,0.06)]" style={{ maxHeight: "520px" }}>
          <div className="px-4 py-3 border-b border-slate-100 flex justify-between items-center flex-shrink-0">
            <span className="font-bold text-sm">🎯 לידים ({total})</span>
            <Link href={`/admin/leads?clientId=${client.id}`} className="text-xs text-blue-600">נהל →</Link>
          </div>
          <div className="overflow-y-auto flex-1">
            {client.leads.length === 0 ? (
              <div className="p-10 text-center text-slate-400 text-sm">אין לידים עדיין</div>
            ) : client.leads.map((lead) => (
              <div key={lead.id} className="px-4 py-2.5 border-b border-slate-50 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center text-sm">{lead.gender === "male" ? "👨" : lead.gender === "female" ? "👩" : "👤"}</div>
                  <div>
                    <p className="text-sm font-semibold">{lead.firstName} {lead.lastName}</p>
                    <p className="text-[10px] text-slate-400">{lead.phone}{lead.city ? ` • ${lead.city}` : ""} • {new Date(lead.createdAt).toLocaleDateString("he-IL")}</p>
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full" style={{ background: STATUS_COLOR[lead.status] ?? "#f3f4f6" }}>{STATUS_LABEL[lead.status] ?? lead.status}</span>
                  {lead.phone && <a href={`https://wa.me/972${lead.phone.replace(/[^0-9]/g, "")}`} target="_blank" rel="noopener noreferrer" className="text-xs bg-green-50 rounded px-1.5 py-1">💬</a>}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right column */}
        <div className="col-span-2 space-y-4">
          {/* Page status */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-[0_1px_3px_rgba(0,0,0,0.06)] p-4">
            <p className="font-bold text-sm mb-2">🌐 דף נחיתה</p>
            <span className={`text-xs font-bold px-3 py-1.5 rounded-full ${client.pagePublished ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"}`}>
              {client.pagePublished ? "✅ פורסם" : "⚠️ לא פורסם"}
            </span>
            {client.pagePublished && <p className="text-[11px] text-slate-400 mt-2 font-mono">{appUrl}/{client.slug}</p>}
            {!client.pagePublished && <Link href={`/admin/page-builder/${client.id}`} className="block mt-3 text-center py-2.5 bg-blue-600 text-white rounded-lg text-xs font-bold">🧙 בנה דף</Link>}
          </div>

          {/* Quick actions */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-[0_1px_3px_rgba(0,0,0,0.06)] p-4">
            <p className="font-bold text-sm mb-2">⚡ פעולות</p>
            <div className="space-y-1.5">
              {[
                { l: "🧙 בנה/ערוך דף", h: `/admin/page-builder/${client.id}` },
                { l: "📢 שלח שידור", h: "/admin/broadcast" },
                { l: "📱 פוסט שיווקי", h: "/admin/social-posts" },
                { l: "🤖 סוכן AI", h: "/admin/ai-agent" },
                { l: "⚙️ הגדרות", h: `/admin/clients/${client.id}` },
              ].map((a) => (
                <Link key={a.l} href={a.h} className="block px-3 py-2 bg-slate-50 border border-slate-100 rounded-lg text-xs text-slate-700 font-medium hover:border-blue-200 hover:text-blue-600 transition-colors">{a.l}</Link>
              ))}
            </div>
          </div>

          {/* Revenue */}
          <div className={`rounded-xl p-4 ${revenue > 0 ? "bg-green-50 border border-green-200" : "bg-slate-50 border border-slate-200"}`}>
            <p className="font-bold text-sm mb-2">💰 חיוב</p>
            <div className="flex justify-between text-sm mb-1">
              <span className="text-slate-500">תוכנית:</span>
              <span className="font-bold">{client.plan === "AGENCY" ? '🏢 נדל"ן Pro' : client.plan === "PRO" ? "⭐ Pro" : "🆓 חינם"}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">הכנסה:</span>
              <span className="font-extrabold text-green-700">₪{revenue}/חודש</span>
            </div>
            {pipeline > 0 && (
              <div className="flex justify-between text-sm mt-1">
                <span className="text-slate-500">פייפליין:</span>
                <span className="font-bold text-blue-600">₪{pipeline.toLocaleString()}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
