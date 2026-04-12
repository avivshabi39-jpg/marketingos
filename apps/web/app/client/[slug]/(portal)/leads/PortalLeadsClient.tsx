"use client";

import { useState } from "react";
import { Phone, MessageCircle, Search, Filter, Clock } from "lucide-react";
import { EmptyState } from "@/components/ui/EmptyState";
import { Tooltip } from "@/components/ui/Tooltip";
import { classifyLeadHeat, HEAT_CONFIG } from "@/lib/leadHeat";
import toast from "react-hot-toast";

// Time-ago helper (Hebrew)
function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "עכשיו";
  if (mins < 60) return `לפני ${mins} דק׳`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `לפני ${hrs} שעות`;
  const days = Math.floor(hrs / 24);
  if (days === 1) return "אתמול";
  if (days < 7) return `לפני ${days} ימים`;
  return new Date(dateStr).toLocaleDateString("he-IL");
}

const SOURCE_LABELS: Record<string, string> = {
  facebook: "פייסבוק",
  google: "גוגל",
  organic: "אורגני",
  manual: "ידני",
  landing_page: "דף נחיתה",
  ai_agent: "סוכן AI",
};

interface Lead {
  id: string;
  firstName: string;
  lastName: string;
  phone: string | null;
  email: string | null;
  source: string | null;
  status: string;
  value: number | null;
  leadScore: number;
  gender: string | null;
  ageRange: string | null;
  city: string | null;
  autoReplied: boolean;
  createdAt: string;
}

interface Props {
  leads: Lead[];
  stats: { total: number; new: number; contacted: number; won: number };
  clientId: string;
  autoReplyActive: boolean;
}

const STATUS_LABELS: Record<string, string> = {
  NEW: "חדש",
  CONTACTED: "נוצר קשר",
  QUALIFIED: "מתאים",
  PROPOSAL: "הצעה",
  WON: "נסגר",
  LOST: "לא רלוונטי",
};

const STATUS_COLORS: Record<string, string> = {
  NEW: "bg-blue-100 text-blue-700",
  CONTACTED: "bg-yellow-100 text-yellow-700",
  QUALIFIED: "bg-purple-100 text-purple-700",
  PROPOSAL: "bg-orange-100 text-orange-700",
  WON: "bg-green-100 text-green-700",
  LOST: "bg-red-100 text-red-700",
};

