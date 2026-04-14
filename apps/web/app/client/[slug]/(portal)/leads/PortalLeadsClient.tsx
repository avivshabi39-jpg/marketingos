"use client";

import { useState } from "react";
import { Phone, MessageCircle, Search, Filter, Clock } from "lucide-react";
import { EmptyState } from "@/components/ui/EmptyState";
import { Tooltip } from "@/components/ui/Tooltip";
import { classifyLeadHeat, HEAT_CONFIG } from "@/lib/leadHeat";
import { getLeadSla, SLA_CONFIG } from "@/lib/leadSla";
import { getSourceLabel } from "@/lib/leadSource";
import { getLeadPriority, PRIORITY_STYLES } from "@/lib/conversionPriority";
import { getCloseInsight, getProbStyle } from "@/lib/closeProbability";
import { getConversionAssistant } from "@/lib/conversionAssistant";
import toast from "react-hot-toast";

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
  metadata: Record<string, unknown> | null;
}

interface Props {
  leads: Lead[];
  stats: { total: number; new: number; contacted: number; won: number };
  clientId: string;
  clientName: string;
  autoReplyActive: boolean;
}

// Centralized quick-message template — easy to change or replace with AI later
function buildQuickWhatsAppMessage(leadName: string, businessName: string): string {
  return `שלום ${leadName}! 👋
ראיתי שפנית אלינו ב${businessName}.
מתי נוח לדבר? נשמח לעזור 😊`;
}

