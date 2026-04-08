"use client";

import { useState, useEffect, useCallback } from "react";
import {
  MessageSquare, Phone, RefreshCw, Loader2, Check,
  Users, FileText, CalendarDays, Send, Sparkles, X,
} from "lucide-react";
import toast from "react-hot-toast";

type InboxItem = {
  id: string;
  type: "lead_created" | "appointment" | "form_submitted";
  title: string;
  subtitle: string;
  detail: string;
  phone: string | null;
  clientName: string;
  clientColor: string;
  clientId: string;
  createdAt: string;
};

const TYPE_CONFIG = {
  lead_created:   { label: "ליד חדש",    icon: Users,        color: "bg-blue-100 text-blue-600" },
  appointment:    { label: "תור",         icon: CalendarDays, color: "bg-purple-100 text-purple-600" },
  form_submitted: { label: "טופס קבלה",  icon: FileText,     color: "bg-green-100 text-green-600" },
};

const VARIABLES = ["{name}", "{phone}"];

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "עכשיו";
  if (mins < 60) return `לפני ${mins} דקות`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `לפני ${hrs} שעות`;
  return `לפני ${Math.floor(hrs / 24)} ימים`;
}

function ReplyPanel({
  item,
  onClose,
}: {
  item: InboxItem;
  onClose: () => void;
}) {
  const [message, setMessage]   = useState("");
  const [sending, setSending]   = useState(false);
  const [aiLoading, setAiLoading] = useState(false);

  async function suggestAi() {
    setAiLoading(true);
    try {
      const res = await fetch("/api/ai/reply-suggestion", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          leadName: item.title,
          industry: item.clientName,
          source:   item.subtitle,
        }),
      });
      const d = await res.json() as { message?: string; error?: string };
      if (d.message) setMessage(d.message);
      else toast.error(d.error ?? "שגיאת AI");
    } catch {
      toast.error("שגיאת רשת");
    } finally {
      setAiLoading(false);
    }
  }

  async function sendReply() {
    if (!item.phone || !message.trim()) return;
    const resolved = message
      .replace("{name}", item.title)
      .replace("{phone}", item.phone ?? "");
    setSending(true);
    try {
      const res = await fetch("/api/inbox/reply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: item.phone, message: resolved, clientId: item.clientId }),
      });
      const d = await res.json() as { ok?: boolean; error?: string };
      if (d.ok) {
        toast.success("הודעה נשלחה! ✅");
        onClose();
      } else {
        toast.error(d.error ?? "שגיאה בשליחה");
      }
    } catch {
      toast.error("שגיאת רשת");
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="mt-3 border border-blue-100 bg-blue-50 rounded-xl p-3 space-y-2.5">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold text-blue-700">💬 השב ל‑{item.title}</p>
        <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><X size={14} /></button>
      </div>

      <textarea
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder="כתוב הודעה..."
        rows={3}
        className="w-full text-sm border border-blue-200 bg-white rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-300 outline-none resize-none"
      />

      {/* Variables */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-xs text-slate-500">משתנים:</span>
        {VARIABLES.map((v) => (
          <button
            key={v}
            onClick={() => setMessage((prev) => prev + v)}
            className="text-xs font-mono px-2 py-1 bg-white border border-slate-200 rounded-xl hover:border-blue-300 hover:text-blue-600 transition"
          >
            {v}
          </button>
        ))}
      </div>

      <div className="flex gap-2">
        <button
          onClick={suggestAi}
          disabled={aiLoading}
          className="flex items-center gap-1.5 text-xs font-medium px-3 py-2 bg-purple-50 hover:bg-purple-100 text-purple-700 rounded-lg border border-purple-100 transition disabled:opacity-60"
        >
          {aiLoading ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} />}
          ✨ AI הצע הודעה
        </button>
        <button
          onClick={sendReply}
          disabled={sending || !message.trim() || !item.phone}
          className="flex-1 flex items-center justify-center gap-1.5 text-xs font-semibold px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition disabled:opacity-50"
        >
          {sending ? <Loader2 size={12} className="animate-spin" /> : <Send size={12} />}
          שלח וואצאפ
        </button>
      </div>
      {!item.phone && (
        <p className="text-xs text-red-500">אין מספר טלפון לשליחה</p>
      )}
    </div>
  );
}

