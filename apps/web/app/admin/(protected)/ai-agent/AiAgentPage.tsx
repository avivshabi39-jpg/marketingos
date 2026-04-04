"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Loader2, Send, Bot, User } from "lucide-react";

interface Client {
  id: string;
  name: string;
  industry: string | null;
  pagePublished: boolean;
}

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  action?: string;
}

const SUGGESTED_ACTIONS = [
  {
    category: "📊 דוחות וניתוח",
    items: [
      { label: "דוח ביצועים שבועי", msg: "צור לי דוח ביצועים שבועי לכל הלקוחות" },
      { label: "לידים חמים היום", msg: "אילו לידים הכי חמים היום ולמה?" },
      { label: "השווה לקוחות", msg: "השווה ביצועים בין כל הלקוחות שלי" },
      { label: "ניתוח המרות", msg: "ניתח את אחוזי ההמרה ותן המלצות" },
    ],
  },
  {
    category: "🌐 דפי נחיתה",
    items: [
      { label: "בנה דף ללקוח", msg: "בנה דף נחיתה מקצועי ללקוח" },
      { label: "שפר כותרת", msg: "שפר את הכותרת של דף הנחיתה" },
      { label: "A/B testing", msg: "צור גרסת A/B לדף של הלקוח" },
      { label: "פרסם דף", msg: "פרסם את דף הנחיתה של הלקוח" },
    ],
  },
  {
    category: "📱 שיווק וסושיאל",
    items: [
      { label: "פוסט לפייסבוק", msg: "כתוב פוסט שיווקי לפייסבוק" },
      { label: "הודעת וואצאפ", msg: "כתוב הודעת שידור וואצאפ" },
      { label: "שלח שידור", msg: "שלח שידור וואצאפ לכל הלידים" },
      { label: "קמפיין שיווקי", msg: "תכנן קמפיין שיווקי מלא" },
    ],
  },
  {
    category: "🎯 לידים ו-CRM",
    items: [
      { label: "הוסף ליד", msg: "הוסף ליד חדש: שם ומספר טלפון" },
      { label: "לידים ללא מענה", msg: "מי הלידים שלא חזרו אליהם יותר מ-3 ימים?" },
      { label: "עדכן סטטוסים", msg: "עדכן את סטטוס הלידים החמים" },
      { label: "ייצא לאקסל", msg: "ייצא את כל הלידים לאקסל" },
    ],
  },
  {
    category: "⚙️ אוטומציות",
    items: [
      { label: "Auto-reply וואצאפ", msg: "הגדר תגובה אוטומטית לוואצאפ" },
      { label: "רצף מיילים", msg: "צור רצף מיילים אוטומטי" },
      { label: "דוח שבועי אוטו", msg: "הגדר דוח שבועי אוטומטי" },
      { label: "ציון לידים", msg: "עדכן את מודל ציון הלידים" },
    ],
  },
  {
    category: '🏡 נדל"ן',
    items: [
      { label: "הוסף נכס", msg: "הוסף נכס חדש: כתובת, מחיר, חדרים" },
      { label: "שלח התראות", msg: "שלח התראות לקונים מתאימים" },
      { label: "יומן שיווק", msg: "עדכן יומן שיווק לנכס" },
      { label: "דוח נדל\"ן", msg: "צור דוח ביצועים לסוכן" },
    ],
  },
];

const QUICK_STARTS = [
  "בנה דף נחיתה ללקוח שלי",
  "מה הלידים החמים היום?",
  "שלח שידור וואצאפ",
  "צור דוח שבועי",
];

