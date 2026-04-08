"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import {
  Wand2, Send, ExternalLink, RefreshCw, CheckCircle2,
  Trash2, ChevronDown, AlertCircle, RotateCcw,
} from "lucide-react";
import toast from "react-hot-toast";
import { AiSuggestionsBar } from "./AiSuggestionsBar";

// ─── Types ────────────────────────────────────────────────────────────────────
type Message = {
  role: "user" | "assistant";
  content: string;
  action?: string;
  suggestions?: string[];
  isStreaming?: boolean;
  isError?: boolean;
  retryText?: string;
  timestamp: Date;
};

type LoadState = "idle" | "loading" | "streaming";

// ─── CSS animations (injected once) ──────────────────────────────────────────
const ANIM_CSS = `
@keyframes ai-blink {
  0%,50%  { opacity: 1; }
  51%,100%{ opacity: 0; }
}
@keyframes ai-bounce {
  0%,80%,100% { transform: scale(0); opacity: 0.4; }
  40%          { transform: scale(1); opacity: 1;   }
}
@keyframes ai-fadeout {
  0%   { opacity:1; max-height:40px; }
  80%  { opacity:1; }
  100% { opacity:0; max-height:0;    }
}
.ai-cursor::after {
  content:'|';
  animation: ai-blink 1s step-start infinite;
  color:#6366f1;
  font-weight:700;
  margin-right:1px;
}
`;

// ─── Action definitions ───────────────────────────────────────────────────────
const ACTIONS: Record<string, { text: string; emoji: string; cls: string }> = {
  BUILD_PAGE:      { text: "בניתי דף נחיתה חדש",              emoji: "✅", cls: "bg-green-50 text-green-700 border-green-200" },
  UPDATE_HERO:     { text: "עדכנתי את כותרת הגיבור",          emoji: "📝", cls: "bg-yellow-50 text-yellow-700 border-yellow-200" },
  UPDATE_COLOR:    { text: "שיניתי את הצבע",                  emoji: "🎨", cls: "bg-blue-50 text-blue-700 border-blue-200" },
  ADD_BLOCK:       { text: "הוספתי בלוק חדש",                 emoji: "✅", cls: "bg-green-50 text-green-700 border-green-200" },
  CHANGE_CTA:      { text: "שיניתי את כפתור הקריאה לפעולה",  emoji: "📝", cls: "bg-yellow-50 text-yellow-700 border-yellow-200" },
  UPDATE_FEATURES: { text: "עדכנתי את בלוק היתרונות",         emoji: "📝", cls: "bg-yellow-50 text-yellow-700 border-yellow-200" },
  PUBLISH:         { text: "פרסמתי את הדף",                   emoji: "✅", cls: "bg-green-50 text-green-700 border-green-200" },
};

const QUICK_ACTIONS = [
  { label: "🏗️ בנה דף ללקוח",   message: "בנה דף נחיתה מקצועי ללקוח" },
  { label: "📊 דוח ביצועים",    message: "צור דוח ביצועים שבועי" },
  { label: "📢 שלח שידור",      message: "שלח שידור וואצאפ לכל הלידים" },
  { label: "🎯 לידים חמים",     message: "אילו לידים הכי חמים היום?" },
  { label: "✨ שפר דף",         message: "שפר את דף הנחיתה — כותרת, צבעים, תוכן" },
  { label: "📈 תובנות",         message: "מה הלקוחות הכי רווחיים ומה אפשר לשפר?" },
];

const MAX_CHARS = 500;

// ─── Sub-components ───────────────────────────────────────────────────────────
function ThinkingDots() {
  return (
    <div style={{ display: "flex", gap: "5px", padding: "6px 4px" }}>
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          style={{
            width: 8, height: 8, borderRadius: "50%",
            background: "#6366f1",
            animation: `ai-bounce 1.4s ease-in-out ${i * 0.2}s infinite`,
          }}
        />
      ))}
    </div>
  );
}

function ActionBadge({ action }: { action: string }) {
  const [alive, setAlive] = useState(true);
  const def = ACTIONS[action];
  useEffect(() => {
    const t = setTimeout(() => setAlive(false), 5000);
    return () => clearTimeout(t);
  }, []);
  if (!alive || !def) return null;
  return (
    <div
      className={`flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-lg border overflow-hidden ${def.cls}`}
      style={{ animation: "ai-fadeout 0.5s ease 4.5s forwards" }}
    >
      <span>{def.emoji}</span>{def.text}
    </div>
  );
}