export default function InboxPage() {
  const [items, setItems]         = useState<InboxItem[]>([]);
  const [loading, setLoading]     = useState(true);
  const [handled, setHandled]     = useState<Set<string>>(new Set());
  const [replyOpen, setReplyOpen] = useState<string | null>(null);
  const [filter, setFilter]       = useState<string>("all");
  const [unread, setUnread]       = useState(0);

  const load = useCallback(() => {
    setLoading(true);
    fetch("/api/inbox")
      .then((r) => r.json())
      .then((d) => { setItems(d.items ?? []); setUnread(d.unread ?? 0); })
      .catch(() => toast.error("שגיאה בטעינת הודעות"))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    fetch("/api/inbox", { method: "PATCH" }).catch(() => {});
  }, []);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    const timer = setInterval(load, 30_000);
    return () => clearInterval(timer);
  }, [load]);

  function markHandled(id: string) {
    setHandled((prev) => new Set([...prev, id]));
  }

  function openWhatsApp(phone: string) {
    const clean = phone.replace(/\D/g, "");
    const intl = clean.startsWith("0") ? "972" + clean.slice(1) : clean;
    window.open(`https://wa.me/${intl}`, "_blank");
  }

  const filtered = filter === "all"
    ? items
    : items.filter((i) => i.type === filter);

  const FILTERS = [
    { value: "all",            label: `הכל (${items.length})` },
    { value: "lead_created",   label: "לידים" },
    { value: "form_submitted", label: "טפסים" },
    { value: "appointment",    label: "תורים" },
  ];

  return (
    <div className="space-y-6 max-w-3xl" dir="rtl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <MessageSquare size={22} className="text-blue-500" />
            תיבת הודעות
            {unread > 0 && (
              <span className="text-sm font-semibold bg-red-100 text-red-600 px-2 py-0.5 rounded-full">
                {unread} חדשים
              </span>
            )}
          </h1>
          <p className="text-sm text-slate-500 mt-1">כל הפניות, הלידים והטפסים במקום אחד</p>
        </div>
        <button
          onClick={load}
          disabled={loading}
          className="flex items-center gap-2 text-sm text-slate-500 hover:text-blue-600 border border-slate-200 px-3 py-2 rounded-lg transition"
        >
          <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
          רענן
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-2 flex-wrap">
        {FILTERS.map((f) => (
          <button
            key={f.value}
            onClick={() => setFilter(f.value)}
            className={`px-3 py-1.5 text-sm rounded-lg border transition-all ${
              filter === f.value
                ? "bg-blue-50 border-blue-300 text-blue-700 font-medium"
                : "border-slate-200 text-slate-600 hover:border-slate-300"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* List */}
      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 size={28} className="animate-spin text-slate-300" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm flex flex-col items-center justify-center py-20">
          <MessageSquare size={32} className="text-slate-200 mb-3" />
          <p className="text-sm text-slate-500">אין הודעות</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((item) => {
            const cfg  = TYPE_CONFIG[item.type];
            const Icon = cfg.icon;
            const done = handled.has(item.id);
            const isReplying = replyOpen === item.id;

            return (
              <div
                key={item.id}
                className={`bg-white rounded-xl border shadow-sm p-4 transition-all ${
                  done ? "opacity-50 border-slate-100" : "border-slate-100 hover:shadow-md"
                }`}
              >
                <div className="flex items-start gap-4">
                  {/* Type icon */}
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${cfg.color}`}>
                    <Icon size={16} />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="font-semibold text-slate-900 text-sm">{item.title}</p>
                        <p className="text-xs text-slate-500 mt-0.5">{item.subtitle}</p>
                      </div>
                      <span className="text-[10px] text-slate-400 flex-shrink-0 mt-0.5">{timeAgo(item.createdAt)}</span>
                    </div>
                    {item.detail && (
                      <p className="text-xs text-slate-600 mt-1.5 line-clamp-2">{item.detail}</p>
                    )}
                    <div className="flex items-center gap-2 mt-2.5">
                      <span
                        className="text-[10px] font-medium px-2 py-0.5 rounded-full text-white"
                        style={{ backgroundColor: item.clientColor }}
                      >
                        {item.clientName}
                      </span>
                      <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full border ${cfg.color}`}>
                        {cfg.label}
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col gap-2 flex-shrink-0">
                    {item.phone && (
                      <>
                        <a
                          href={`tel:${item.phone.replace(/[^0-9+]/g, "")}`}
                          className="flex items-center gap-1 text-xs text-green-700 hover:text-green-800 bg-green-50 hover:bg-green-100 border border-green-200 rounded-lg px-2 py-1.5 transition"
                        >
                          📞 התקשר
                        </a>
                        <button
                          onClick={() => openWhatsApp(item.phone!)}
                          className="flex items-center gap-1 text-xs text-green-600 hover:text-green-700 border border-green-200 hover:border-green-400 rounded-lg px-2 py-1.5 transition"
                        >
                          <Phone size={11} />
                          WhatsApp
                        </button>
                        <button
                          onClick={() => setReplyOpen(isReplying ? null : item.id)}
                          className={`flex items-center gap-1 text-xs rounded-lg px-2 py-1.5 transition border ${
                            isReplying
                              ? "bg-blue-50 border-blue-300 text-blue-700"
                              : "text-slate-500 border-slate-200 hover:border-blue-300 hover:text-blue-600"
                          }`}
                        >
                          <MessageSquare size={11} />
                          השב
                        </button>
                      </>
                    )}
                    <button
                      onClick={() => markHandled(item.id)}
                      disabled={done}
                      className={`flex items-center gap-1 text-xs rounded-lg px-2 py-1.5 transition ${
                        done
                          ? "text-green-600 border border-green-200 cursor-default"
                          : "text-slate-500 border border-slate-200 hover:border-green-300 hover:text-green-600"
                      }`}
                    >
                      <Check size={11} />
                      {done ? "טופל" : "סמן טופל"}
                    </button>
                  </div>
                </div>

                {/* Inline reply panel */}
                {isReplying && (
                  <ReplyPanel item={item} onClose={() => setReplyOpen(null)} />
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
