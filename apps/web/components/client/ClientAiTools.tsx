"use client";

import { useState } from "react";
import { Sparkles, Loader2, Copy, Check } from "lucide-react";

interface Props {
  clientName: string;
  industry: string;
}

type Tool = "social-post" | "followup";

interface AiResult {
  text: string;
  tool: Tool;
}

function CopyBtn({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  function handleCopy() {
    navigator.clipboard.writeText(text).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }
  return (
    <button
      onClick={handleCopy}
      className="flex items-center gap-1 text-xs text-gray-400 hover:text-indigo-600 transition-colors"
    >
      {copied ? <><Check size={11} /> הועתק!</> : <><Copy size={11} /> העתק</>}
    </button>
  );
}

export function ClientAiTools({ clientName, industry }: Props) {
  const [loading, setLoading] = useState<Tool | null>(null);
  const [result, setResult] = useState<AiResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleSocialPost() {
    setLoading("social-post");
    setError(null);
    setResult(null);
    try {
      const res = await fetch("/api/ai/social-post", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clientName, industry }),
      });
      const data = await res.json() as { post?: string; error?: string };
      if (!res.ok) { setError(data.error ?? "שגיאה ביצירת תוכן, נסה שוב"); return; }
      setResult({ text: data.post ?? "", tool: "social-post" });
    } finally {
      setLoading(null);
    }
  }

  async function handleFollowup() {
    setLoading("followup");
    setError(null);
    setResult(null);
    try {
      const res = await fetch("/api/ai/followup-message", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ leadName: "הלקוח", service: industry, daysSinceContact: 3 }),
      });
      const data = await res.json() as { message?: string; error?: string };
      if (!res.ok) { setError(data.error ?? "שגיאה ביצירת תוכן, נסה שוב"); return; }
      setResult({ text: data.message ?? "", tool: "followup" });
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6" dir="rtl">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center">
          <Sparkles size={16} className="text-indigo-500" />
        </div>
        <div>
          <h2 className="font-semibold text-gray-900">✨ כלי AI</h2>
          <p className="text-xs text-gray-400">צור תוכן שיווקי בלחיצה אחת</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-3 mb-4">
        <button
          onClick={handleSocialPost}
          disabled={loading !== null}
          className="flex items-center gap-1.5 text-sm font-medium px-4 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 rounded-lg transition-colors disabled:opacity-60"
        >
          {loading === "social-post"
            ? <><Loader2 size={13} className="animate-spin" /> יוצר פוסט...</>
            : <><Sparkles size={13} /> צור תוכן לפוסט פייסבוק</>
          }
        </button>

        <button
          onClick={handleFollowup}
          disabled={loading !== null}
          className="flex items-center gap-1.5 text-sm font-medium px-4 py-2 bg-purple-50 hover:bg-purple-100 text-purple-600 rounded-lg transition-colors disabled:opacity-60"
        >
          {loading === "followup"
            ? <><Loader2 size={13} className="animate-spin" /> יוצר הודעה...</>
            : <><Sparkles size={13} /> צור הודעת פולו-אפ</>
          }
        </button>
      </div>

      {error && (
        <p className="text-xs text-red-500 bg-red-50 rounded-lg px-3 py-2">{error}</p>
      )}

      {result && (
        <div className="bg-gray-50 rounded-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-gray-500">
              {result.tool === "social-post" ? "פוסט לפייסבוק" : "הודעת פולו-אפ"}
            </span>
            <CopyBtn text={result.text} />
          </div>
          <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">{result.text}</p>
          <button
            onClick={result.tool === "social-post" ? handleSocialPost : handleFollowup}
            disabled={loading !== null}
            className="mt-3 text-xs text-gray-400 hover:text-indigo-600 disabled:opacity-50"
          >
            {loading ? "יוצר..." : "↺ צור מחדש"}
          </button>
        </div>
      )}
    </div>
  );
}
