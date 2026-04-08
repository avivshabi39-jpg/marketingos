"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { Bell, UserPlus, AlertCircle, Webhook, CheckCheck } from "lucide-react";

type NotificationItem = {
  id: string;
  type: "new_lead" | "followup_due" | "webhook_failed" | string;
  title: string;
  body: string;
  href: string;
  isRead?: boolean;
  createdAt: string;
};

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "עכשיו";
  if (mins < 60) return `לפני ${mins} דקות`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `לפני ${hrs} שעות`;
  return `לפני ${Math.floor(hrs / 24)} ימים`;
}

function NotifIcon({ type }: { type: string }) {
  if (type === "new_lead") return <UserPlus size={14} className="text-blue-500" />;
  if (type === "followup_due") return <AlertCircle size={14} className="text-amber-500" />;
  if (type === "webhook_failed") return <Webhook size={14} className="text-red-500" />;
  return <Bell size={14} className="text-slate-400" />;
}

export function NotificationBell() {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  function fetchNotifications() {
    fetch("/api/notifications?limit=10")
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data.notifications)) setNotifications(data.notifications);
        if (typeof data.unreadCount === "number") setUnreadCount(data.unreadCount);
      })
      .catch(() => {});
  }

  // Fetch on mount and every 30 seconds
  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30_000);
    return () => clearInterval(interval);
  }, []);

  // Close on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  async function markAllRead() {
    try {
      await fetch("/api/inbox", { method: "PATCH" });
      setUnreadCount(0);
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    } catch {
      // ignore
    }
  }

  return (
    <div className="relative" ref={ref} dir="rtl">
      <button
        onClick={() => setOpen((v) => !v)}
        className="relative p-2 rounded-lg hover:bg-slate-100 transition-colors"
        aria-label="התראות"
      >
        <Bell size={20} className="text-slate-600" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 min-w-[16px] h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-0.5 leading-none">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute top-full left-0 mt-2 w-80 bg-white border border-slate-100 rounded-2xl shadow-xl z-50 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
            <span className="text-sm font-semibold text-slate-900">התראות</span>
            {unreadCount > 0 && (
              <button
                onClick={markAllRead}
                className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 font-medium transition-colors"
              >
                <CheckCheck size={13} />
                סמן הכל כנקרא
              </button>
            )}
          </div>

          {/* List */}
          {notifications.length === 0 ? (
            <p className="text-sm text-slate-400 px-4 py-8 text-center">אין התראות</p>
          ) : (
            <div className="max-h-80 overflow-y-auto">
              {notifications.map((n) => (
                <Link
                  key={n.id}
                  href={n.href}
                  onClick={() => setOpen(false)}
                  className={`flex items-start gap-3 px-4 py-3 hover:bg-slate-50 transition-colors border-b border-slate-50 last:border-0 ${
                    !n.isRead ? "bg-blue-50/40" : ""
                  }`}
                >
                  <div className="w-7 h-7 rounded-full bg-white border border-slate-100 flex items-center justify-center flex-shrink-0 mt-0.5 shadow-sm">
                    <NotifIcon type={n.type} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-900 leading-tight truncate">
                      {n.title}
                    </p>
                    <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">{n.body}</p>
                    <p className="text-[10px] text-slate-400 mt-1">{timeAgo(n.createdAt)}</p>
                  </div>
                  {!n.isRead && (
                    <div className="w-2 h-2 rounded-full bg-blue-500 mt-2 flex-shrink-0" />
                  )}
                </Link>
              ))}
            </div>
          )}

          {/* Footer */}
          <div className="border-t border-slate-100 px-4 py-2.5">
            <Link
              href="/admin/inbox"
              onClick={() => setOpen(false)}
              className="text-xs text-blue-600 hover:text-blue-700 font-medium transition-colors"
            >
              כל ההודעות ←
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

export default NotificationBell;
