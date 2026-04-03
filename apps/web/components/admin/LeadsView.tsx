"use client";

import { useState, useRef, useCallback } from "react";
import Link from "next/link";
import {
  LayoutGrid, List, Phone, Mail, Star, Clock, X, Plus, Loader2,
  MessageCircle, Calendar, DollarSign, ChevronDown, Check, Download, ExternalLink,
  Trash2, ArrowRight, Search, CheckSquare, Square,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { LeadTimeline } from "./LeadTimeline";

// ─── Types ────────────────────────────────────────────────────────────────────

type Lead = {
  id: string;
  firstName: string;
  lastName: string;
  email: string | null;
  phone: string | null;
  source: string | null;
  status: string;
  leadScore: number;
  value: number | null;
  notes: string | null;
  followUpAt: Date | null;
  utmSource: string | null;
  utmMedium: string | null;
  utmCampaign: string | null;
  createdAt: Date;
  client: { name: string; primaryColor: string; id: string };
};

// ─── Constants ────────────────────────────────────────────────────────────────

const COLUMNS = [
  { key: "NEW",       label: "חדש",      color: "border-blue-400",   bg: "bg-blue-50",   badge: "bg-blue-100 text-blue-700" },
  { key: "CONTACTED", label: "נוצר קשר", color: "border-yellow-400", bg: "bg-yellow-50", badge: "bg-yellow-100 text-yellow-700" },
  { key: "QUALIFIED", label: "מוסמך",    color: "border-purple-400", bg: "bg-purple-50", badge: "bg-purple-100 text-purple-700" },
  { key: "PROPOSAL",  label: "הצעה",     color: "border-orange-400", bg: "bg-orange-50", badge: "bg-orange-100 text-orange-700" },
  { key: "WON",       label: "נסגר",     color: "border-green-400",  bg: "bg-green-50",  badge: "bg-green-100 text-green-700" },
  { key: "LOST",      label: "אבוד",     color: "border-red-400",    bg: "bg-red-50",    badge: "bg-red-100 text-red-700" },
];

const SOURCE_COLORS: Record<string, string> = {
  facebook: "bg-blue-500 text-white",
  google:   "bg-red-500 text-white",
  organic:  "bg-green-500 text-white",
  manual:   "bg-gray-400 text-white",
  other:    "bg-purple-400 text-white",
};

// Left border accent color by source (for kanban cards)
const SOURCE_BORDER: Record<string, string> = {
  facebook: "border-r-blue-400",
  google:   "border-r-red-400",
  organic:  "border-r-green-400",
  manual:   "border-r-gray-300",
  other:    "border-r-purple-400",
};
const SOURCE_HE: Record<string, string> = {
  facebook: "פייסבוק", google: "גוגל", organic: "אורגני", manual: "ידני", other: "אחר",
};

const NEXT_STATUS: Record<string, string> = {
  NEW: "CONTACTED", CONTACTED: "QUALIFIED", QUALIFIED: "PROPOSAL", PROPOSAL: "WON",
};

function srcKey(source: string | null) {
  const s = source?.toLowerCase() ?? "";
  if (s.includes("facebook") || s.includes("fb")) return "facebook";
  if (s.includes("google")) return "google";
  if (s === "organic") return "organic";
  if (s === "manual") return "manual";
  return "other";
}

function timeAgo(date: Date): string {
  const diff = Date.now() - new Date(date).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `לפני ${mins} דק׳`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `לפני ${hours} שע׳`;
  return `לפני ${Math.floor(hours / 24)} ימים`;
}

// ─── Toast ────────────────────────────────────────────────────────────────────

type Toast = { id: number; msg: string; ok: boolean };
let toastId = 0;

function ToastContainer({ toasts, remove }: { toasts: Toast[]; remove: (id: number) => void }) {
  return (
    <div className="fixed bottom-6 right-6 z-[100] space-y-2">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={cn(
            "flex items-center gap-2 px-4 py-3 rounded-xl shadow-lg text-sm font-medium text-white animate-in slide-in-from-right",
            t.ok ? "bg-green-500" : "bg-red-500"
          )}
        >
          {t.ok ? <Check size={14} /> : <X size={14} />}
          {t.msg}
          <button onClick={() => remove(t.id)} className="mr-1 opacity-70 hover:opacity-100">
            <X size={12} />
          </button>
        </div>
      ))}
    </div>
  );
}

// ─── ScoreStars ───────────────────────────────────────────────────────────────