export function PortalLeadsClient({ leads: initialLeads, stats, clientId, autoReplyActive: initialAutoReply }: Props) {
  const [leads, setLeads] = useState(initialLeads);
  const [filter, setFilter] = useState("ALL");
  const [search, setSearch] = useState("");
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [autoReply, setAutoReply] = useState(initialAutoReply);

  const filtered = leads.filter((lead) => {
    if (filter !== "ALL" && lead.status !== filter) return false;
    if (search) {
      const q = search.toLowerCase();
      const name = `${lead.firstName} ${lead.lastName}`.toLowerCase();
      return name.includes(q) || lead.phone?.includes(q) || lead.city?.toLowerCase().includes(q);
    }
    return true;
  });

  async function updateStatus(leadId: string, status: string) {
    setUpdatingId(leadId);
    try {
      const res = await fetch(`/api/leads/${leadId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (res.ok) {
        setLeads((prev) => prev.map((l) => (l.id === leadId ? { ...l, status } : l)));
        toast.success("סטטוס עודכן");
      } else {
        toast.error("שגיאה בעדכון סטטוס");
      }
    } catch { toast.error("שגיאה בעדכון"); }
    setUpdatingId(null);
  }

  function openWhatsApp(lead: Lead) {
    if (!lead.phone) return;
    const phone = lead.phone.replace(/[^0-9]/g, "").replace(/^0/, "");
    const msg = encodeURIComponent(`שלום ${lead.firstName}! ראיתי שהשארת פרטים. אשמח לעזור 😊`);
    window.open(`https://wa.me/972${phone}?text=${msg}`, "_blank");
    if (lead.status === "NEW") updateStatus(lead.id, "CONTACTED");
  }

  async function toggleAutoReply() {
    const newVal = !autoReply;
    setAutoReply(newVal);
    await fetch(`/api/clients/${clientId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ autoReplyActive: newVal }),
    }).catch(() => setAutoReply(!newVal));
  }

  return (
    <div className="space-y-5" dir="rtl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">🎯 הלידים שלי</h1>
        <p className="text-slate-500 text-sm mt-0.5">{stats.total} לידים בסה"כ</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'סה"כ', value: stats.total, color: "text-blue-600", bg: "bg-blue-50" },
          { label: "חדשים", value: stats.new, color: "text-blue-600", bg: "bg-blue-50" },
          { label: "נוצר קשר", value: stats.contacted, color: "text-yellow-600", bg: "bg-yellow-50" },
          { label: "נסגרו", value: stats.won, color: "text-green-600", bg: "bg-green-50" },
        ].map((s) => (
          <div key={s.label} className={`${s.bg} rounded-xl p-3 text-center`}>
            <p className={`text-xl font-bold ${s.color}`}>{s.value}</p>
            <p className="text-xs text-slate-500">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Auto-reply toggle */}
      <div className={`flex items-center justify-between rounded-xl border p-4 ${autoReply ? "bg-green-50 border-green-200" : "bg-white border-slate-200"}`}>
        <div>
          <p className="font-semibold text-sm text-slate-900">📱 חזרה אוטומטית ללידים</p>
          <p className="text-xs text-slate-500">
            {autoReply ? "וואצאפ יוצא אוטומטית לכל ליד חדש" : "כבוי — תחזור ללידים באופן ידני"}
          </p>
        </div>
        <Tooltip content={autoReply ? "כבה תגובה אוטומטית" : "הפעל תגובה אוטומטית"} position="top">
        <button
          onClick={toggleAutoReply}
          className={`relative w-12 h-6 rounded-full transition-colors ${autoReply ? "bg-green-500" : "bg-slate-300"}`}
        >
          <div
            className="absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all"
            style={{ right: autoReply ? "2px" : "26px" }}
          />
        </button>
        </Tooltip>
      </div>

      {/* Search + Filter */}
      <div className="flex gap-2">
        <div className="flex-1 relative">
          <Search size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="חפש לפי שם, טלפון או עיר..."
            className="w-full pr-10 pl-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-200 focus:border-blue-400 outline-none"
          />
        </div>
        <div className="relative">
          <Filter size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="pr-10 pl-4 py-2.5 border border-slate-200 rounded-xl text-sm bg-white appearance-none focus:ring-2 focus:ring-blue-200 focus:border-blue-400 outline-none"
          >
            <option value="ALL">הכל</option>
            <option value="NEW">חדשים</option>
            <option value="CONTACTED">נוצר קשר</option>
            <option value="QUALIFIED">מתאימים</option>
            <option value="PROPOSAL">הצעה</option>
            <option value="WON">נסגרו</option>
            <option value="LOST">אבודים</option>
          </select>
        </div>
      </div>

      {/* Leads */}
      {filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-100">
          <EmptyState
            icon="🎯"
            title={filter !== "ALL" ? "אין לידים בקטגוריה זו" : "אין לידים עדיין"}
            subtitle="שתף את דף הנחיתה או חבר פייסבוק כדי להתחיל לקבל לידים אוטומטית"
            actionLabel="שתף את הדף שלך"
            actionHref={`/client/${clientId}/settings`}
          />
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((lead) => {
            const isNew = lead.status === "NEW";
            const isUrgent = isNew && (Date.now() - new Date(lead.createdAt).getTime()) < 24 * 3600000;
            const srcLabel = SOURCE_LABELS[(lead.source ?? "").toLowerCase()] ?? lead.source;
            const heat = classifyLeadHeat(lead);
            const heatStyle = HEAT_CONFIG[heat];

            return (
            <div
              key={lead.id}
              className={`bg-white rounded-xl shadow-sm p-4 transition-colors ${
                isUrgent
                  ? "border-2 border-blue-300 bg-blue-50/30"
                  : isNew
                  ? "border-2 border-blue-200"
                  : "border border-slate-100"
              }`}
            >
              {/* Row 1: Name + Status + Time */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg flex-shrink-0 ${isNew ? "bg-blue-100" : "bg-slate-50"}`}>
                    {lead.gender === "male" ? "👨" : lead.gender === "female" ? "👩" : "👤"}
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900 text-sm">
                      {lead.firstName} {lead.lastName}
                    </p>
                    <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5 flex-wrap">
                      <span className="inline-flex items-center gap-1">
                        <Clock size={10} />
                        {timeAgo(lead.createdAt)}
                      </span>
                      {srcLabel && (
                        <span className="bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded text-[10px]">
                          {srcLabel}
                        </span>
                      )}
                      {lead.city && <span>{lead.city}</span>}
                      {lead.autoReplied && (
                        <span className="text-green-600 font-medium">✓ וואצאפ נשלח</span>
                      )}
                      {!lead.autoReplied && isNew && lead.phone && (
                        <span className="text-amber-600 font-medium">⏳ ממתין למענה</span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  {isUrgent && (
                    <span className="text-[10px] font-bold text-blue-700 bg-blue-100 px-2 py-0.5 rounded-full animate-pulse">
                      חדש!
                    </span>
                  )}
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${heatStyle.badge}`}>
                    {heatStyle.emoji} {heatStyle.label}
                  </span>
                  <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${STATUS_COLORS[lead.status] ?? "bg-slate-100 text-slate-600"}`}>
                    {STATUS_LABELS[lead.status] ?? lead.status}
                  </span>
                </div>
              </div>

              {/* Row 2: Actions */}
              <div className="flex items-center gap-2 flex-wrap">
                {lead.phone && (
                  <>
                    <a
                      href={`tel:${lead.phone}`}
                      className="inline-flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors"
                    >
                      <Phone size={12} />
                      {lead.phone}
                    </a>
                    <Tooltip content="שלח WhatsApp ללקוח" position="top">
                    <button
                      onClick={() => openWhatsApp(lead)}
                      className="inline-flex items-center gap-1.5 bg-green-100 hover:bg-green-200 text-green-700 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors"
                    >
                      <MessageCircle size={12} />
                      וואצאפ
                    </button>
                    </Tooltip>
                  </>
                )}
                {lead.email && (
                  <a
                    href={`mailto:${lead.email}`}
                    className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-blue-600"
                  >
                    📧 {lead.email}
                  </a>
                )}
                {lead.value != null && lead.value > 0 && (
                  <span className="text-xs font-semibold text-amber-700 bg-amber-50 rounded-lg px-2.5 py-1">
                    ₪{lead.value.toLocaleString("he-IL")}
                  </span>
                )}
              </div>

              {/* Row 3: Status buttons */}
              <div className="flex gap-1.5 mt-3 pt-3 border-t border-slate-50">
                {(["CONTACTED", "QUALIFIED", "PROPOSAL", "WON", "LOST"] as const).map((s) => (
                  <button
                    key={s}
                    onClick={() => updateStatus(lead.id, s)}
                    disabled={lead.status === s || updatingId === lead.id}
                    className={`px-2.5 py-1 rounded-md text-[11px] font-medium border transition-colors ${
                      lead.status === s
                        ? "bg-slate-100 text-slate-400 border-slate-100 cursor-default"
                        : s === "WON"
                        ? "bg-white text-green-600 border-green-200 hover:bg-green-50 cursor-pointer"
                        : s === "LOST"
                        ? "bg-white text-red-500 border-red-200 hover:bg-red-50 cursor-pointer"
                        : "bg-white text-slate-600 border-slate-200 hover:border-blue-300 hover:text-blue-600 cursor-pointer"
                    }`}
                  >
                    {STATUS_LABELS[s]}
                  </button>
                ))}
              </div>
            </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
