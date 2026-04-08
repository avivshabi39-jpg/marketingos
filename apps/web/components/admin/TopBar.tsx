"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { Search, Bell, X, Users, Building2 } from "lucide-react";

type NotificationItem = {
  id: string;
  type: string;
  title: string;
  description: string;
  isRead: boolean;
  createdAt: string;
  timeAgo: string;
};

type LeadResult = {
  id: string;
  firstName: string;
  lastName: string;
  phone: string | null;
  status: string;
  client: { name: string };
};

type ClientResult = {
  id: string;
  name: string;
  slug: string;
  primaryColor: string;
};

const STATUS_HE: Record<string, string> = {
  NEW: "חדש",
  CONTACTED: "פניה",
  QUALIFIED: "מוסמך",
  PROPOSAL: "הצעה",
  WON: "סגור",
  LOST: "אבוד",
};

export function TopBar() {
  const [query, setQuery] = useState("");
  const [searchResults, setSearchResults] = useState<{ leads: LeadResult[]; clients: ClientResult[] } | null>(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [bellOpen, setBellOpen] = useState(false);

  const searchRef = useRef<HTMLDivElement>(null);
  const bellRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchNotifications = useCallback(() => {
    fetch("/api/notifications")
      .then((r) => r.json())
      .then((data) => {
        if (data.notifications) setNotifications(data.notifications);
        if (typeof data.unread === "number") setUnreadCount(data.unread);
      })
      .catch(() => {});
  }, []);

  // Fetch on mount + every 60s
  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 60000);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  // Close dropdowns when clicking outside
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setSearchOpen(false);
      }
      if (bellRef.current && !bellRef.current.contains(e.target as Node)) {
        setBellOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const doSearch = useCallback((q: string) => {
    if (q.length < 2) {
      setSearchResults(null);
      return;
    }
    fetch(`/api/search?q=${encodeURIComponent(q)}`)
      .then((r) => r.json())
      .then((data) => {
        setSearchResults(data);
        setSearchOpen(true);
      })
      .catch(() => {});
  }, []);

  function handleQueryChange(e: React.ChangeEvent<HTMLInputElement>) {
    const val = e.target.value;
    setQuery(val);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => doSearch(val), 300);
  }

  function clearSearch() {
    setQuery("");
    setSearchResults(null);
    setSearchOpen(false);
  }

  const hasResults =
    searchResults &&
    (searchResults.leads.length > 0 || searchResults.clients.length > 0);

  return (
    <div className="hidden lg:flex items-center gap-4 px-6 h-14 flex-1" dir="rtl">
      {/* Search */}
      <div className="relative flex-1 max-w-md" ref={searchRef}>
        <Search size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
        <input
          value={query}
          onChange={handleQueryChange}
          onFocus={() => { if (hasResults) setSearchOpen(true); }}
          placeholder="חיפוש לידים, לקוחות..."
          className="w-full pr-9 pl-8 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-slate-50 transition-all duration-150 placeholder:text-slate-400"
        />
        {query && (
          <button
            onClick={clearSearch}
            className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
          >
            <X size={14} />
          </button>
        )}

        {/* Search results dropdown */}
        {searchOpen && searchResults && (
          <div className="absolute top-full right-0 mt-2 w-full bg-white border border-slate-100 rounded-2xl shadow-lg z-50 overflow-hidden">
            {!hasResults ? (
              <p className="text-sm text-slate-400 px-4 py-3 text-center">לא נמצאו תוצאות</p>
            ) : (
              <div>
                {searchResults.leads.length > 0 && (
                  <div>
                    <div className="flex items-center gap-2 px-4 py-2 bg-slate-50 border-b border-slate-100">
                      <Users size={13} className="text-slate-400" />
                      <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">לידים</span>
                    </div>
                    {searchResults.leads.map((lead) => (
                      <Link
                        key={lead.id}
                        href="/admin/leads"
                        onClick={() => setSearchOpen(false)}
                        className="flex items-center justify-between px-4 py-2.5 hover:bg-slate-50 transition-colors"
                      >
                        <div>
                          <p className="text-sm font-medium text-slate-900">
                            {lead.firstName} {lead.lastName}
                          </p>
                          <p className="text-xs text-slate-400">{lead.phone ?? ""} · {lead.client.name}</p>
                        </div>
                        <span className="text-xs px-2 py-0.5 rounded-lg bg-blue-50 text-blue-600 font-medium border border-blue-200">
                          {STATUS_HE[lead.status] ?? lead.status}
                        </span>
                      </Link>
                    ))}
                  </div>
                )}
                {searchResults.clients.length > 0 && (
                  <div>
                    <div className="flex items-center gap-2 px-4 py-2 bg-slate-50 border-b border-slate-100">
                      <Building2 size={13} className="text-slate-400" />
                      <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">לקוחות</span>
                    </div>
                    {searchResults.clients.map((client) => (
                      <Link
                        key={client.id}
                        href={`/admin/clients/${client.id}`}
                        onClick={() => setSearchOpen(false)}
                        className="flex items-center gap-3 px-4 py-2.5 hover:bg-slate-50 transition-colors"
                      >
                        <div
                          className="w-7 h-7 rounded-lg flex-shrink-0"
                          style={{ backgroundColor: client.primaryColor }}
                        />
                        <div>
                          <p className="text-sm font-medium text-slate-900">{client.name}</p>
                          <p className="text-xs text-slate-400">{client.slug}</p>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Bell */}
      <div className="relative" ref={bellRef}>
        <button
          onClick={() => {
            const opening = !bellOpen;
            setBellOpen(opening);
            if (opening && unreadCount > 0) {
              setUnreadCount(0);
              setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
              fetch("/api/notifications", { method: "PATCH" }).catch(() => {});
            }
          }}
          className="relative w-9 h-9 rounded-xl flex items-center justify-center text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors"
          aria-label="התראות"
        >
          <Bell size={20} className="text-slate-500" />
          {unreadCount > 0 && (
            <span className="absolute top-1 right-1 min-w-[18px] h-[18px] bg-red-500 text-white text-[11px] font-bold rounded-full flex items-center justify-center px-1 leading-none">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </button>

        {/* Notifications dropdown */}
        {bellOpen && (
          <div className="absolute top-full left-0 mt-2 w-80 bg-white border border-slate-100 rounded-2xl shadow-lg z-50 overflow-hidden" dir="rtl">
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
              <span className="text-sm font-semibold text-slate-900">התראות</span>
              <button
                onClick={() => {
                  setUnreadCount(0);
                  setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
                  fetch("/api/notifications", { method: "PATCH" }).catch(() => {});
                }}
                className="text-xs text-blue-600 hover:text-blue-800 transition-colors"
              >
                סמן הכל כנקרא
              </button>
            </div>

            {notifications.length === 0 ? (
              <div className="px-4 py-8 text-center">
                <div className="text-3xl mb-2">🔔</div>
                <p className="text-sm text-slate-400">אין התראות חדשות</p>
              </div>
            ) : (
              <div className="max-h-80 overflow-y-auto">
                {notifications.map((n) => {
                  const TYPE_ICONS: Record<string, string> = {
                    lead: "👤", form: "📋", appointment: "📅",
                    broadcast: "📢", report: "📊",
                  };
                  return (
                    <div
                      key={n.id}
                      className={`flex items-start gap-3 px-4 py-3 border-b border-slate-50 last:border-0 ${n.isRead ? "bg-white" : "bg-blue-50/40"}`}
                    >
                      {!n.isRead && (
                        <div className="w-2 h-2 mt-1.5 rounded-full bg-blue-500 flex-shrink-0" />
                      )}
                      <span className="text-lg flex-shrink-0">{TYPE_ICONS[n.type] ?? "📌"}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-900 leading-tight">{n.title}</p>
                        {n.description && (
                          <p className="text-xs text-slate-500 mt-0.5 truncate">{n.description}</p>
                        )}
                        <p className="text-xs text-slate-400 mt-1">{n.timeAgo}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            <div className="px-4 py-2.5 border-t border-slate-100 text-center">
              <Link
                href="/admin/inbox"
                onClick={() => setBellOpen(false)}
                className="text-xs text-blue-600 hover:text-blue-800 font-medium transition-colors"
              >
                צפה בכל ההתראות
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