function formatTime(date: Date): string {
  const s = Math.floor((Date.now() - date.getTime()) / 1000);
  if (s < 10)    return "עכשיו";
  if (s < 3600)  return `לפני ${Math.floor(s / 60) || 1} דקות`;
  if (s < 86400) return `לפני ${Math.floor(s / 3600)} שעות`;
  return `לפני ${Math.floor(s / 86400)} ימים`;
}

// ─── Props ────────────────────────────────────────────────────────────────────
interface Props {
  clientId: string;
  clientSlug: string;
  clientName: string;
  industry: string | null;
  pagePublished: boolean;
  initialMessage?: string;
  onInitialMessageConsumed?: () => void;
}

// ─── Main component ───────────────────────────────────────────────────────────
export function ClientAiAgent({
  clientId, clientSlug, clientName, industry, pagePublished,
  initialMessage, onInitialMessageConsumed,
}: Props) {
  const proactiveContent = !pagePublished
    ? `שלום! אני הסוכן האישי של ${clientName} 🤖\n\n⚠️ הדף עדיין לא פורסם — עובד בטיוטה.\nרוצה שאבנה דף נחיתה מנצח ואפרסם אותו?`
    : `שלום! אני הסוכן האישי של ${clientName} 🤖\n\n✅ הדף פורסם ומוכן לקבל לידים.\nמה תרצה לשפר היום?`;

  const proactiveSuggestions = !pagePublished
    ? ["בנה דף נחיתה חדש", "פרסם את הדף", "שנה את הכותרת"]
    : ["שפר את הכותרת", "שנה את הצבע", "הוסף בלוק המלצות", "כתוב הודעת וואצאפ"];

  const [messages, setMessages] = useState<Message[]>([{
    role: "assistant",
    content: proactiveContent,
    suggestions: proactiveSuggestions,
    timestamp: new Date(),
  }]);
  const [input, setInput]               = useState("");
  const [loadState, setLoadState]       = useState<LoadState>("idle");
  const [clearConfirm, setClearConfirm] = useState(false);
  const [showNewMsg, setShowNewMsg]     = useState(false);

  const bottomRef   = useRef<HTMLDivElement>(null);
  const scrollRef   = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const userScrolled = useRef(false);

  // ── Inject CSS once ──
  useEffect(() => {
    if (!document.getElementById("ai-agent-css")) {
      const s = document.createElement("style");
      s.id = "ai-agent-css";
      s.textContent = ANIM_CSS;
      document.head.appendChild(s);
    }
  }, []);

  // ── Auto-scroll ──
  useEffect(() => {
    if (!userScrolled.current) {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    } else {
      setShowNewMsg(true);
    }
  }, [messages]);

  // ── Track manual scroll ──
  const handleScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const atBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 60;
    userScrolled.current = !atBottom;
    if (atBottom) setShowNewMsg(false);
  }, []);

  // ── Auto-resize textarea ──
  useEffect(() => {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.style.height = "auto";
    const maxH = parseInt(getComputedStyle(ta).lineHeight || "20") * 4 + 24;
    ta.style.height = Math.min(ta.scrollHeight, maxH) + "px";
  }, [input]);

  // ── Load history ──
  useEffect(() => {
    fetch(`/api/ai/agent/history?clientId=${clientId}`)
      .then((r) => r.ok ? r.json() : null)
      .then((d: { messages?: Omit<Message, "timestamp">[] } | null) => {
        if (d?.messages?.length) {
          setMessages((prev) => [
            ...prev,
            ...d.messages!.map((m) => ({ ...m, timestamp: new Date() })),
          ]);
        }
      })
      .catch(() => {});
  }, [clientId]);

  // ── Fire initial message ──
  useEffect(() => {
    if (initialMessage) {
      send(initialMessage);
      onInitialMessageConsumed?.();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialMessage]);

  // ── Send ──
  const send = useCallback(async (text?: string, retryUserText?: string) => {
    const msg = (text ?? input).trim();
    if (!msg || loadState !== "idle") return;
    setInput("");
    userScrolled.current = false;

    const userMsg: Message = { role: "user", content: retryUserText ?? msg, timestamp: new Date() };
    setMessages((prev) => {
      // If retrying, remove the last error message
      const filtered = retryUserText
        ? prev.filter((m) => !m.isError)
        : prev;
      return [...filtered, userMsg];
    });
    setLoadState("loading");

    const history = messages
      .filter((m) => !m.isError)
      .map((m) => ({ role: m.role, content: m.content }));

    try {
      const res = await fetch("/api/ai/agent/stream", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clientId, message: msg, conversationHistory: history }),
      });

      if (!res.ok || !res.body) {
        const errText = await res.text().catch(() => "שגיאת שרת");
        throw new Error(errText);
      }

      // Add streaming placeholder
      setMessages((prev) => [...prev, {
        role: "assistant", content: "", isStreaming: true, timestamp: new Date(),
      }]);
      setLoadState("streaming");

      const reader  = res.body.getReader();
      const decoder = new TextDecoder();

      outer: while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const text = decoder.decode(value, { stream: true });
        const lines = text.split("\n\n").filter((l) => l.startsWith("data: "));

        for (const line of lines) {
          let data: {
            chunk?: string;
            done?: boolean;
            parsed?: { message?: string; action?: string; suggestions?: string[] };
            error?: string;
          };
          try { data = JSON.parse(line.slice(6)); }
          catch { continue; }

          if (data.error) {
            console.error("[AI agent]", data.error);
            setMessages((prev) => prev.slice(0, -1));
            setMessages((prev) => [...prev, {
              role: "assistant",
              content: data.error!,
              isError: true,
              retryText: msg,
              timestamp: new Date(),
            }]);
            break outer;
          }

          if (data.chunk) {
            setMessages((prev) => {
              const updated = [...prev];
              const last = updated[updated.length - 1];
              if (last?.isStreaming) last.content += data.chunk!;
              return updated;
            });
          }

          if (data.done && data.parsed) {
            const p = data.parsed;
            setMessages((prev) => {
              const updated = [...prev];
              const last = updated[updated.length - 1];
              if (last?.isStreaming) {
                last.content     = p.message ?? last.content;
                last.isStreaming = false;
                last.action      = p.action;
                last.suggestions = p.suggestions;
              }
              return updated;
            });
            if (p.action && p.action !== "NONE") {
              toast.success("✅ " + (ACTIONS[p.action]?.text ?? "פעולה בוצעה"));
            }
          }
        }
      }
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : "שגיאת רשת";
      console.error("[AI agent error]", errMsg);
      setMessages((prev) => {
        const filtered = prev.filter((m) => !m.isStreaming);
        return [...filtered, {
          role: "assistant",
          content: errMsg,
          isError: true,
          retryText: msg,
          timestamp: new Date(),
        }];
      });
    } finally {
      setLoadState("idle");
    }
  }, [input, loadState, messages, clientId]);

  // ── Keyboard handler ──
  function handleKey(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    const isSend = e.key === "Enter" && (e.metaKey || e.ctrlKey || (!e.shiftKey));
    if (isSend) { e.preventDefault(); send(); }
  }

  // ── Clear chat ──
  function clearChat() {
    setMessages([{
      role: "assistant",
      content: `שלום! אני הסוכן האישי שלך לבניית דף הנחיתה של ${clientName}. מה תרצה לשנות היום?`,
      suggestions: ["בנה דף נחיתה חדש", "שנה את הכותרת", "שנה את הצבע", "הוסף בלוק המלצות"],
      timestamp: new Date(),
    }]);
    setClearConfirm(false);
  }

  const loading = loadState !== "idle";
  const charCount = input.length;
  const overLimit = charCount > MAX_CHARS;

  return (
    <div className="flex flex-col h-[680px] bg-slate-50 rounded-2xl border border-slate-200 overflow-hidden" dir="rtl">

      {/* ── Header ── */}
      <div className="bg-white border-b border-slate-100 px-5 py-3.5 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-blue-100 flex items-center justify-center">
            <Wand2 size={18} className="text-blue-600" />
          </div>
          <div>
            <p className="font-semibold text-slate-900 text-sm">סוכן AI — {clientName}</p>
            <p className="text-xs text-slate-400">{industry ?? "עסק"} · דף {pagePublished ? "מפורסם ✅" : "לא מפורסם"}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <a
            href={`/${clientSlug}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 border border-blue-200 px-2.5 py-1.5 rounded-lg transition"
          >
            <ExternalLink size={12} />
            צפה בדף
          </a>
          {/* Clear chat */}
          {!clearConfirm ? (
            <button
              onClick={() => setClearConfirm(true)}
              className="flex items-center gap-1 text-xs text-slate-400 hover:text-red-500 border border-slate-200 hover:border-red-200 px-2.5 py-1.5 rounded-lg transition"
              title="נקה שיחה"
            >
              <Trash2 size={12} />
              נקה
            </button>
          ) : (
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-slate-500">למחוק?</span>
              <button
                onClick={clearChat}
                className="text-xs px-2 py-1 bg-red-500 text-white rounded-md hover:bg-red-600 transition"
              >
                כן
              </button>
              <button
                onClick={() => setClearConfirm(false)}
                className="text-xs px-2 py-1 bg-slate-100 text-slate-600 rounded-md hover:bg-slate-200 transition"
              >
                ביטול
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ── Quick actions ── */}
      <div className="bg-white border-b border-slate-100 px-4 py-2.5 flex gap-2 flex-wrap shrink-0">
        {QUICK_ACTIONS.map((qa) => (
          <button
            key={qa.label}
            onClick={() => send(qa.message)}
            disabled={loading}
            className="text-xs font-medium px-3 py-1.5 bg-slate-100 hover:bg-blue-50 hover:text-blue-700 text-slate-600 rounded-lg transition disabled:opacity-50"
          >
            {qa.label}
          </button>
        ))}
        <a
          href={`/admin/clients/${clientId}/builder`}
          className="text-xs font-medium px-3 py-1.5 bg-slate-100 hover:bg-blue-50 hover:text-blue-700 text-slate-600 rounded-lg transition"
        >
          ✏️ ערוך בbuilder
        </a>
      </div>

      {/* ── Messages ── */}
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto p-4 space-y-4 relative"
      >
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
            <div className={`max-w-[82%] space-y-1.5 flex flex-col ${msg.role === "user" ? "items-end" : "items-start"}`}>

              {/* ── Error bubble ── */}
              {msg.isError ? (
                <div className="px-4 py-3 rounded-2xl rounded-tl-sm bg-red-50 border border-red-200 text-red-700 text-sm space-y-2">
                  <div className="flex items-center gap-2 font-medium">
                    <AlertCircle size={14} className="shrink-0" />
                    משהו השתבש — נסה שוב
                  </div>
                  <p className="text-xs text-red-500 opacity-80">{msg.content}</p>
                  {msg.retryText && (
                    <button
                      onClick={() => send(msg.retryText, msg.retryText)}
                      disabled={loading}
                      className="flex items-center gap-1.5 text-xs font-medium text-red-600 hover:text-red-700 bg-red-100 hover:bg-red-200 px-2.5 py-1 rounded-lg transition disabled:opacity-50"
                    >
                      <RotateCcw size={11} />
                      נסה שוב
                    </button>
                  )}
                </div>

              /* ── Loading bubble (thinking dots) ── */
              ) : msg.isStreaming && msg.content === "" ? (
                <div className="px-4 py-2 rounded-2xl rounded-tl-sm bg-white border border-slate-200 shadow-sm">
                  <ThinkingDots />
                </div>

              /* ── Normal / streaming bubble ── */
              ) : (
                <div
                  className={`px-4 py-3 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap break-words ${
                    msg.role === "user"
                      ? "bg-blue-600 text-white rounded-tr-sm"
                      : `bg-white border border-slate-200 text-slate-800 rounded-tl-sm shadow-sm${msg.isStreaming ? " ai-cursor" : ""}`
                  }`}
                >
                  {msg.content || (msg.isStreaming ? "\u200b" : "...")}
                </div>
              )}

              {/* ── Action badge (fades after 5s) ── */}
              {msg.action && msg.action !== "NONE" && (
                <ActionBadge action={msg.action} />
              )}

              {/* ── Suggestion chips ── */}
              {msg.suggestions?.length ? (
                <div className="flex flex-wrap gap-1.5 mt-0.5">
                  {msg.suggestions.map((s, si) => (
                    <button
                      key={si}
                      onClick={() => send(s)}
                      disabled={loading}
                      className="text-xs px-2.5 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg border border-blue-100 transition disabled:opacity-50"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              ) : null}

              {/* ── Timestamp ── */}
              <span className="text-[10px] text-slate-400 px-1">
                {formatTime(msg.timestamp)}
              </span>
            </div>
          </div>
        ))}

        {/* Loading state before first stream chunk */}
        {loadState === "loading" && (
          <div className="flex justify-start">
            <div className="px-4 py-2 rounded-2xl rounded-tl-sm bg-white border border-slate-200 shadow-sm">
              <ThinkingDots />
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* ── Scroll-to-bottom button ── */}
      {showNewMsg && (
        <div className="absolute bottom-24 left-1/2 -translate-x-1/2 z-10">
          <button
            onClick={() => {
              userScrolled.current = false;
              bottomRef.current?.scrollIntoView({ behavior: "smooth" });
              setShowNewMsg(false);
            }}
            className="flex items-center gap-1.5 text-xs font-medium bg-blue-600 text-white px-3 py-1.5 rounded-full shadow-lg hover:bg-blue-700 transition"
          >
            <ChevronDown size={13} />
            הודעות חדשות
          </button>
        </div>
      )}

      {/* ── Input ── */}
      <div className="bg-white border-t border-slate-100 p-3 shrink-0">
        <div className="flex items-end gap-2">
          <div className="flex-1 relative">
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value.slice(0, MAX_CHARS))}
              onKeyDown={handleKey}
              placeholder="ספר לי מה לשנות בדף שלך..."
              rows={1}
              disabled={loading}
              className={`w-full resize-none border rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-300 outline-none disabled:opacity-60 leading-relaxed transition ${
                overLimit ? "border-red-300 focus:ring-red-200" : "border-slate-200"
              }`}
              style={{ maxHeight: "96px", overflowY: "auto" }}
            />
            {/* Character counter */}
            {charCount > 400 && (
              <span className={`absolute bottom-2 left-3 text-[10px] ${overLimit ? "text-red-500" : "text-slate-400"}`}>
                {charCount}/{MAX_CHARS}
              </span>
            )}
          </div>
          <button
            onClick={() => send()}
            disabled={loading || !input.trim() || overLimit}
            className="shrink-0 w-10 h-10 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl flex items-center justify-center transition"
          >
            {loading ? (
              <span style={{ display: "flex", gap: "3px" }}>
                {[0,1,2].map(i => (
                  <span key={i} style={{
                    width:5, height:5, borderRadius:"50%", background:"white",
                    animation:`ai-bounce 1.4s ease-in-out ${i*0.2}s infinite`,
                  }}/>
                ))}
              </span>
            ) : (
              <Send size={15} />
            )}
          </button>
        </div>
        <p className="text-[11px] text-slate-400 mt-1.5 text-center">
          {loading ? "מחשב..." : "⌘+Enter לשליחה · Shift+Enter לשורה חדשה"}
        </p>
      </div>
    </div>
  );
}

// ─── With preview wrapper ──────────────────────────────────────────────────────
export function ClientAiAgentWithPreview(props: Props) {
  const [pendingSuggestion, setPendingSuggestion] = useState<string | null>(null);

  return (
    <div className="space-y-4">
      <AiSuggestionsBar
        clientId={props.clientId}
        onSuggestionClick={(text) => setPendingSuggestion(text)}
      />
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <ClientAiAgent
          {...props}
          initialMessage={pendingSuggestion ?? undefined}
          onInitialMessageConsumed={() => setPendingSuggestion(null)}
        />
        {/* Mini preview */}
        <div className="hidden xl:flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-slate-600">תצוגה מקדימה</p>
            <button
              onClick={() => window.location.reload()}
              className="flex items-center gap-1 text-xs text-slate-400 hover:text-slate-600"
            >
              <RefreshCw size={11} /> רענן
            </button>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden" style={{ height: 680 }}>
            <div className="relative w-full h-full overflow-hidden">
              <iframe
                src={`/${props.clientSlug}`}
                title="תצוגה מקדימה"
                style={{
                  width: `${100 / 0.6}%`,
                  height: `${100 / 0.6}%`,
                  transform: "scale(0.6)",
                  transformOrigin: "top right",
                  border: "none",
                  pointerEvents: "none",
                }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