// Normalize Israeli phone numbers to international format
function normalizePhoneForWa(phone: string): string {
  const digits = phone.replace(/[^0-9+]/g, "");
  if (digits.startsWith("+972")) return digits.slice(1); // remove +
  if (digits.startsWith("972")) return digits;
  if (digits.startsWith("0")) return "972" + digits.slice(1);
  return "972" + digits;
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

const LOST_REASONS = [
  { key: "expensive", label: "מחיר גבוה" },
  { key: "unavailable", label: "לא זמין" },
  { key: "irrelevant", label: "לא רלוונטי" },
  { key: "other", label: "אחר" },
] as const;

export function PortalLeadsClient({ leads: initialLeads, stats, clientId, clientName, autoReplyActive: initialAutoReply }: Props) {
  const [leads, setLeads] = useState(initialLeads);
  const [filter, setFilter] = useState("ALL");
  const [search, setSearch] = useState("");
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [lostPickerLeadId, setLostPickerLeadId] = useState<string | null>(null);
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

  async function markAsLost(leadId: string, reason: string) {
    setLostPickerLeadId(null);
    setUpdatingId(leadId);
    try {
      const res = await fetch(`/api/leads/${leadId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "LOST", lostReason: reason }),
      });
      if (res.ok) {
        setLeads((prev) =>
          prev.map((l) =>
            l.id === leadId
              ? { ...l, status: "LOST", metadata: { ...(l.metadata ?? {}), lostReason: reason } }
              : l
          )
        );
        toast.success("ליד סומן כלא רלוונטי");
      } else {
        toast.error("שגיאה בעדכון");
      }
    } catch { toast.error("שגיאה בעדכון"); }
    setUpdatingId(null);
  }

  async function leadAction(leadId: string, action: string) {
    setUpdatingId(leadId);
    try {
      const res = await fetch(`/api/leads/${leadId}/actions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      const data = await res.json();
      if (res.status === 429) {
        toast.error(data.error ?? "כבר נשלח לאחרונה");
      } else if (res.ok) {
        if (action === "resend_auto_reply") toast.success("חזרה אוטומטית נשלחה");
        if (action === "send_followup") toast.success("מעקב נשלח");
        if (action === "pause_followups") {
          setLeads((prev) => prev.map((l) => l.id === leadId ? { ...l, metadata: { ...(l.metadata ?? {}), followUpPaused: true } } : l));
          toast.success("מעקבים הושהו");
        }
        if (action === "resume_followups") {
          setLeads((prev) => prev.map((l) => l.id === leadId ? { ...l, metadata: { ...(l.metadata ?? {}), followUpPaused: false } } : l));
          toast.success("מעקבים חודשו");
        }
      } else {
        toast.error(data.error ?? "שגיאה");
      }
    } catch { toast.error("שגיאת חיבור"); }
    setUpdatingId(null);
  }

  function openWhatsApp(lead: Lead) {
    if (!lead.phone) return;
    const phone = normalizePhoneForWa(lead.phone);
    const msg = encodeURIComponent(buildQuickWhatsAppMessage(lead.firstName, clientName));
    window.open(`https://wa.me/${phone}?text=${msg}`, "_blank");

    // Move to CONTACTED if still NEW (user initiated contact)
    if (lead.status === "NEW") {
      updateStatus(lead.id, "CONTACTED");
    }

    // Log the WhatsApp action as activity (fire-and-forget)
    fetch(`/api/leads/${lead.id}/note`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: "📱 נפתח וואצאפ ללקוח" }),
    }).catch(() => {});
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

      {/* Conversion Assistant */}
      {filtered.length > 0 && (() => {
        const assistant = getConversionAssistant(filtered);
        const hasCards = assistant.urgentCount > 0 || assistant.highProbabilityCount > 0 || assistant.followupCount > 0;
        if (!hasCards && assistant.tips.length === 0) return null;
        return (
          <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-4 space-y-3">
            <p className="text-sm font-bold text-slate-800">📈 איך לסגור יותר היום</p>
            {hasCards && (
              <div className="grid grid-cols-3 gap-2">
                {assistant.urgentCount > 0 && (
                  <div className="bg-red-50 border border-red-200 rounded-lg px-3 py-2 text-center">
                    <p className="text-lg font-bold text-red-700">{assistant.urgentCount}</p>
                    <p className="text-[10px] text-red-600 font-medium">🚨 דורשים תגובה</p>
                  </div>
                )}
                {assistant.highProbabilityCount > 0 && (
                  <div className="bg-green-50 border border-green-200 rounded-lg px-3 py-2 text-center">
                    <p className="text-lg font-bold text-green-700">{assistant.highProbabilityCount}</p>
                    <p className="text-[10px] text-green-600 font-medium">💰 סיכוי סגירה</p>
                  </div>
                )}
                {assistant.followupCount > 0 && (
                  <div className="bg-purple-50 border border-purple-200 rounded-lg px-3 py-2 text-center">
                    <p className="text-lg font-bold text-purple-700">{assistant.followupCount}</p>
                    <p className="text-[10px] text-purple-600 font-medium">⏱️ מחכים למעקב</p>
                  </div>
                )}
              </div>
            )}
            {assistant.tips.length > 0 && (
              <div className="space-y-1">
                {assistant.tips.map((tip, i) => (
                  <p key={i} className="text-[11px] text-slate-600 flex items-start gap-1.5">
                    <span className="text-amber-500 flex-shrink-0">💡</span>
                    {tip}
                  </p>
                ))}
              </div>
            )}
          </div>
        );
      })()}

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
            const srcLabel = getSourceLabel(lead.source);
            const heat = classifyLeadHeat(lead);
            const heatStyle = HEAT_CONFIG[heat];
            const sla = getLeadSla(lead);
            const slaStyle = SLA_CONFIG[sla.level];
            const priority = getLeadPriority(lead);
            const prioStyle = PRIORITY_STYLES[priority.level];
            const closeInsight = getCloseInsight(lead);
            const probStyle = getProbStyle(closeInsight.probability);

            return (
            <div
              key={lead.id}
              className={`bg-white rounded-xl shadow-sm p-4 transition-colors ${
                sla.level === "critical"
                  ? "border-2 border-red-200 bg-red-50/20"
                  : sla.level === "warning"
                  ? "border-2 border-amber-200 bg-amber-50/10"
                  : isNew
                  ? "border-2 border-blue-200"
                  : "border border-slate-100"
              }`}
            >
              {/* Row 1: Name + Status + Time */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg flex-shrink-0 ${
                    sla.level === "critical" ? "bg-red-100" : isNew ? "bg-blue-100" : "bg-slate-50"
                  }`}>
                    {lead.gender === "male" ? "👨" : lead.gender === "female" ? "👩" : "👤"}
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900 text-sm">
                      {lead.firstName} {lead.lastName}
                    </p>
                    <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5 flex-wrap">
                      <span className={`inline-flex items-center gap-1 ${sla.level !== "met" ? slaStyle.color : ""}`}>
                        {sla.level !== "met" && slaStyle.icon && <span className="text-[10px]">{slaStyle.icon}</span>}
                        <Clock size={10} />
                        {sla.label}
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
                    {/* Suggestion line */}
                    {lead.status !== "WON" && lead.status !== "LOST" && closeInsight.action !== "wait" && (
                      <p className="text-[10px] text-blue-600 font-medium mt-1">
                        💡 {closeInsight.suggestion}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  {priority.level !== "normal" && (
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${prioStyle.badge} ${priority.level === "urgent" ? "animate-pulse" : ""}`}>
                      {prioStyle.label}
                    </span>
                  )}
                  {lead.status !== "WON" && lead.status !== "LOST" && (
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${probStyle.bg} ${probStyle.color}`}>
                      📊 {closeInsight.probability}%
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
                {/* Suggested quick action */}
                {lead.status !== "WON" && lead.status !== "LOST" && closeInsight.action !== "wait" && (
                  closeInsight.action === "call" && lead.phone ? (
                    <a
                      href={`tel:${lead.phone}`}
                      className="inline-flex items-center gap-1 text-[10px] font-semibold px-2.5 py-1.5 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors"
                    >
                      📞 {closeInsight.suggestion}
                    </a>
                  ) : closeInsight.action === "whatsapp" && lead.phone ? (
                    <button
                      onClick={() => openWhatsApp(lead)}
                      className="inline-flex items-center gap-1 text-[10px] font-semibold px-2.5 py-1.5 rounded-lg bg-green-600 text-white hover:bg-green-700 transition-colors"
                    >
                      💬 {closeInsight.suggestion}
                    </button>
                  ) : closeInsight.action === "followup" ? (
                    <button
                      onClick={() => leadAction(lead.id, "send_followup")}
                      disabled={updatingId === lead.id}
                      className="inline-flex items-center gap-1 text-[10px] font-semibold px-2.5 py-1.5 rounded-lg bg-purple-600 text-white hover:bg-purple-700 transition-colors disabled:opacity-40"
                    >
                      ⏱️ {closeInsight.suggestion}
                    </button>
                  ) : null
                )}
              </div>

              {/* Automation actions */}
              {lead.phone && lead.status !== "WON" && lead.status !== "LOST" && (
                <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                  <button
                    onClick={() => leadAction(lead.id, "resend_auto_reply")}
                    disabled={updatingId === lead.id}
                    className="text-[10px] font-medium px-2 py-1 rounded-md border border-blue-200 text-blue-600 hover:bg-blue-50 transition-colors disabled:opacity-40"
                  >
                    📩 שלח חזרה שוב
                  </button>
                  <button
                    onClick={() => leadAction(lead.id, "send_followup")}
                    disabled={updatingId === lead.id}
                    className="text-[10px] font-medium px-2 py-1 rounded-md border border-purple-200 text-purple-600 hover:bg-purple-50 transition-colors disabled:opacity-40"
                  >
                    ⏱️ שלח מעקב עכשיו
                  </button>
                  {(lead.metadata?.followUpPaused === true) ? (
                    <button
                      onClick={() => leadAction(lead.id, "resume_followups")}
                      disabled={updatingId === lead.id}
                      className="text-[10px] font-medium px-2 py-1 rounded-md border border-green-200 text-green-600 hover:bg-green-50 transition-colors disabled:opacity-40"
                    >
                      ▶️ הפעל מעקבים
                    </button>
                  ) : (
                    <button
                      onClick={() => leadAction(lead.id, "pause_followups")}
                      disabled={updatingId === lead.id}
                      className="text-[10px] font-medium px-2 py-1 rounded-md border border-slate-200 text-slate-500 hover:bg-slate-50 transition-colors disabled:opacity-40"
                    >
                      ⏸️ עצור מעקבים
                    </button>
                  )}
                </div>
              )}

              {/* Lost reason display (if LOST) */}
              {lead.status === "LOST" && lead.metadata?.lostReason && (
                <div className="mt-2 text-[11px] text-red-500 bg-red-50 rounded-md px-2.5 py-1 inline-block">
                  סיבה: {LOST_REASONS.find((r) => r.key === lead.metadata?.lostReason)?.label ?? (lead.metadata.lostReason as string)}
                </div>
              )}

              {/* Row 3: Status buttons */}
              <div className="flex gap-1.5 mt-3 pt-3 border-t border-slate-50 flex-wrap relative">
                {(["CONTACTED", "QUALIFIED", "PROPOSAL", "WON", "LOST"] as const).map((s) => (
                  <button
                    key={s}
                    onClick={() => s === "LOST" ? setLostPickerLeadId(lead.id) : updateStatus(lead.id, s)}
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

                {/* Inline lost reason picker */}
                {lostPickerLeadId === lead.id && (
                  <div className="absolute bottom-full mb-1 right-0 bg-white border border-red-200 rounded-xl shadow-lg p-2 z-10 w-48">
                    <p className="text-[10px] font-semibold text-red-600 px-2 py-1">למה הליד אבד?</p>
                    {LOST_REASONS.map((r) => (
                      <button
                        key={r.key}
                        onClick={() => markAsLost(lead.id, r.key)}
                        className="w-full text-right px-2 py-1.5 text-xs text-slate-700 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        {r.label}
                      </button>
                    ))}
                    <button
                      onClick={() => setLostPickerLeadId(null)}
                      className="w-full text-right px-2 py-1 text-[10px] text-slate-400 hover:text-slate-600 mt-1"
                    >
                      ביטול
                    </button>
                  </div>
                )}
              </div>
            </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
