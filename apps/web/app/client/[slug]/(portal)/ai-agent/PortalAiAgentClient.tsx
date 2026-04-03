"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Send, Bot, User, Sparkles, Loader2 } from "lucide-react";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
}

interface Props {
  client: {
    id: string;
    name: string;
    slug: string;
    industry: string | null;
    pagePublished: boolean;
    primaryColor: string;
  };
  stats: {
    totalLeads: number;
    newLeads7d: number;
    leadsThisMonth: number;
    wonLeads: number;
    conversionRate: number;
    pageViews: number;
    topSource: string;
  };
}

const QUICK_ACTIONS = [
  { label: "📊 מה הביצועים שלי?", message: "תראה לי סטטיסטיקות מלאות" },
  { label: "📢 שלח שידור וואצאפ", message: "שלח שידור לכל הלידים שלי" },
  { label: "📋 צור דוח עכשיו", message: "צור לי דוח ביצועים שבועי" },
  { label: "🌐 פרסם את הדף", message: "פרסם את דף הנחיתה שלי" },
  { label: "✍️ שנה כותרת", message: "שנה את הכותרת הראשית של הדף" },
  { label: "🎯 הוסף ליד ידני", message: "הוסף ליד חדש למערכת" },
  { label: "💬 הודעת וואצאפ", message: "כתוב הודעת ברכה ללידים חדשים" },
  { label: "📈 המלצות לשיפור", message: "תן לי 3 המלצות ספציפיות לשיפור" },
];

function buildGreeting(
  clientName: string,
  stats: Props["stats"],
  pagePublished: boolean
): string {
  const lines: string[] = [];
  lines.push(`שלום ${clientName}! 👋`);
  lines.push("אני הסוכן הדיגיטלי שלך — אפשר לשאול אותי כל שאלה על העסק.");
  lines.push("");

  if (!pagePublished) {
    lines.push("⚠️ דף הנחיתה שלך עדיין לא פורסם — כדאי לפרסם כדי להתחיל לקבל לידים.");
  }
  if (stats.newLeads7d > 0) {
    lines.push(`🎯 הגיעו ${stats.newLeads7d} לידים חדשים ב-7 ימים האחרונים!`);
  }
  if (stats.totalLeads > 0 && stats.conversionRate < 5 && stats.pageViews > 20) {
    lines.push(`📊 אחוז ההמרה שלך (${stats.conversionRate}%) נמוך — אני יכול לעזור לשפר.`);
  }
  if (stats.totalLeads === 0 && pagePublished) {
    lines.push("🔍 עדיין אין לידים — בוא נבדוק מה אפשר לעשות.");
  }

  if (stats.totalLeads > 0) {
    lines.push("");
    lines.push(`📈 סה"כ: ${stats.totalLeads} לידים | ${stats.wonLeads} נסגרו | ${stats.conversionRate}% המרה`);
  }

  lines.push("");
  lines.push("איך אוכל לעזור?");

  return lines.join("\n");
}

