"use client";

import { useState, useRef, useEffect } from "react";
import { MessageCircle, X, Send } from "lucide-react";

interface ChatMessage {
  role: "user" | "bot";
  text: string;
}

interface ChatbotWidgetProps {
  clientSlug: string;
  greeting?: string;
}

export function ChatbotWidget({ clientSlug, greeting }: ChatbotWidgetProps) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [sessionId] = useState(() => `session-${Date.now()}-${Math.random().toString(36).slice(2)}`);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Show greeting when chat opens for the first time
  useEffect(() => {
    if (open && messages.length === 0) {
      const greetingMsg = greeting || "שלום! איך אוכל לעזור?";
      setMessages([{ role: "bot", text: greetingMsg }]);
    }
  }, [open, messages.length, greeting]);

  useEffect(() => {
    if (open) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [open, messages]);

  const sendMessage = async () => {
    if (!input.trim() || loading) return;
    const msg = input.trim();
    setInput("");
    setMessages((prev) => [...prev, { role: "user", text: msg }]);
    setLoading(true);
    try {
      const res = await fetch("/api/chatbot/message", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clientSlug, message: msg, sessionId }),
      });
      const data = await res.json();
      setMessages((prev) => [
        ...prev,
        { role: "bot", text: data.reply ?? "תודה על פנייתך!" },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "bot", text: "מצטערים, אירעה שגיאה. נסה שוב." },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed bottom-5 left-5 z-50 flex flex-col items-end"
      dir="rtl"
      style={{ fontFamily: "inherit" }}
    >
      {/* Chat panel */}
      <div
        className={`mb-3 w-[300px] bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col transition-all duration-300 origin-bottom-left ${
          open
            ? "opacity-100 scale-100 translate-y-0"
            : "opacity-0 scale-95 translate-y-4 pointer-events-none"
        }`}
        style={{ maxHeight: "440px", height: open ? "440px" : 0 }}
      >
        {/* Header */}
        <div className="bg-slate-900 px-4 py-3 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-400 rounded-full" />
            <span className="text-white text-sm font-medium">צ׳אטבוט</span>
          </div>
          <button
            onClick={() => setOpen(false)}
            className="text-slate-400 hover:text-white transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2.5 bg-slate-50">
          {messages.map((msg, i) => (
            <div
              key={i}
              className={`flex ${msg.role === "user" ? "justify-start" : "justify-end"}`}
            >
              <div
                className={`max-w-[220px] px-3 py-2 rounded-2xl text-sm leading-relaxed ${
                  msg.role === "user"
                    ? "bg-slate-900 text-white rounded-bl-sm"
                    : "bg-white border border-slate-200 text-slate-800 rounded-br-sm shadow-sm"
                }`}
              >
                {msg.text}
              </div>
            </div>
          ))}

          {/* Typing indicator */}
          {loading && (
            <div className="flex justify-end">
              <div className="bg-white border border-slate-200 rounded-2xl rounded-br-sm px-3 py-2.5 shadow-sm">
                <div className="flex gap-1 items-center">
                  <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:0ms]" />
                  <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:150ms]" />
                  <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:300ms]" />
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="border-t border-slate-100 bg-white px-3 py-2.5 flex gap-2 flex-shrink-0">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && sendMessage()}
            placeholder="כתוב הודעה..."
            disabled={loading}
            className="flex-1 text-sm px-3 py-1.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 disabled:opacity-50"
          />
          <button
            onClick={sendMessage}
            disabled={loading || !input.trim()}
            className="p-1.5 bg-slate-900 text-white rounded-lg hover:bg-slate-700 disabled:opacity-40 transition-colors"
          >
            <Send size={14} />
          </button>
        </div>

        {/* Footer badge */}
        <div className="bg-slate-50 border-t border-slate-100 text-center py-1.5">
          <span className="text-[10px] text-slate-400">מופעל על ידי AI</span>
        </div>
      </div>

      {/* Toggle button */}
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 px-4 py-3 bg-slate-900 text-white rounded-full shadow-lg hover:bg-slate-700 transition-colors"
      >
        {open ? <X size={18} /> : <MessageCircle size={18} />}
        <span className="text-sm font-medium">צ׳אט</span>
      </button>
    </div>
  );
}