export function AiAgentPage({ clients }: { clients: Client[] }) {
  const [selectedClientId, setSelectedClientId] = useState(clients[0]?.id ?? "");
  const [messages, setMessages] = useState<Message[]>([]);
  const [history, setHistory] = useState<{ role: "user" | "assistant"; content: string }[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = useCallback(
    async (text?: string) => {
      const msg = (text ?? input).trim();
      if (!msg || loading) return;
      setInput("");
      if (inputRef.current) { inputRef.current.style.height = "auto"; }

      const userMsg: Message = { id: `u-${Date.now()}`, role: "user", content: msg };
      const aId = `a-${Date.now()}`;
      const assistantMsg: Message = { id: aId, role: "assistant", content: "" };
      setMessages((p) => [...p, userMsg, assistantMsg]);
      setLoading(true);

      const newHistory = [...history, { role: "user" as const, content: msg }].slice(-8);

      try {
        const res = await fetch("/api/ai/agent/stream", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            clientId: selectedClientId,
            message: msg,
            conversationHistory: newHistory,
          }),
        });

        if (!res.ok) {
          const errText = await res.text();
          setMessages((p) => p.map((m) => (m.id === aId ? { ...m, content: errText || "שגיאה — נסה שוב" } : m)));
          setLoading(false);
          return;
        }

        const reader = res.body?.getReader();
        if (!reader) throw new Error("No reader");
        const decoder = new TextDecoder();
        let fullText = "";
        let action = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          const chunk = decoder.decode(value);
          for (const line of chunk.split("\n")) {
            if (!line.startsWith("data: ")) continue;
            const data = line.slice(6);
            if (data === "[DONE]") continue;
            try {
              const parsed = JSON.parse(data) as { chunk?: string; done?: boolean; parsed?: { message?: string; action?: string } };
              if (parsed.chunk) {
                fullText += parsed.chunk;
                setMessages((p) => p.map((m) => (m.id === aId ? { ...m, content: fullText } : m)));
              }
              if (parsed.done && parsed.parsed) {
                if (parsed.parsed.message) fullText = parsed.parsed.message;
                action = parsed.parsed.action ?? "";
                setMessages((p) => p.map((m) => (m.id === aId ? { ...m, content: fullText, action } : m)));
              }
            } catch { /* partial */ }
          }
        }

        setHistory([...newHistory, { role: "assistant" as const, content: fullText }].slice(-8));
      } catch {
        setMessages((p) => p.map((m) => (m.id === aId ? { ...m, content: "שגיאת חיבור — נסה שוב" } : m)));
      } finally {
        setLoading(false);
        inputRef.current?.focus();
      }
    },
    [input, loading, history, selectedClientId]
  );

  return (
    <div className="flex h-[calc(100vh-64px)]" dir="rtl">
      {/* Sidebar */}
      <div className="hidden lg:block w-[280px] bg-white border-l border-gray-200 overflow-y-auto flex-shrink-0">
        <div className="p-4">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">💡 פעולות מהירות</p>
          {SUGGESTED_ACTIONS.map((cat) => (
            <div key={cat.category} className="mb-4">
              <p className="text-xs font-semibold text-gray-700 mb-1.5">{cat.category}</p>
              {cat.items.map((item) => (
                <button
                  key={item.label}
                  onClick={() => sendMessage(item.msg)}
                  className="w-full text-right px-2.5 py-1.5 mb-0.5 text-xs text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg border border-transparent hover:border-indigo-200 transition-all"
                >
                  {item.label}
                </button>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* Main chat */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 px-5 py-3 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center">
              <Bot size={20} className="text-white" />
            </div>
            <div>
              <p className="font-bold text-gray-900 text-sm">סוכן AI — MarketingOS</p>
              <p className="text-xs text-green-600 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" /> פעיל ומוכן
              </p>
            </div>
          </div>
          <select
            value={selectedClientId}
            onChange={(e) => setSelectedClientId(e.target.value)}
            className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm bg-white focus:ring-2 focus:ring-indigo-200 outline-none"
          >
            <option value="">כל הלקוחות</option>
            {clients.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-5 py-6 space-y-4">
          {messages.length === 0 && (
            <div className="text-center py-16">
              <div className="text-6xl mb-4">🤖</div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">שלום! אני הסוכן האישי שלך</h2>
              <p className="text-gray-500 text-sm mb-8 max-w-md mx-auto">
                אני יכול לבנות דפים, לשלוח שידורים, ליצור דוחות, לנהל לידים ועוד.
                <br />בחר לקוח ושאל אותי כל שאלה.
              </p>
              <div className="flex gap-2 justify-center flex-wrap max-w-lg mx-auto">
                {QUICK_STARTS.map((q) => (
                  <button
                    key={q}
                    onClick={() => sendMessage(q)}
                    className="px-4 py-2 bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-full text-xs font-medium hover:bg-indigo-100 transition-colors"
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((msg) => (
            <div key={msg.id} className={`flex gap-3 ${msg.role === "user" ? "justify-start" : "justify-end"}`}>
              {msg.role === "user" && (
                <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0">
                  <User size={14} className="text-gray-600" />
                </div>
              )}
              <div
                className={`max-w-[75%] rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap shadow-sm ${
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
                {msg.action && msg.action !== "NONE" && (
                  <div className="mt-2 text-xs font-semibold text-green-600">
                    ✅ פעולה בוצעה: {msg.action}
                  </div>
                )}
              </div>
              {msg.role === "assistant" && (
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center flex-shrink-0">
                  <Bot size={14} className="text-white" />
                </div>
              )}
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="bg-white border-t border-gray-200 px-5 py-3 flex-shrink-0">
          <div className="flex gap-3 items-end">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  sendMessage();
                }
              }}
              onInput={(e) => {
                const el = e.currentTarget;
                el.style.height = "auto";
                el.style.height = Math.min(el.scrollHeight, 120) + "px";
              }}
              placeholder="שאל אותי כל שאלה או בקש ממני לבצע פעולה..."
              rows={1}
              disabled={loading}
              className="flex-1 border border-gray-200 rounded-xl px-4 py-3 text-sm resize-none outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400 transition-all disabled:opacity-60"
              style={{ maxHeight: "120px" }}
            />
            <button
              onClick={() => sendMessage()}
              disabled={!input.trim() || loading}
              className="flex items-center justify-center w-11 h-11 rounded-xl transition-all disabled:opacity-40 flex-shrink-0"
              style={{
                background: input.trim() && !loading ? "#6366f1" : "#e5e7eb",
                color: input.trim() && !loading ? "white" : "#9ca3af",
              }}
            >
              {loading ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} className="rotate-180" />}
            </button>
          </div>
          <p className="text-[10px] text-gray-400 mt-1.5 text-center">
            Enter לשליחה · Shift+Enter לשורה חדשה · בחר לקוח למעלה לפעולות ספציפיות
          </p>
        </div>
      </div>
    </div>
  );
}
