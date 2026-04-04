"use client";

import { useState } from "react";
import Link from "next/link";

interface Block {
  id: string;
  type: string;
  content: Record<string, string>;
  settings?: Record<string, string>;
}

const BLOCK_LABELS: Record<string, string> = {
  hero: "🦸 כותרת ראשית",
  features: "✨ יתרונות",
  testimonial: "⭐ המלצה",
  cta: "📞 קריאה לפעולה",
  problem: "💡 הבעיה",
  solution: "✅ הפתרון",
  form: "📋 טופס",
  whatsapp: "💬 וואצאפ",
};

interface Props {
  client: {
    id: string;
    name: string;
    slug: string;
    primaryColor: string | null;
    pagePublished: boolean;
    pageBlocks: unknown[];
  };
  appUrl: string;
}

export function EditPageClient({ client, appUrl }: Props) {
  const [blocks, setBlocks] = useState<Block[]>(client.pageBlocks as Block[]);
  const [color, setColor] = useState(client.primaryColor ?? "#6366f1");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [activeBlock, setActiveBlock] = useState<string | null>(null);
  const [improving, setImproving] = useState<string | null>(null);

  function updateBlock(blockId: string, field: string, value: string) {
    setBlocks((prev) => prev.map((b) => (b.id === blockId ? { ...b, content: { ...b.content, [field]: value } } : b)));
    setSaved(false);
  }

  async function save(publish?: boolean) {
    setSaving(true);
    await fetch(`/api/clients/${client.id}/builder`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pageBlocks: blocks, primaryColor: color, ...(publish ? { pagePublished: true } : {}) }),
    });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  }

  async function improveBlock(block: Block) {
    setImproving(block.id);
    try {
      const res = await fetch("/api/ai/improve-block", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ block, clientName: client.name }),
      });
      const data = (await res.json()) as { improved?: Record<string, string> };
      if (data.improved) {
        setBlocks((prev) => prev.map((b) => (b.id === block.id ? { ...b, content: { ...b.content, ...data.improved } } : b)));
        setSaved(false);
      }
    } catch { /* ignore */ }
    setImproving(null);
  }

  const pageUrl = `${appUrl}/${client.slug}`;

  return (
    <div className="min-h-screen bg-gray-50" dir="rtl">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-5 py-3 flex items-center justify-between sticky top-0 z-50">
        <div>
          <h1 className="text-base font-bold text-gray-900">✏️ עריכת הדף שלי</h1>
          <p className="text-xs text-gray-500">{client.name}</p>
        </div>
        <div className="flex gap-2">
          <a href={pageUrl} target="_blank" rel="noopener noreferrer" className="px-3 py-2 bg-gray-100 text-gray-700 rounded-lg text-xs font-medium">👁 צפה</a>
          <button onClick={() => save()} disabled={saving} className="px-3 py-2 bg-gray-100 text-gray-700 rounded-lg text-xs font-medium disabled:opacity-50">
            {saved ? "✅ נשמר!" : saving ? "⏳" : "💾 שמור"}
          </button>
          <button onClick={() => save(true)} disabled={saving} className="px-4 py-2 bg-gradient-to-l from-indigo-600 to-purple-600 text-white rounded-lg text-xs font-bold disabled:opacity-50">
            🚀 פרסם
          </button>
        </div>
      </div>

      <div className="flex min-h-[calc(100vh-56px)]">
        {/* Left — Edit */}
        <div className="w-[360px] bg-white border-l border-gray-200 overflow-y-auto p-4 flex-shrink-0 space-y-3">
          {/* Color */}
          <div className="bg-gray-50 rounded-xl p-3">
            <label className="text-xs font-semibold text-gray-600 block mb-2">🎨 צבע ראשי</label>
            <div className="flex items-center gap-1.5">
              <input type="color" value={color} onChange={(e) => setColor(e.target.value)} className="w-10 h-8 rounded-lg border-none cursor-pointer" />
              {["#6366f1", "#ec4899", "#f97316", "#22c55e", "#3b82f6", "#1e293b"].map((c) => (
                <button key={c} onClick={() => setColor(c)} className="w-6 h-6 rounded-full flex-shrink-0 shadow-sm" style={{ background: c, border: color === c ? "3px solid #111" : "2px solid white" }} />
              ))}
            </div>
          </div>

          {blocks.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <p className="text-sm">אין בלוקים עדיין</p>
              <Link href={`/client/${client.slug}/ai-agent`} className="text-xs text-indigo-600 mt-2 inline-block">בקש מהסוכן AI לבנות דף →</Link>
            </div>
          ) : (
            blocks.map((block) => (
              <div key={block.id} className={`border rounded-xl overflow-hidden ${activeBlock === block.id ? "border-indigo-400" : "border-gray-200"}`}>
                <button onClick={() => setActiveBlock(activeBlock === block.id ? null : block.id)} className={`w-full px-3 py-2.5 text-right flex justify-between items-center text-sm font-semibold ${activeBlock === block.id ? "bg-indigo-50 text-indigo-700" : "bg-gray-50 text-gray-700"}`}>
                  <span>{BLOCK_LABELS[block.type] ?? block.type}</span>
                  <span className="text-xs">{activeBlock === block.id ? "▲" : "▼"}</span>
                </button>

                {activeBlock === block.id && (
                  <div className="p-3 space-y-2.5">
                    {Object.entries(block.content).map(([key, val]) => {
                      if (typeof val !== "string") return null;
                      const isLong = val.length > 50 || ["title", "subtitle", "quote", "description", "text"].includes(key);
                      return (
                        <div key={key}>
                          <label className="text-[11px] font-semibold text-gray-500 block mb-1">{key}</label>
                          {isLong ? (
                            <textarea value={val} onChange={(e) => updateBlock(block.id, key, e.target.value)} rows={2} className="w-full border border-gray-200 rounded-lg px-2.5 py-2 text-xs resize-none outline-none focus:border-indigo-400" />
                          ) : (
                            <input value={val} onChange={(e) => updateBlock(block.id, key, e.target.value)} className="w-full border border-gray-200 rounded-lg px-2.5 py-2 text-xs outline-none focus:border-indigo-400" />
                          )}
                        </div>
                      );
                    })}
                    <button onClick={() => improveBlock(block)} disabled={improving === block.id} className="w-full py-2 bg-indigo-50 text-indigo-600 border border-indigo-200 rounded-lg text-xs font-medium disabled:opacity-50">
                      {improving === block.id ? "⏳ משפר..." : "✨ שפר עם AI"}
                    </button>
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        {/* Right — Preview */}
        <div className="flex-1 bg-gray-100 flex flex-col min-w-0">
          <div className="bg-white border-b border-gray-200 px-4 py-2 text-sm font-semibold text-gray-600 flex-shrink-0">
            👁 תצוגה מקדימה
          </div>
          <div className="flex-1 overflow-hidden">
            <iframe src={`${pageUrl}?t=${Date.now()}`} className="w-full h-full border-none" title="preview" />
          </div>
        </div>
      </div>
    </div>
  );
}
