"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { trackCommandUsed } from "@/lib/analytics";
import { Search } from "lucide-react";

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
    trackCommandUsed(c.id);
    onClose();
    if (c.href) router.push(c.href);
    else c.action?.();
  }

  if (!open) return null;

  let idx = 0;

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[10000] flex items-start justify-center pt-[15vh] px-4"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-[560px] bg-white rounded-2xl overflow-hidden shadow-2xl"
        dir="rtl"
      >
        {/* Search input */}
        <div className="flex items-center gap-3 px-5 py-4 border-b border-slate-100">
          <Search size={18} className="text-slate-400 flex-shrink-0" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="חפש פקודה, דף, ליד..."
            className="flex-1 border-none outline-none text-base text-slate-900 bg-transparent placeholder:text-slate-400"
          />
          <kbd className="text-[11px] text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded font-mono">ESC</kbd>
        </div>

        {/* Results */}
        <div className="max-h-[400px] overflow-y-auto p-2">
          {flat.length === 0 ? (
            <div className="py-8 text-center text-slate-400 text-sm">לא נמצאו תוצאות</div>
          ) : Object.entries(groups).map(([group, cmds]) => (
            <div key={group} className="mb-2">
              <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider px-2 py-1 mb-0.5">{group}</div>
              {cmds.map((c) => {
                const ci = idx++;
                const isSel = ci === sel;
                return (
                  <div
                    key={c.id}
                    onClick={() => exec(c)}
                    onMouseEnter={() => setSel(ci)}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer transition-colors duration-100 ${
                      isSel ? "bg-blue-50" : "hover:bg-slate-50"
                    }`}
                  >
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm flex-shrink-0 ${
                      isSel ? "bg-blue-600 text-white" : "bg-slate-100"
                    }`}>
                      {c.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className={`text-sm font-semibold ${isSel ? "text-blue-600" : "text-slate-900"}`}>{c.label}</div>
                      {c.description && <div className="text-xs text-slate-500 truncate">{c.description}</div>}
                    </div>
                    {isSel && <kbd className="text-[11px] text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded font-mono">↵</kbd>}
                  </div>
                );
              })}
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="px-4 py-2.5 border-t border-slate-100 flex gap-4 text-[11px] text-slate-400" dir="ltr">
          <span>↑↓ ניווט</span><span>↵ בחר</span><span>ESC סגור</span>
        </div>
      </div>
    </div>
  );
}
