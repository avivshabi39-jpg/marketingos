"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Send, Bot, Loader2, Globe, Target, MessageCircle, BarChart3 } from "lucide-react";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  action?: string;
  pendingConfirmation?: boolean;
}

interface Props {
  clientId: string;
  clientName: string;
  slug: string;
  pagePublished: boolean;
  stats: {
    totalLeads: number;
    newLeads7d: number;
    leadsThisMonth: number;
    wonLeads: number;
    conversionRate: number;
  };
}

// ---------------------------------------------------------------------------
// Actions that require user confirmation before AI executes
// ---------------------------------------------------------------------------

const CONFIRM_ACTIONS = new Set(["PUBLISH", "BROADCAST", "BUILD_PAGE"]);

const ACTION_LABELS: Record<string, string> = {
  BUILD_PAGE: "בניתי דף נחיתה חדש",
  UPDATE_HERO: "עדכנתי את הכותרת",
  UPDATE_COLOR: "שיניתי את הצבע",
  UPDATE_TITLE: "עדכנתי את הכותרת",
  ADD_BLOCK: "הוספתי קטע חדש",
  CHANGE_CTA: "שיניתי את כפתור הקריאה לפעולה",
  UPDATE_FEATURES: "עדכנתי את היתרונות",
  PUBLISH: "פרסמתי את הדף",
  CREATE_REPORT: "יצרתי דוח שבועי",
  ADD_LEAD: "הוספתי ליד חדש",
  BROADCAST: "יצרתי שידור",
  GENERATE_POST: "יצרתי טיוטת פוסט",
};

// ---------------------------------------------------------------------------
// Quick actions — the 4 primary buttons
// ---------------------------------------------------------------------------

const PRIMARY_ACTIONS = [
  {
    icon: Globe,
    label: "הדף שלי",
    message: "עזור לי לשפר את דף הנחיתה שלי",
    color: "bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100",
    iconColor: "text-blue-600",
  },
  {
    icon: Target,
    label: "הלידים שלי",
    message: "תראה לי סיכום של הלידים שלי",
    color: "bg-green-50 text-green-700 border-green-200 hover:bg-green-100",
    iconColor: "text-green-600",
  },
  {
    icon: MessageCircle,
    label: "שלח הודעה",
    message: "עזור לי לשלוח הודעת וואצאפ ללידים שלי",
    color: "bg-orange-50 text-orange-700 border-orange-200 hover:bg-orange-100",
    iconColor: "text-orange-600",
  },
  {
    icon: BarChart3,
    label: "איך הולך לי?",
    message: "תן לי סיכום ביצועים של העסק שלי",
    color: "bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-100",
    iconColor: "text-purple-600",
  },
];

// ---------------------------------------------------------------------------
// Greeting builder — dynamic based on client state
// ---------------------------------------------------------------------------

function buildGreeting(name: string, stats: Props["stats"], pagePublished: boolean): string {
  const hour = new Date().getHours();
  const timeGreeting = hour < 12 ? "בוקר טוב" : hour < 17 ? "צהריים טובים" : "ערב טוב";

  const lines: string[] = [];
  lines.push(`${timeGreeting}, ${name}! 👋`);

  if (!pagePublished) {
    lines.push("הדף שלך עדיין לא באוויר — ספר לי על העסק שלך ואני אבנה לך דף תוך דקה.");
  } else if (stats.newLeads7d > 0) {
    lines.push(`הגיעו ${stats.newLeads7d} לידים חדשים השבוע! 🎯`);
    if (stats.conversionRate > 0) {
      lines.push(`שיעור ההמרה שלך: ${stats.conversionRate}%.`);
    }
  } else if (stats.totalLeads === 0) {
    lines.push("הדף שלך באוויר — שתף את הקישור כדי להתחיל לקבל לידים.");
  } else {
    lines.push(`סה"כ ${stats.totalLeads} לידים, ${stats.wonLeads} נסגרו.`);
  }

  lines.push("איך אפשר לעזור?");
  return lines.join("\n");
}

// ---------------------------------------------------------------------------
// Simple markdown formatter (same as PortalAiAgentClient)
// ---------------------------------------------------------------------------

