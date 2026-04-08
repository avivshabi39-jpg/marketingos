"use client";

import { useState, useRef, useEffect } from "react";
import { Wand2, Loader2, Send, ExternalLink, CheckCircle2 } from "lucide-react";

type Message = {
  role: "user" | "assistant";
  content: string;
  action?: string;
  suggestions?: string[];
};

const ACTION_LABELS: Record<string, string> = {
  BUILD_PAGE:      "בניתי דף נחיתה חדש",
  UPDATE_HERO:     "עדכנתי את כותרת הגיבור",
  UPDATE_COLOR:    "שיניתי את הצבע",
  ADD_BLOCK:       "הוספתי בלוק חדש",
  CHANGE_CTA:      "שיניתי את כפתור הקריאה לפעולה",
  UPDATE_FEATURES: "עדכנתי את היתרונות",
  PUBLISH:         "פרסמתי את הדף",
};

const RE_QUICK = [
  "עדכן את תיאור הסוכן שלי",
  "שפר את הכותרת הראשית",
  "הוסף בלוק נכסים מומלצים",
];
const GENERAL_QUICK = [
  "שפר את הכותרת הראשית",
  "שנה את הצבע לכחול",
  "הוסף בלוק המלצות לקוחות",
];

interface Props {
  clientId: string;
  clientSlug: string;
  clientName: string;
  industry: string | null;
}

export function ClientPageAgent({ clientId, clientSlug, clientName, industry }: Props) {
  const isRealEstate = industry === "REAL_ESTATE";
  const quickSuggestions = isRealEstate ? RE_QUICK : GENERAL_QUICK;

  const greeting = isRealEstate
    ? `שלום ${clientName}! אני הסוכן האישי שלך לבניית האתר. רוצה לעדכן את הפרופיל שלך, להוסיף נכס, או לשפר את הכותרת?`
    : `שלום ${clientName}! אני כאן כדי לשפר את דף הנחיתה שלך. מה תרצה לשנות?`;

  const [messages, setMessages] = useState<Message[]>([{
    role: "assistant",
    content: greeting,
    suggestions: quickSuggestions,
  }]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function send(text?: string) {
    const msg = (text ?? input).trim();
    if (!msg || loading) return;
    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: msg }]);
    setLoading(true);

    const history = messages.map((m) => ({ role: m.role, content: m.content }));

    try {
      const res = await fetch("/api/ai/agent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clientId, message: msg, conversationHistory: history }),
      });
      const data = await res.json() as {
        message?: string; action?: string; suggestions?: string[]; error?: string;
      };
      if (!res.ok) {
        setMessages((prev) => [...prev, {
          role: "assistant",
          content: data.error ?? "אירעה שגיאה. נסה שוב.",
        }]);
        return;
      }
      setMessages((prev) => [...prev, {
        role: "assistant",
        content: data.message ?? "בוצע!",
        action: data.action,
        suggestions: data.suggestions,
      }]);
    } catch {
      setMessages((prev) => [...prev, { role: "assistant", content: "שגיאת חיבור. נסה שוב." }]);
    } finally {
      setLoading(false);
    }
  }

  function handleKey(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); }
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden" dir="rtl">
      {/* Header */}
      <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center">
            <Wand2 size={18} className="text-blue-600" />
          </div>
          <div>
            <h2 className="font-semibold text-slate-900">
              {isRealEstate ? "בנה את האתר שלי 🤖" : "הסוכן האישי שלי 🤖"}
            </h2>
            <p className="text-xs text-slate-400">שפר את דף הנחיתה שלך בשניות</p>
          </div>
        </div>
        <a
          href={`/${clientSlug}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 text-xs text-blue-600 hover:text-blue-800 border border-blue-200 rounded-lg px-3 py-1.5 transition"
        >
          <ExternalLink size={12} />
          צפה בדף שלי
        </a>
      </div>

      {/* Chat */}
      <div className="h-72 overflow-y-auto p-4 space-y-3 bg-slate-50">
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
            <div className={`max-w-[85%] space-y-1.5 flex flex-col ${msg.role === "user" ? "items-end" : "items-start"}`}>
              <div
                className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                  msg.role === "user"
                    ? "bg-blue-600 text-white rounded-tr-sm"
                    : "bg-white border border-slate-200 text-slate-800 rounded-tl-sm shadow-sm"
                }`}
              >
                {msg.content}
              </div>
              {msg.action && msg.action !== "NONE" && ACTION_LABELS[msg.action] && (
                <div className="flex items-center gap-1 text-xs text-green-600 font-medium">
                  <CheckCircle2 size={11} />
                  {ACTION_LABELS[msg.action]}
                </div>
              )}
              {msg.suggestions?.length ? (
                <div className="flex flex-wrap gap-1.5">
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
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-white border border-slate-200 rounded-2xl rounded-tl-sm px-4 py-2.5 shadow-sm">
              <div className="flex items-center gap-2 text-slate-400 text-sm">
                <Loader2 size={13} className="animate-spin" />
                חושב...
              </div>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="p-3 bg-white border-t border-slate-100">
        <div className="flex items-end gap-2">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKey}
            placeholder={isRealEstate ? "ספר לי מה לשפר באתר שלך..." : "ספר לי מה לשפר..."}
            rows={2}
            disabled={loading}
            className="flex-1 resize-none border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-300 outline-none disabled:opacity-60 leading-relaxed"
          />
          <button
            onClick={() => send()}
            disabled={loading || !input.trim()}
            className="flex-shrink-0 w-10 h-10 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl flex items-center justify-center transition"
          >
            {loading ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />}
          </button>
        </div>
      </div>
    </div>
  );
}