export function PortalAiAgentClient({ client, stats }: Props) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [history, setHistory] = useState<{ role: "user" | "assistant"; content: string }[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const greeting = buildGreeting(client.name, stats, client.pagePublished);
    setMessages([{ id: "greeting", role: "assistant", content: greeting }]);
  }, [client.name, stats, client.pagePublished]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = useCallback(
    async (text?: string) => {
      const msg = (text ?? input).trim();
      if (!msg || loading) return;
      setInput("");

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
            clientId: client.id,
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
              const parsed = JSON.parse(data) as { content?: string; done?: boolean; parsed?: { message?: string } };
              if (parsed.content) {
                fullText += parsed.content;
                setMessages((prev) =>
                  prev.map((m) => (m.id === assistantId ? { ...m, content: fullText } : m))
                );
              }
              if (parsed.done && parsed.parsed?.message) {
                fullText = parsed.parsed.message;
                setMessages((prev) =>
                  prev.map((m) => (m.id === assistantId ? { ...m, content: fullText } : m))
                );
              }
            } catch {
              // partial JSON — ignore
            }
          }
        }

        setHistory([...newHistory, { role: "assistant" as const, content: fullText }].slice(-8));
      } catch {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantId
              ? { ...m, content: "שגיאה בתקשורת עם השרת. נסה שוב." }
              : m
          )
        );
      } finally {
        setLoading(false);
        inputRef.current?.focus();
      }
    },
    [input, loading, history, client.id]
  );

  return (
    <div className="flex flex-col h-[calc(100vh-80px)] bg-gray-50" dir="rtl">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-5 py-4">
        <div className="flex items-center gap-3">
          <div
            className="w-11 h-11 rounded-full flex items-center justify-center shadow-md"
            style={{ background: `linear-gradient(135deg, ${client.primaryColor}, #8b5cf6)` }}
          >
            <Bot size={22} className="text-white" />
          </div>
          <div>
            <h1 className="font-bold text-gray-900 text-base">הסוכן הדיגיטלי שלי</h1>
            <div className="flex items-center gap-1.5 text-xs text-green-600">
              <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
              מחובר ופעיל
            </div>
          </div>
        </div>

        {/* Stats bar */}
        <div className="flex flex-wrap gap-x-5 gap-y-1 mt-3 text-xs text-gray-500">
          <span>🎯 {stats.totalLeads} לידים</span>
          <span>📊 {stats.conversionRate}% המרה</span>
          <span>👁 {stats.pageViews} צפיות</span>
          <span>📍 מקור מוביל: {stats.topSource}</span>
          <span className={client.pagePublished ? "text-green-600" : "text-red-500"}>
            {client.pagePublished ? "✅ דף פורסם" : "⚠️ דף לא פורסם"}
          </span>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${msg.role === "user" ? "justify-start" : "justify-end"}`}
          >
            <div className="flex items-end gap-2 max-w-[80%]">
              {msg.role === "user" && (
                <div className="w-7 h-7 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0">
                  <User size={14} className="text-gray-600" />
                </div>
              )}
              <div
                className={`rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap shadow-sm ${
                  msg.role === "user"
                    ? "bg-indigo-600 text-white rounded-br-sm"
                    : "bg-white text-gray-800 border border-gray-100 rounded-bl-sm"
                }`}
              >
                {msg.content || (
                  <div className="flex items-center gap-2 text-gray-400">
                    <Loader2 size={14} className="animate-spin" />
                    <span>חושב...</span>
                  </div>
                )}
              </div>
              {msg.role === "assistant" && (
                <div
                  className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0"
                  style={{ background: client.primaryColor }}
                >
                  <Sparkles size={13} className="text-white" />
                </div>
              )}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Quick actions */}
      <div className="bg-white border-t border-gray-100 px-4 py-2.5 flex gap-2 overflow-x-auto scrollbar-hide">
        {QUICK_ACTIONS.map((action) => (
          <button
            key={action.label}
            onClick={() => sendMessage(action.message)}
            disabled={loading}
            className="flex-shrink-0 bg-gray-50 hover:bg-indigo-50 hover:text-indigo-700 hover:border-indigo-200 border border-gray-200 rounded-full px-3.5 py-1.5 text-xs text-gray-600 transition-all disabled:opacity-50"
          >
            {action.label}
          </button>
        ))}
      </div>

      {/* Input */}
      <div className="bg-white border-t border-gray-200 px-4 py-3 flex items-center gap-2">
        <input
          ref={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              sendMessage();
            }
          }}
          placeholder="שאל אותי כל שאלה..."
          disabled={loading}
          className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 outline-none focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100 transition-all disabled:opacity-60"
        />
        <button
          onClick={() => sendMessage()}
          disabled={!input.trim() || loading}
          className="flex items-center justify-center w-10 h-10 rounded-xl transition-all disabled:opacity-40"
          style={{
            background: input.trim() && !loading ? client.primaryColor : "#e5e7eb",
            color: input.trim() && !loading ? "white" : "#9ca3af",
          }}
        >
          {loading ? (
            <Loader2 size={16} className="animate-spin" />
          ) : (
            <Send size={16} className="rotate-180" />
          )}
        </button>
      </div>
    </div>
  );
}