function formatMessage(text: string) {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
    .replace(/^## (.*)/gm, '<h3 class="font-extrabold mt-3 mb-1 text-[15px]">$1</h3>')
    .replace(/^### (.*)/gm, '<h4 class="font-bold mt-2 mb-1 text-sm">$1</h4>')
    .replace(/^- (.*)/gm, '<div class="mr-3 my-0.5">• $1</div>')
    .replace(/^(\d+)\. (.*)/gm, '<div class="mr-3 my-0.5"><strong>$1.</strong> $2</div>')
    .replace(/\n\n/g, "<br/><br/>")
    .replace(/\n/g, "<br/>");
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function DashboardAiSection({ clientId, clientName, slug, pagePublished, stats }: Props) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [history, setHistory] = useState<{ role: "user" | "assistant"; content: string }[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Initialize greeting
  useEffect(() => {
    const greeting = buildGreeting(clientName, stats, pagePublished);
    setMessages([{ id: "greeting", role: "assistant", content: greeting }]);
  }, [clientName, stats, pagePublished]);

  // Auto-scroll when new messages arrive
  useEffect(() => {
    if (expanded) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, expanded]);

  const sendMessage = useCallback(
    async (text?: string) => {
      const msg = (text ?? input).trim();
      if (!msg || loading) return;
      setInput("");
      setExpanded(true);

      const userMsg: Message = { id: `u-${Date.now()}`, role: "user", content: msg };
      const assistantId = `a-${Date.now()}`;
      const assistantMsg: Message = { id: assistantId, role: "assistant", content: "" };

      setMessages((prev) => [...prev, userMsg, assistantMsg]);
      setLoading(true);

      const newHistory = [...history, { role: "user" as const, content: msg }].slice(-8);

      try {
        const res = await fetch("/api/ai/agent/stream", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            clientId,
            message: msg,
            conversationHistory: newHistory,
          }),
        });

        if (!res.ok) {
          const errText = await res.text();
          setMessages((prev) =>
            prev.map((m) =>
              m.id === assistantId ? { ...m, content: errText || "שגיאה — נסה שוב" } : m
            )
          );
          setLoading(false);
          return;
        }

        const reader = res.body?.getReader();
        if (!reader) throw new Error("No reader");
        const decoder = new TextDecoder();
        let fullText = "";
        let detectedAction = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          const chunk = decoder.decode(value);
          const lines = chunk.split("\n");
          for (const line of lines) {
            if (!line.startsWith("data: ")) continue;
            const data = line.slice(6);
            if (data === "[DONE]") continue;
            try {
              const parsed = JSON.parse(data) as {
                content?: string;
                done?: boolean;
                parsed?: { message?: string; action?: string };
              };
              if (parsed.content) {
                fullText += parsed.content;
                setMessages((prev) =>
                  prev.map((m) => (m.id === assistantId ? { ...m, content: fullText } : m))
                );
              }
              if (parsed.done && parsed.parsed?.message) {
                fullText = parsed.parsed.message;
                detectedAction = parsed.parsed.action ?? "";
                setMessages((prev) =>
                  prev.map((m) =>
                    m.id === assistantId
                      ? { ...m, content: fullText, action: detectedAction || undefined }
                      : m
                  )
                );
              }
            } catch {
              // partial JSON — skip
            }
          }
        }

        setHistory([...newHistory, { role: "assistant" as const, content: fullText }].slice(-8));
      } catch {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantId
              ? { ...m, content: "שגיאה בתקשורת. נסה שוב." }
              : m
          )
        );
      } finally {
        setLoading(false);
        inputRef.current?.focus();
      }
    },
    [input, loading, history, clientId]
  );

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      {/* ── Header with Michael's identity ── */}
      <div className="bg-gradient-to-l from-slate-900 to-slate-800 px-6 py-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center flex-shrink-0">
            <Bot size={20} className="text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h2 className="text-white font-bold text-lg">מיכאל</h2>
              <div className="flex items-center gap-1 bg-green-500/20 rounded-full px-2 py-0.5">
                <div className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
                <span className="text-[10px] text-green-300 font-medium">מוכן</span>
              </div>
            </div>
            <p className="text-slate-400 text-xs">היועץ השיווקי שלך</p>
          </div>
          {expanded && (
            <button
              onClick={() => setExpanded(false)}
              className="text-slate-400 hover:text-white text-xs transition-colors"
            >
              מזער ↑
            </button>
          )}
        </div>
      </div>

      {/* ── Messages area (expandable) ── */}
      <div
        className={`overflow-y-auto transition-all duration-300 ${
          expanded ? "max-h-[400px]" : "max-h-[120px]"
        }`}
      >
        <div className="px-5 py-4 space-y-3">
          {messages.map((msg) => (
            <div key={msg.id}>
              {msg.role === "assistant" ? (
                <div className="flex gap-2.5">
                  <div className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Bot size={14} className="text-slate-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    {msg.content ? (
                      <div
                        className="text-sm text-slate-700 leading-relaxed"
                        dangerouslySetInnerHTML={{ __html: formatMessage(msg.content) }}
                      />
                    ) : (
                      <div className="flex items-center gap-1.5 text-slate-400 text-sm">
                        <Loader2 size={14} className="animate-spin" />
                        <span>מיכאל חושב...</span>
                      </div>
                    )}
                    {/* Action badge */}
                    {msg.action && msg.action !== "NONE" && ACTION_LABELS[msg.action] && (
                      <div className="mt-2 inline-flex items-center gap-1.5 bg-green-50 text-green-700 text-xs font-medium px-3 py-1.5 rounded-lg border border-green-200">
                        ✅ {ACTION_LABELS[msg.action]}
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="flex justify-start">
                  <div className="bg-blue-600 text-white text-sm px-4 py-2.5 rounded-2xl rounded-br-sm max-w-[85%]">
                    {msg.content}
                  </div>
                </div>
              )}
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* ── Input bar ── */}
      <div className="border-t border-slate-100 px-4 py-3">
        <div className="flex items-center gap-2">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={() => setExpanded(true)}
            placeholder="שאל את מיכאל..."
            disabled={loading}
            className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent disabled:opacity-50"
          />
          <button
            onClick={() => sendMessage()}
            disabled={loading || !input.trim()}
            className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center hover:bg-blue-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex-shrink-0"
          >
            {loading ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
          </button>
        </div>
      </div>

      {/* ── 4 Primary Action Buttons ── */}
      <div className="border-t border-slate-100 px-4 py-3 grid grid-cols-2 sm:grid-cols-4 gap-2">
        {PRIMARY_ACTIONS.map((action) => (
          <button
            key={action.label}
            onClick={() => sendMessage(action.message)}
            disabled={loading}
            className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border text-xs font-medium transition-colors disabled:opacity-50 ${action.color}`}
          >
            <action.icon size={15} className={action.iconColor} />
            <span>{action.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
