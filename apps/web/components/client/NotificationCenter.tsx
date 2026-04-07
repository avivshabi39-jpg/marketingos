"use client";

import { useState, useEffect, useRef } from "react";
import { getNotificationIcon, formatRelativeTime } from "@/lib/notifications";
import { NotificationSkeleton } from "@/components/ui/Skeleton";
import toast from "react-hot-toast";

interface N { id: string; type: string; title: string; body: string; read: boolean; createdAt: string }

export function NotificationCenter({ clientId }: { clientId: string }) {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<N[]>([]);
  const [unread, setUnread] = useState(0);
  const [loading, setLoading] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  async function load() {
    setLoading(true);
    try {
      const r = await fetch(`/api/clients/${clientId}/notifications`);
      const d = await r.json();
      setItems(d.notifications ?? []);
      setUnread(d.unreadCount ?? 0);
    } catch {}
    setLoading(false);
  }

  async function markRead() {
    await fetch(`/api/clients/${clientId}/notifications`, { method: "PATCH" }).catch(() => {});
    setUnread(0);
    setItems((p) => p.map((n) => ({ ...n, read: true })));
    toast.success("כל ההתראות סומנו כנקראו");
  }

  useEffect(() => { load(); }, [clientId]);
  useEffect(() => { if (open && unread > 0) markRead(); }, [open]);
  useEffect(() => {
    function h(e: MouseEvent) { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); }
    if (open) document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [open]);

  return (
    <div ref={ref} style={{ position: "relative", display: "inline-block" }}>
      <button onClick={() => setOpen((o) => !o)} style={{ position: "relative", background: "none", border: "none", cursor: "pointer", fontSize: "20px", padding: "6px", borderRadius: "8px", lineHeight: 1 }} title="התראות">
        🔔
        {unread > 0 && (
          <span style={{ position: "absolute", top: "2px", right: "2px", background: "#ef4444", color: "white", fontSize: "10px", fontWeight: 700, borderRadius: "999px", minWidth: "16px", height: "16px", display: "flex", alignItems: "center", justifyContent: "center", padding: "0 4px" }}>
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {open && (
        <div style={{ position: "absolute", top: "100%", left: "50%", transform: "translateX(-50%)", marginTop: "8px", width: "320px", background: "white", borderRadius: "14px", border: "1px solid #e5e7eb", boxShadow: "0 10px 40px rgba(0,0,0,0.15)", zIndex: 9999, overflow: "hidden", direction: "rtl" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 16px", borderBottom: "1px solid #f3f4f6" }}>
            <span style={{ fontWeight: 700, fontSize: "15px" }}>התראות</span>
            <button onClick={load} style={{ background: "none", border: "none", fontSize: "12px", color: "#6b7280", cursor: "pointer" }}>{loading ? "⏳" : "🔄"}</button>
          </div>

          <div style={{ maxHeight: "360px", overflowY: "auto" }}>
            {loading && items.length === 0 ? (
              <div>{[...Array(3)].map((_, i) => <NotificationSkeleton key={i} />)}</div>
            ) : items.length === 0 ? (
              <div style={{ padding: "32px", textAlign: "center" }}>
                <div style={{ fontSize: "32px", marginBottom: "8px" }}>🔔</div>
                <div style={{ fontSize: "13px", color: "#6b7280" }}>אין התראות עדיין</div>
              </div>
            ) : items.map((n) => (
              <div key={n.id} style={{ padding: "12px 16px", borderBottom: "1px solid #f9fafb", background: n.read ? "white" : "#fafafa", display: "flex", gap: "12px", alignItems: "flex-start" }}>
                <div style={{ width: "36px", height: "36px", borderRadius: "50%", background: "#f3f4f6", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "16px", flexShrink: 0 }}>
                  {getNotificationIcon(n.type)}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: "13px", fontWeight: n.read ? 500 : 700, color: "#111827", marginBottom: "2px" }}>{n.title}</div>
                  <div style={{ fontSize: "12px", color: "#6b7280", marginBottom: "4px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{n.body}</div>
                  <div style={{ fontSize: "11px", color: "#d1d5db" }}>{formatRelativeTime(n.createdAt)}</div>
                </div>
                {!n.read && <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#6366f1", flexShrink: 0, marginTop: "4px" }} />}
              </div>
            ))}
          </div>

          {items.length > 0 && (
            <div style={{ padding: "10px 16px", borderTop: "1px solid #f3f4f6", textAlign: "center" }}>
              <button onClick={markRead} style={{ background: "none", border: "none", fontSize: "12px", color: "#6366f1", cursor: "pointer", fontWeight: 600 }}>סמן הכל כנקרא</button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
