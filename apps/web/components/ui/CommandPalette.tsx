"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

export interface Command {
  id: string;
  label: string;
  description?: string;
  icon: string;
  href?: string;
  action?: () => void;
  group: string;
  keywords?: string[];
}

interface Props {
  open: boolean;
  onClose: () => void;
  commands: Command[];
}

export function CommandPalette({ open, onClose, commands }: Props) {
  const [query, setQuery] = useState("");
  const [sel, setSel] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  useEffect(() => {
    if (open) { setQuery(""); setSel(0); setTimeout(() => inputRef.current?.focus(), 50); }
  }, [open]);

  const filtered = query.trim() === ""
    ? commands
    : commands.filter((c) => {
        const q = query.toLowerCase();
        return c.label.toLowerCase().includes(q) || c.description?.toLowerCase().includes(q) || c.keywords?.some((k) => k.includes(q));
      });

  const groups = filtered.reduce<Record<string, Command[]>>((acc, c) => {
    (acc[c.group] ??= []).push(c);
    return acc;
  }, {});
  const flat = Object.values(groups).flat();

  useEffect(() => { setSel(0); }, [query]);

  useEffect(() => {
    function h(e: KeyboardEvent) {
      if (!open) return;
      if (e.key === "ArrowDown") { e.preventDefault(); setSel((i) => Math.min(i + 1, flat.length - 1)); }
      if (e.key === "ArrowUp") { e.preventDefault(); setSel((i) => Math.max(i - 1, 0)); }
      if (e.key === "Enter") { e.preventDefault(); const c = flat[sel]; if (c) exec(c); }
    }
    document.addEventListener("keydown", h);
    return () => document.removeEventListener("keydown", h);
  });

  function exec(c: Command) {
    onClose();
    if (c.href) router.push(c.href);
    else c.action?.();
  }

  if (!open) return null;

  let idx = 0;

  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)", zIndex: 10000, display: "flex", alignItems: "flex-start", justifyContent: "center", paddingTop: "15vh", padding: "15vh 16px 0" }}>
      <div onClick={(e) => e.stopPropagation()} style={{ width: "100%", maxWidth: "560px", background: "var(--bg-card)", borderRadius: "16px", overflow: "hidden", boxShadow: "0 25px 60px rgba(0,0,0,0.3)", direction: "rtl" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px", padding: "16px", borderBottom: "1px solid var(--border-color)" }}>
          <span style={{ fontSize: "18px" }}>🔍</span>
          <input ref={inputRef} value={query} onChange={(e) => setQuery(e.target.value)} placeholder="חפש פקודה או דף..." style={{ flex: 1, border: "none", outline: "none", fontSize: "16px", color: "var(--text-primary)", background: "transparent", direction: "rtl", fontFamily: "inherit" }} />
          <kbd style={{ fontSize: "11px", color: "#9ca3af", background: "#f3f4f6", padding: "3px 6px", borderRadius: "4px", fontFamily: "monospace" }}>ESC</kbd>
        </div>

        <div style={{ maxHeight: "400px", overflowY: "auto", padding: "8px" }}>
          {flat.length === 0 ? (
            <div style={{ padding: "32px", textAlign: "center", color: "#9ca3af", fontSize: "14px" }}>לא נמצאו תוצאות</div>
          ) : Object.entries(groups).map(([group, cmds]) => (
            <div key={group} style={{ marginBottom: "8px" }}>
              <div style={{ fontSize: "11px", fontWeight: 700, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.05em", padding: "4px 8px", marginBottom: "2px" }}>{group}</div>
              {cmds.map((c) => {
                const ci = idx++;
                const isSel = ci === sel;
                return (
                  <div key={c.id} onClick={() => exec(c)} onMouseEnter={() => setSel(ci)} style={{ display: "flex", alignItems: "center", gap: "12px", padding: "10px 12px", borderRadius: "8px", cursor: "pointer", background: isSel ? "#eef2ff" : "transparent" }}>
                    <div style={{ width: "32px", height: "32px", borderRadius: "8px", background: isSel ? "#6366f1" : "#f3f4f6", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "15px", flexShrink: 0 }}>{c.icon}</div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: "14px", fontWeight: 600, color: isSel ? "#6366f1" : "#111827" }}>{c.label}</div>
                      {c.description && <div style={{ fontSize: "12px", color: "#6b7280", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{c.description}</div>}
                    </div>
                    {isSel && <kbd style={{ fontSize: "11px", color: "#9ca3af", background: "#f3f4f6", padding: "3px 6px", borderRadius: "4px", fontFamily: "monospace" }}>↵</kbd>}
                  </div>
                );
              })}
            </div>
          ))}
        </div>

        <div style={{ padding: "10px 16px", borderTop: "1px solid var(--border-color)", display: "flex", gap: "16px", fontSize: "11px", color: "var(--text-muted)", direction: "ltr" }}>
          <span>↑↓ ניווט</span><span>↵ בחר</span><span>ESC סגור</span>
        </div>
      </div>
    </div>
  );
}