function ScoreStars({ score, onChange }: { score: number; onChange?: (s: number) => void }) {
  const stars = Math.min(5, Math.max(0, Math.round(score / 20)));
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: 5 }, (_, i) => (
        <Star
          key={i}
          size={12}
          onClick={onChange ? () => onChange((i + 1) * 20) : undefined}
          className={cn(
            i < stars ? "text-amber-400 fill-amber-400" : "text-gray-200",
            onChange && "cursor-pointer hover:scale-110 transition-transform"
          )}
        />
      ))}
    </div>
  );
}

// ─── SourceBadge ─────────────────────────────────────────────────────────────

function SourceBadge({ source }: { source: string | null }) {
  const key = srcKey(source);
  return (
    <span className={cn("text-xs px-1.5 py-0.5 rounded font-medium", SOURCE_COLORS[key])}>
      {SOURCE_HE[key]}
    </span>
  );
}

// ─── Lead Slide-Over Panel ────────────────────────────────────────────────────

function LeadPanel({
  lead,
  onClose,
  onUpdate,
}: {
  lead: Lead;
  onClose: () => void;
  onUpdate: (id: string, patch: Partial<Lead>) => void;
}) {
  const [saving, setSaving] = useState<string | null>(null);
  const [localNotes, setLocalNotes] = useState(lead.notes ?? "");
  const [localValue, setLocalValue] = useState(String(lead.value ?? ""));
  const [localFollowUp, setLocalFollowUp] = useState(
    lead.followUpAt ? new Date(lead.followUpAt).toISOString().split("T")[0] : ""
  );

  async function patch(data: Record<string, unknown>, key: string) {
    setSaving(key);
    try {
      const res = await fetch(`/api/leads/${lead.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (res.ok) {
        const json = await res.json();
        onUpdate(lead.id, json.lead);
      }
    } finally {
      setSaving(null);
    }
  }

  const col = COLUMNS.find((c) => c.key === lead.status);

  return (
    <div className="fixed inset-0 z-50 flex" dir="rtl">
      {/* Backdrop */}
      <div className="flex-1 bg-black/40" onClick={onClose} />

      {/* Panel */}
      <div className="w-full max-w-md bg-white shadow-2xl flex flex-col overflow-y-auto animate-in slide-in-from-right duration-200">
        {/* Header */}
        <div className="flex items-start justify-between p-5 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm"
              style={{ backgroundColor: lead.client.primaryColor }}
            >
              {lead.firstName[0]}{lead.lastName[0]}
            </div>
            <div>
              <h2 className="font-semibold text-gray-900">{lead.firstName} {lead.lastName}</h2>
              <p className="text-xs text-gray-500">{lead.client.name}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href={`/admin/leads/${lead.id}`}
              className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-indigo-600 transition-colors"
              title="פתח עמוד מלא"
            >
              <ExternalLink size={16} />
            </Link>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <X size={18} />
            </button>
          </div>
        </div>

        <div className="flex-1 p-5 space-y-5">
          {/* Contact */}
          <div className="space-y-2">
            {lead.phone && (
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <Phone size={14} className="text-gray-400 flex-shrink-0" />
                  <span className="text-sm text-gray-700 font-medium" dir="ltr">{lead.phone}</span>
                </div>
                <div className="flex items-center gap-2">
                  <a
                    href={`tel:${lead.phone.replace(/[^0-9+]/g, "")}`}
                    className="flex items-center gap-1.5 bg-green-500 hover:bg-green-600 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors"
                  >
                    📞 התקשר
                  </a>
                  <a
                    href={`https://wa.me/972${lead.phone.replace(/[^0-9]/g, "").replace(/^0/, "")}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 bg-[#25d366] hover:bg-[#1da851] text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors"
                  >
                    💬 וואצאפ
                  </a>
                </div>
              </div>
            )}
            {lead.email && (
              <div className="flex items-center gap-3">
                <Mail size={14} className="text-gray-400 flex-shrink-0" />
                <a href={`mailto:${lead.email}`} className="text-sm text-gray-700 hover:text-indigo-600">{lead.email}</a>
              </div>
            )}
            <div className="flex items-center gap-2 flex-wrap">
              <SourceBadge source={lead.source} />
              <ScoreStars
                score={lead.leadScore}
                onChange={(score) => patch({ leadScore: score }, "score")}
              />
              {saving === "score" && <Loader2 size={12} className="animate-spin text-gray-400" />}
            </div>
          </div>

          {/* UTM */}
          {(lead.utmSource || lead.utmCampaign || lead.utmMedium) && (
            <div className="bg-gray-50 rounded-xl p-3 text-xs space-y-1">
              <p className="font-semibold text-gray-500 mb-2">UTM</p>
              {lead.utmSource && <p className="text-gray-700">מקור: <span className="font-medium">{lead.utmSource}</span></p>}
              {lead.utmMedium && <p className="text-gray-700">מדיה: <span className="font-medium">{lead.utmMedium}</span></p>}
              {lead.utmCampaign && <p className="text-gray-700">קמפיין: <span className="font-medium">{lead.utmCampaign}</span></p>}
            </div>
          )}

          {/* Status */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">סטטוס</label>
            <div className="relative">
              <select
                value={lead.status}
                onChange={(e) => patch({ status: e.target.value }, "status")}
                className={cn(
                  "w-full rounded-lg border px-3 py-2 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-400 appearance-none cursor-pointer pr-8",
                  col?.badge
                )}
              >
                {COLUMNS.map((c) => (
                  <option key={c.key} value={c.key}>{c.label}</option>
                ))}
              </select>
              <ChevronDown size={14} className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
              {saving === "status" && <Loader2 size={12} className="absolute left-8 top-1/2 -translate-y-1/2 animate-spin text-gray-400" />}
            </div>
          </div>

          {/* Deal Value */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">
              <DollarSign size={12} className="inline ml-1" />
              ערך עסקה (₪)
            </label>
            <input
              type="number"
              value={localValue}
              onChange={(e) => setLocalValue(e.target.value)}
              onBlur={() => {
                const val = localValue ? Number(localValue) : null;
                if (val !== lead.value) patch({ value: val }, "value");
              }}
              placeholder="0"
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
            />
          </div>

          {/* Follow-up date */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">
              <Calendar size={12} className="inline ml-1" />
              תאריך מעקב
            </label>
            <input
              type="date"
              value={localFollowUp}
              onChange={(e) => setLocalFollowUp(e.target.value)}
              onBlur={() => {
                if (localFollowUp) {
                  patch({ followUpAt: new Date(localFollowUp).toISOString() }, "followup");
                }
              }}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
            />
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">הערות</label>
            <textarea
              rows={4}
              value={localNotes}
              onChange={(e) => setLocalNotes(e.target.value)}
              onBlur={() => {
                if (localNotes !== (lead.notes ?? "")) {
                  patch({ notes: localNotes }, "notes");
                }
              }}
              placeholder="הוסף הערה..."
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 resize-none"
            />
            {saving === "notes" && (
              <p className="text-xs text-gray-400 mt-1 flex items-center gap-1">
                <Loader2 size={10} className="animate-spin" /> שומר...
              </p>
            )}
          </div>

          {/* Activity timeline */}
          <LeadTimeline leadId={lead.id} />

          {/* Timeline */}
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">מידע נוסף</p>
            <div className="space-y-1.5 text-xs text-gray-500">
              <div className="flex items-center gap-2">
                <Clock size={11} />
                <span>נוצר {new Date(lead.createdAt).toLocaleDateString("he-IL", { day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" })}</span>
              </div>
              {lead.followUpAt && (
                <div className="flex items-center gap-2 text-amber-600">
                  <Calendar size={11} />
                  <span>מעקב ב-{new Date(lead.followUpAt).toLocaleDateString("he-IL")}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Quick Add Lead Modal ─────────────────────────────────────────────────────

function QuickAddModal({
  clientId,
  clients,
  onClose,
  onAdded,
}: {
  clientId?: string;
  clients: { id: string; name: string }[];
  onClose: () => void;
  onAdded: (lead: Lead) => void;
}) {
  const [form, setForm] = useState({
    firstName: "", lastName: "", phone: "", email: "",
    source: "manual", notes: "", value: "",
    clientId: clientId ?? clients[0]?.id ?? "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function set(k: keyof typeof form, v: string) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.firstName || !form.lastName || !form.clientId) {
      setError("שם פרטי, שם משפחה ולקוח הם שדות חובה");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName: form.firstName,
          lastName: form.lastName,
          phone: form.phone || undefined,
          email: form.email || undefined,
          source: form.source,
          clientId: form.clientId,
          value: form.value ? Number(form.value) : undefined,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        onAdded(data.lead);
        onClose();
      } else {
        setError("שגיאה ביצירת הליד");
      }
    } catch {
      setError("שגיאת חיבור");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" dir="rtl">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900">ליד חדש</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={18} /></button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">שם פרטי *</label>
              <input value={form.firstName} onChange={(e) => set("firstName", e.target.value)}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">שם משפחה *</label>
              <input value={form.lastName} onChange={(e) => set("lastName", e.target.value)}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">טלפון</label>
            <input type="tel" dir="ltr" value={form.phone} onChange={(e) => set("phone", e.target.value)}
              placeholder="050-0000000"
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400" />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">אימייל</label>
            <input type="email" dir="ltr" value={form.email} onChange={(e) => set("email", e.target.value)}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400" />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">ערך עסקה (₪)</label>
            <input type="number" min="0" value={form.value} onChange={(e) => set("value", e.target.value)}
              placeholder="0"
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">מקור</label>
              <select value={form.source} onChange={(e) => set("source", e.target.value)}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400">
                <option value="manual">ידני</option>
                <option value="facebook">פייסבוק</option>
                <option value="google">גוגל</option>
                <option value="organic">אורגני</option>
                <option value="other">אחר</option>
              </select>
            </div>
            {!clientId && (
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">לקוח *</label>
                <select value={form.clientId} onChange={(e) => set("clientId", e.target.value)}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400">
                  {clients.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
            )}
          </div>

          {error && <p className="text-sm text-red-500 bg-red-50 rounded-lg px-3 py-2">{error}</p>}

          <div className="flex gap-2 pt-1">
            <button type="submit" disabled={loading}
              className="flex-1 flex items-center justify-center gap-2 bg-indigo-500 hover:bg-indigo-600 disabled:opacity-60 text-white text-sm font-medium py-2.5 rounded-lg transition-colors">
              {loading && <Loader2 size={14} className="animate-spin" />}
              {loading ? "שומר..." : "הוסף ליד"}
            </button>
            <button type="button" onClick={onClose}
              className="flex-1 border border-gray-200 text-gray-600 text-sm font-medium py-2.5 rounded-lg hover:bg-gray-50 transition-colors">
              ביטול
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Kanban Card ──────────────────────────────────────────────────────────────

function KanbanCard({
  lead,
  onDragStart,
  onClick,
  isSelected,
  onToggleSelect,
  onQuickAction,
}: {
  lead: Lead;
  onDragStart: (e: React.DragEvent, lead: Lead) => void;
  onClick: (lead: Lead) => void;
  isSelected: boolean;
  onToggleSelect: (id: string) => void;
  onQuickAction: (id: string, action: "advance" | "lost" | "whatsapp") => void;
}) {
  const srcKey_ = srcKey(lead.source);
  const borderColor = SOURCE_BORDER[srcKey_] ?? "border-r-gray-200";
  const nextStatus = NEXT_STATUS[lead.status];

  const isOverdue =
    lead.followUpAt &&
    new Date(lead.followUpAt) < new Date() &&
    lead.status !== "WON" &&
    lead.status !== "LOST";

  return (
    <div
      draggable
      onDragStart={(e) => onDragStart(e, lead)}
      onClick={() => onClick(lead)}
      className={cn(
        "bg-white rounded-lg border border-r-4 shadow-sm p-3 space-y-2",
        "hover:shadow-md cursor-grab active:cursor-grabbing active:opacity-70 active:scale-95",
        "transition-all select-none group",
        borderColor,
        isSelected ? "border-indigo-300 ring-2 ring-indigo-200" : "border-gray-100",
        isOverdue && "ring-1 ring-amber-300"
      )}
    >
      <div className="flex items-start justify-between gap-1">
        <button
          onClick={(e) => { e.stopPropagation(); onToggleSelect(lead.id); }}
          className="flex-shrink-0 text-gray-300 hover:text-indigo-500 mt-0.5 transition-colors"
        >
          {isSelected ? <CheckSquare size={13} className="text-indigo-500" /> : <Square size={13} />}
        </button>
        <div className="flex-1 min-w-0 mr-1">
          <div className="flex items-center gap-1.5">
            <p className="text-sm font-medium text-gray-900 leading-tight truncate">
              {lead.firstName} {lead.lastName}
            </p>
            {isOverdue && (
              <span title="מעקב באיחור" className="text-amber-500 flex-shrink-0">
                <Clock size={11} />
              </span>
            )}
          </div>
          <p className="text-xs text-gray-400 truncate mt-0.5">{lead.client.name}</p>
        </div>
        <SourceBadge source={lead.source} />
      </div>
      {lead.phone && (
        <div className="flex items-center gap-1.5">
          <span className="flex items-center gap-1 text-xs text-gray-500 flex-1 min-w-0 truncate">
            <Phone size={11} className="flex-shrink-0" />{lead.phone}
          </span>
          <a
            href={`tel:${lead.phone.replace(/[^0-9+]/g, "")}`}
            onClick={(e) => e.stopPropagation()}
            title={`התקשר ל-${lead.firstName} ${lead.lastName}`}
            className="flex-shrink-0 w-7 h-7 rounded-full bg-green-100 hover:bg-green-200 flex items-center justify-center text-green-700 transition-colors text-sm leading-none"
          >
            📞
          </a>
        </div>
      )}
      {lead.value ? (
        <span className="inline-block text-xs text-green-700 font-semibold bg-green-50 px-2 py-0.5 rounded-full border border-green-100">
          ₪{lead.value.toLocaleString("he-IL")}
        </span>
      ) : null}
      <div className="flex items-center justify-between pt-1">
        <ScoreStars score={lead.leadScore} />
        <span className="flex items-center gap-1 text-xs text-gray-400">
          <Clock size={10} />{timeAgo(lead.createdAt)}
        </span>
      </div>

      {/* Quick actions — visible on hover */}
      <div className="hidden group-hover:flex items-center gap-1 pt-1 border-t border-gray-50">
        {lead.phone && (
          <button
            onClick={(e) => { e.stopPropagation(); onQuickAction(lead.id, "whatsapp"); }}
            className="flex items-center gap-1 px-1.5 py-1 rounded bg-green-50 text-green-600 hover:bg-green-100 text-xs transition-colors"
            title="וואטסאפ"
          >
            <MessageCircle size={11} />
          </button>
        )}
        {nextStatus && lead.status !== "LOST" && (
          <button
            onClick={(e) => { e.stopPropagation(); onQuickAction(lead.id, "advance"); }}
            className="flex items-center gap-1 px-1.5 py-1 rounded bg-indigo-50 text-indigo-600 hover:bg-indigo-100 text-xs transition-colors"
            title={`העבר ל-${COLUMNS.find(c => c.key === nextStatus)?.label}`}
          >
            <ArrowRight size={11} />
            <span>{COLUMNS.find(c => c.key === nextStatus)?.label}</span>
          </button>
        )}
        {lead.status !== "LOST" && lead.status !== "WON" && (
          <button
            onClick={(e) => { e.stopPropagation(); onQuickAction(lead.id, "lost"); }}
            className="flex items-center gap-1 px-1.5 py-1 rounded bg-red-50 text-red-500 hover:bg-red-100 text-xs transition-colors mr-auto"
            title="סמן כאבוד"
          >
            <X size={11} />
          </button>
        )}
      </div>
    </div>
  );
}

// ─── Kanban Board ─────────────────────────────────────────────────────────────

// Columns that are collapsible by default
const COLLAPSIBLE_COLS = new Set(["WON", "LOST"]);

function KanbanView({
  leads,
  onLeadClick,
  onStatusChange,
  selectedIds,
  onToggleSelect,
  onQuickAction,
}: {
  leads: Lead[];
  onLeadClick: (lead: Lead) => void;
  onStatusChange: (id: string, status: string) => void;
  selectedIds: Set<string>;
  onToggleSelect: (id: string) => void;
  onQuickAction: (id: string, action: "advance" | "lost" | "whatsapp") => void;
}) {
  const [dragOverCol, setDragOverCol] = useState<string | null>(null);
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set(["WON", "LOST"]));
  const draggingId = useRef<string | null>(null);

  function toggleCollapse(key: string) {
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  function handleDragStart(e: React.DragEvent, lead: Lead) {
    draggingId.current = lead.id;
    e.dataTransfer.effectAllowed = "move";
  }

  function handleDragOver(e: React.DragEvent, colKey: string) {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDragOverCol(colKey);
    // Auto-expand on drag-over
    if (collapsed.has(colKey)) {
      setCollapsed((prev) => {
        const next = new Set(prev);
        next.delete(colKey);
        return next;
      });
    }
  }

  function handleDrop(e: React.DragEvent, colKey: string) {
    e.preventDefault();
    setDragOverCol(null);
    if (draggingId.current) {
      onStatusChange(draggingId.current, colKey);
      draggingId.current = null;
    }
  }

  function handleDragLeave() {
    setDragOverCol(null);
  }

  return (
    <div className="flex gap-3 overflow-x-auto pb-4" dir="rtl">
      {COLUMNS.map((col) => {
        const colLeads = leads.filter((l) => l.status === col.key);
        const colValue = colLeads.reduce((s, l) => s + (l.value ?? 0), 0);
        const isOver = dragOverCol === col.key;
        const isCollapsed = collapsed.has(col.key);
        const canCollapse = COLLAPSIBLE_COLS.has(col.key);

        return (
          <div
            key={col.key}
            className={cn(
              "flex-shrink-0 transition-all duration-200",
              isCollapsed ? "w-14" : "w-60",
              isOver && "opacity-90"
            )}
            onDragOver={(e) => handleDragOver(e, col.key)}
            onDrop={(e) => handleDrop(e, col.key)}
            onDragLeave={handleDragLeave}
          >
            {isCollapsed ? (
              // Collapsed pill
              <button
                onClick={() => toggleCollapse(col.key)}
                className={cn(
                  "w-full rounded-xl border-t-2 p-3 flex flex-col items-center gap-2 min-h-[100px] cursor-pointer hover:opacity-80 transition-opacity",
                  col.color, col.bg
                )}
                title={`${col.label} (${colLeads.length})`}
              >
                <span className={cn("text-xs font-bold px-1.5 py-0.5 rounded-full", col.badge)}>
                  {colLeads.length}
                </span>
                <span
                  className="text-xs font-medium text-gray-600"
                  style={{ writingMode: "vertical-rl", textOrientation: "mixed" }}
                >
                  {col.label}
                </span>
                <ChevronDown size={12} className="text-gray-400 rotate-90" />
              </button>
            ) : (
              <div
                className={cn(
                  "rounded-xl border-t-2 p-3 min-h-[120px] transition-all",
                  col.color, col.bg,
                  isOver && "ring-2 ring-indigo-300 ring-offset-1"
                )}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-1.5">
                    <h3 className="font-semibold text-gray-800 text-sm">{col.label}</h3>
                    {canCollapse && (
                      <button
                        onClick={() => toggleCollapse(col.key)}
                        className="text-gray-400 hover:text-gray-600"
                        title="כווץ עמודה"
                      >
                        <ChevronDown size={13} className="-rotate-90" />
                      </button>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5">
                    {colValue > 0 && (
                      <span className="text-xs text-gray-400 font-medium">
                        ₪{(colValue / 1000).toFixed(0)}K
                      </span>
                    )}
                    <span className={cn("text-xs font-bold px-2 py-0.5 rounded-full", col.badge)}>
                      {colLeads.length}
                    </span>
                  </div>
                </div>
                <div className="space-y-2">
                  {colLeads.map((lead) => (
                    <KanbanCard
                      key={lead.id}
                      lead={lead}
                      onDragStart={handleDragStart}
                      onClick={onLeadClick}
                      isSelected={selectedIds.has(lead.id)}
                      onToggleSelect={onToggleSelect}
                      onQuickAction={onQuickAction}
                    />
                  ))}
                  {colLeads.length === 0 && (
                    <div className={cn(
                      "border-2 border-dashed rounded-lg py-6 text-center transition-colors",
                      isOver ? "border-indigo-300 bg-indigo-50/50" : "border-gray-200"
                    )}>
                      <p className="text-xs text-gray-400">{isOver ? "שחרר כאן" : "גרור לכאן"}</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── List View ────────────────────────────────────────────────────────────────

function ListView({
  leads,
  onLeadClick,
}: {
  leads: Lead[];
  onLeadClick: (lead: Lead) => void;
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden" dir="rtl">
      <table className="min-w-full divide-y divide-gray-100">
        <thead className="bg-gray-50">
          <tr>
            {["שם", "טלפון", "מקור", "סטטוס", "ניקוד", "ערך", "לקוח", "תאריך"].map((h) => (
              <th key={h} className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50">
          {leads.map((lead) => {
            const col = COLUMNS.find((c) => c.key === lead.status);
            return (
              <tr
                key={lead.id}
                onClick={() => onLeadClick(lead)}
                className="hover:bg-gray-50/60 transition-colors cursor-pointer"
              >
                <td className="px-4 py-3">
                  <p className="text-sm font-medium text-gray-900">{lead.firstName} {lead.lastName}</p>
                  <p className="text-xs text-gray-400">{lead.email ?? ""}</p>
                </td>
                <td className="px-4 py-3 text-sm text-gray-600">
                  {lead.phone ? (
                    <div className="flex items-center gap-1.5">
                      <span dir="ltr">{lead.phone}</span>
                      <a
                        href={`tel:${lead.phone.replace(/[^0-9+]/g, "")}`}
                        onClick={(e) => e.stopPropagation()}
                        className="w-6 h-6 rounded-full bg-green-100 hover:bg-green-200 flex items-center justify-center text-xs transition-colors flex-shrink-0"
                        title="התקשר"
                      >
                        📞
                      </a>
                    </div>
                  ) : "—"}
                </td>
                <td className="px-4 py-3"><SourceBadge source={lead.source} /></td>
                <td className="px-4 py-3">
                  <span className={cn("text-xs px-2 py-1 rounded-full font-medium", col?.badge ?? "bg-gray-100 text-gray-600")}>
                    {col?.label ?? lead.status}
                  </span>
                </td>
                <td className="px-4 py-3"><ScoreStars score={lead.leadScore} /></td>
                <td className="px-4 py-3 text-sm text-gray-600">
                  {lead.value ? `₪${lead.value.toLocaleString("he-IL")}` : "—"}
                </td>
                <td className="px-4 py-3 text-sm text-gray-500">{lead.client.name}</td>
                <td className="px-4 py-3 text-sm text-gray-400">
                  {new Date(lead.createdAt).toLocaleDateString("he-IL")}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      {leads.length === 0 && (
        <p className="px-6 py-10 text-sm text-center text-gray-500">לא נמצאו לידים.</p>
      )}
    </div>
  );
}

// ─── Main LeadsView ───────────────────────────────────────────────────────────

export function LeadsView({
  leads: initialLeads,
  clients = [],
  clientId,
}: {
  leads: Lead[];
  clients?: { id: string; name: string }[];
  clientId?: string;
}) {
  const [leads, setLeads] = useState<Lead[]>(initialLeads);
  const [view, setView] = useState<"kanban" | "list">("kanban");
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [search, setSearch] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkWorking, setBulkWorking] = useState(false);

  function addToast(msg: string, ok: boolean) {
    const id = toastId++;
    setToasts((t) => [...t, { id, msg, ok }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3500);
  }

  function removeToast(id: number) {
    setToasts((t) => t.filter((x) => x.id !== id));
  }

  function updateLead(id: string, patch: Partial<Lead>) {
    setLeads((prev) => prev.map((l) => (l.id === id ? { ...l, ...patch } : l)));
    if (selectedLead?.id === id) setSelectedLead((prev) => prev ? { ...prev, ...patch } : prev);
  }

  const handleStatusChange = useCallback(
    async (id: string, status: string) => {
      const lead = leads.find((l) => l.id === id);
      if (!lead || lead.status === status) return;

      // Optimistic
      updateLead(id, { status });

      try {
        const res = await fetch(`/api/leads/${id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status }),
        });
        if (res.ok) {
          addToast("סטטוס עודכן", true);
        } else {
          // Revert
          updateLead(id, { status: lead.status });
          addToast("שגיאה בעדכון סטטוס", false);
        }
      } catch {
        updateLead(id, { status: lead.status });
        addToast("שגיאת חיבור", false);
      }
    },
    [leads]
  );

  function handleLeadAdded(lead: Lead) {
    setLeads((prev) => [lead, ...prev]);
    addToast("ליד נוסף בהצלחה!", true);
  }

  // Derived: filtered leads based on search
  const filteredLeads = search.trim()
    ? leads.filter((l) => {
        const q = search.toLowerCase();
        return (
          `${l.firstName} ${l.lastName}`.toLowerCase().includes(q) ||
          (l.phone ?? "").includes(q) ||
          (l.email ?? "").toLowerCase().includes(q)
        );
      })
    : leads;

  function toggleSelect(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  function clearSelection() { setSelectedIds(new Set()); }

  async function handleQuickAction(id: string, action: "advance" | "lost" | "whatsapp") {
    if (action === "whatsapp") {
      const lead = leads.find((l) => l.id === id);
      if (lead?.phone) {
        window.open(`https://wa.me/${lead.phone.replace(/[^0-9]/g, "")}`, "_blank");
      }
      return;
    }
    const lead = leads.find((l) => l.id === id);
    if (!lead) return;
    const newStatus = action === "lost" ? "LOST" : (NEXT_STATUS[lead.status] ?? lead.status);
    await handleStatusChange(id, newStatus);
  }

  async function handleBulkStatusChange(status: string) {
    if (selectedIds.size === 0) return;
    setBulkWorking(true);
    const ids = Array.from(selectedIds);
    try {
      await Promise.all(
        ids.map((id) =>
          fetch(`/api/leads/${id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ status }),
          })
        )
      );
      setLeads((prev) =>
        prev.map((l) => (selectedIds.has(l.id) ? { ...l, status } : l))
      );
      addToast(`${ids.length} לידים עודכנו`, true);
      clearSelection();
    } catch {
      addToast("שגיאה בעדכון", false);
    } finally {
      setBulkWorking(false);
    }
  }

  async function handleBulkDelete() {
    if (selectedIds.size === 0 || !confirm(`למחוק ${selectedIds.size} לידים?`)) return;
    setBulkWorking(true);
    const ids = Array.from(selectedIds);
    try {
      await Promise.all(ids.map((id) => fetch(`/api/leads/${id}`, { method: "DELETE" })));
      setLeads((prev) => prev.filter((l) => !selectedIds.has(l.id)));
      addToast(`${ids.length} לידים נמחקו`, true);
      clearSelection();
    } catch {
      addToast("שגיאה במחיקה", false);
    } finally {
      setBulkWorking(false);
    }
  }

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex gap-1 bg-gray-100 p-1 rounded-lg">
          {(["kanban", "list"] as const).map((v) => (
            <button
              key={v}
              onClick={() => setView(v)}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all",
                view === v ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"
              )}
            >
              {v === "kanban" ? <LayoutGrid size={14} /> : <List size={14} />}
              {v === "kanban" ? "קנבן" : "רשימה"}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative flex-1 min-w-[160px] max-w-xs">
          <Search size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="חיפוש שם / טלפון..."
            className="w-full rounded-lg border border-gray-200 pr-8 pl-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
          />
          {search && (
            <button onClick={() => setSearch("")} className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
              <X size={12} />
            </button>
          )}
        </div>

        <div className="flex items-center gap-2 mr-auto">
          <a
            href={`/api/leads/export${clientId ? `?clientId=${clientId}` : ""}`}
            download
            className="flex items-center gap-1.5 border border-gray-200 text-gray-600 text-sm font-medium px-3 py-2 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Download size={14} />
            ייצוא CSV
          </a>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 bg-indigo-500 hover:bg-indigo-600 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
          >
            <Plus size={15} />
            הוסף ליד
          </button>
        </div>
      </div>

      {/* Bulk actions toolbar */}
      {selectedIds.size > 0 && (
        <div className="flex items-center gap-3 bg-indigo-50 border border-indigo-200 rounded-xl px-4 py-2.5" dir="rtl">
          <span className="text-sm font-medium text-indigo-700">{selectedIds.size} נבחרו</span>
          <button onClick={clearSelection} className="text-indigo-400 hover:text-indigo-600"><X size={14} /></button>
          <div className="h-4 w-px bg-indigo-200 mx-1" />
          <span className="text-xs text-indigo-500">שנה סטטוס:</span>
          {COLUMNS.map((c) => (
            <button
              key={c.key}
              disabled={bulkWorking}
              onClick={() => handleBulkStatusChange(c.key)}
              className={cn("text-xs px-2 py-1 rounded-full font-medium disabled:opacity-50", c.badge)}
            >
              {c.label}
            </button>
          ))}
          <div className="h-4 w-px bg-indigo-200 mx-1" />
          <button
            disabled={bulkWorking}
            onClick={handleBulkDelete}
            className="flex items-center gap-1 text-xs text-red-500 hover:text-red-700 disabled:opacity-50"
          >
            <Trash2 size={13} /> מחק
          </button>
          {bulkWorking && <Loader2 size={14} className="animate-spin text-indigo-500 mr-auto" />}
        </div>
      )}

      {view === "kanban" ? (
        <KanbanView
          leads={filteredLeads}
          onLeadClick={setSelectedLead}
          onStatusChange={handleStatusChange}
          selectedIds={selectedIds}
          onToggleSelect={toggleSelect}
          onQuickAction={handleQuickAction}
        />
      ) : (
        <ListView leads={filteredLeads} onLeadClick={setSelectedLead} />
      )}

      {selectedLead && (
        <LeadPanel
          lead={selectedLead}
          onClose={() => setSelectedLead(null)}
          onUpdate={updateLead}
        />
      )}

      {showAddModal && (
        <QuickAddModal
          clientId={clientId}
          clients={clients}
          onClose={() => setShowAddModal(false)}
          onAdded={handleLeadAdded}
        />
      )}

      <ToastContainer toasts={toasts} remove={removeToast} />
    </div>
  );
}
