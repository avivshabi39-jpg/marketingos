"use client";

import { useState, useEffect, useCallback } from "react";
import { Loader2, Download, Copy, RefreshCw, Check, ImageIcon } from "lucide-react";

interface Client {
  id: string;
  name: string;
  industry: string | null;
  primaryColor: string | null;
}

interface GalleryImage {
  id: string;
  imageUrl: string;
  headline: string;
  imageType: string;
  createdAt: string;
}

const STYLES = [
  { id: "modern", label: "✨ מודרני", desc: "נקי ומקצועי" },
  { id: "luxury", label: "💎 יוקרתי", desc: "זהב ושחור" },
  { id: "energetic", label: "⚡ אנרגטי", desc: "צבעים חזקים" },
  { id: "minimal", label: "⬜ מינימלי", desc: "פשוט ונקי" },
  { id: "nature", label: "🌿 טבעי", desc: "ירוק ואורגני" },
  { id: "tech", label: "🔵 טכנולוגי", desc: "כחול ועתידני" },
];

const PLATFORMS = [
  { id: "instagram", label: "Instagram", size: "1080×1080" },
  { id: "facebook", label: "Facebook", size: "1200×630" },
  { id: "story", label: "Story", size: "1080×1920" },
  { id: "linkedin", label: "LinkedIn", size: "1200×627" },
  { id: "whatsapp", label: "WhatsApp", size: "800×800" },
];

export function AiDesignerClient({ clients }: { clients: Client[] }) {
  const [clientId, setClientId] = useState(clients[0]?.id ?? "");
  const [description, setDescription] = useState("");
  const [style, setStyle] = useState("modern");
  const [platform, setPlatform] = useState("instagram");
  const [colors, setColors] = useState(clients[0]?.primaryColor ?? "#6366f1");

  // State
  const [phase, setPhase] = useState<"form" | "generating" | "result">("form");
  const [imageUrl, setImageUrl] = useState("");
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  // Gallery
  const [gallery, setGallery] = useState<GalleryImage[]>([]);
  const [usedThisMonth, setUsedThisMonth] = useState(0);

  const loadGallery = useCallback(async () => {
    if (!clientId) return;
    try {
      const res = await fetch(`/api/ai/generate-image?clientId=${clientId}`);
      if (res.ok) {
        const data = (await res.json()) as { images: GalleryImage[]; usedThisMonth: number };
        setGallery(data.images);
        setUsedThisMonth(data.usedThisMonth);
      }
    } catch { /* ignore */ }
  }, [clientId]);

  useEffect(() => {
    loadGallery();
  }, [loadGallery]);

  // Update color when client changes
  useEffect(() => {
    const c = clients.find((cl) => cl.id === clientId);
    if (c?.primaryColor) setColors(c.primaryColor);
  }, [clientId, clients]);

  async function generate() {
    if (!description.trim() || !clientId) return;
    setPhase("generating");
    setError("");

    try {
      const res = await fetch("/api/ai/generate-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clientId, description, style, platform, colors }),
      });
      const data = (await res.json()) as { ok?: boolean; imageUrl?: string; error?: string; usedThisMonth?: number };
      if (!res.ok || !data.ok) {
        setError(data.error ?? "שגיאה ביצירת תמונה");
        setPhase("form");
        return;
      }
      setImageUrl(data.imageUrl ?? "");
      setUsedThisMonth(data.usedThisMonth ?? usedThisMonth + 1);
      setPhase("result");
      loadGallery();
    } catch {
      setError("שגיאת חיבור — נסה שוב");
      setPhase("form");
    }
  }

  function copyUrl() {
    navigator.clipboard.writeText(imageUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function reset() {
    setPhase("form");
    setImageUrl("");
    setDescription("");
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6" dir="rtl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">🎨 מעצב תמונות AI</h1>
        <p className="text-slate-500 text-sm mt-1">צור תמונות שיווקיות מקצועיות בעזרת AI</p>
      </div>

      {/* Usage counter */}
      <div className="bg-blue-50 border border-blue-100 rounded-xl px-5 py-3 flex items-center justify-between">
        <span className="text-sm text-blue-700 font-medium">
          📊 {usedThisMonth} תמונות נוצרו החודש
        </span>
        <span className="text-xs text-blue-500">Powered by Pollinations AI</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main area */}
        <div className="lg:col-span-2">
          {/* FORM PHASE */}
          {phase === "form" && (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-5">
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm">
                  {error}
                </div>
              )}

              {/* Client selector */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">בחר לקוח</label>
                <select
                  value={clientId}
                  onChange={(e) => setClientId(e.target.value)}
                  className="w-full border border-slate-300 rounded-xl px-4 py-2.5 text-sm bg-white focus:ring-2 focus:ring-blue-200 focus:border-blue-400 outline-none"
                >
                  {clients.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">תאר את התמונה שאתה רוצה</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  placeholder="תמונה של בית יוקרתי בתל אביב עם שקיעה ברקע, לסוכן נדלן מקצועי..."
                  className="w-full border border-slate-300 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-200 focus:border-blue-400 outline-none resize-none"
                />
              </div>

              {/* Style */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">סגנון</label>
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                  {STYLES.map((s) => (
                    <button
                      key={s.id}
                      onClick={() => setStyle(s.id)}
                      className={`rounded-xl border-2 p-2.5 text-center transition-all ${
                        style === s.id
                          ? "border-blue-500 bg-blue-50"
                          : "border-slate-200 hover:border-slate-300"
                      }`}
                    >
                      <div className="text-sm font-medium">{s.label}</div>
                      <div className="text-[10px] text-slate-500">{s.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Platform */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">פלטפורמה</label>
                <div className="flex flex-wrap gap-2">
                  {PLATFORMS.map((p) => (
                    <button
                      key={p.id}
                      onClick={() => setPlatform(p.id)}
                      className={`rounded-lg px-4 py-2 text-sm font-medium transition-all ${
                        platform === p.id
                          ? "bg-blue-600 text-white"
                          : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                      }`}
                    >
                      {p.label} <span className="text-xs opacity-70">{p.size}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Colors */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">צבע מותג (אופציונלי)</label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={colors}
                    onChange={(e) => setColors(e.target.value)}
                    className="w-10 h-10 rounded-lg border border-slate-200 cursor-pointer"
                  />
                  <input
                    value={colors}
                    onChange={(e) => setColors(e.target.value)}
                    className="flex-1 border border-slate-300 rounded-lg px-3 py-2 text-sm font-mono"
                    dir="ltr"
                  />
                </div>
              </div>

              {/* Generate button */}
              <button
                onClick={generate}
                disabled={!description.trim() || !clientId}
                className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl py-3.5 text-sm transition-colors disabled:opacity-40 shadow-lg shadow-blue-500/20"
              >
                ✨ צור תמונה AI
              </button>
            </div>
          )}

          {/* GENERATING PHASE */}
          {phase === "generating" && (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-12 text-center">
              <div className="text-6xl mb-6 animate-bounce">🎨</div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">המעצב AI עובד...</h3>
              <p className="text-slate-500 text-sm mb-6">בונה תמונה מקצועית עבורך</p>
              <div className="w-48 h-1.5 bg-slate-200 rounded-full mx-auto overflow-hidden">
                <div
                  className="h-full bg-blue-500 rounded-full"
                  style={{ animation: "progress 2s ease-in-out infinite", width: "70%" }}
                />
              </div>
              <style>{`
                @keyframes progress {
                  0% { width: 10%; }
                  50% { width: 80%; }
                  100% { width: 10%; }
                }
              `}</style>
            </div>
          )}

          {/* RESULT PHASE */}
          {phase === "result" && imageUrl && (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                <h3 className="font-semibold text-slate-900">✅ התמונה מוכנה!</h3>
                <div className="flex items-center gap-2">
                  <a
                    href={imageUrl}
                    download="ai-image.jpg"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 bg-blue-600 text-white rounded-lg px-3 py-1.5 text-xs font-medium hover:bg-blue-500 transition-colors"
                  >
                    <Download size={13} />
                    הורד
                  </a>
                  <button
                    onClick={copyUrl}
                    className="flex items-center gap-1 bg-slate-100 text-slate-700 rounded-lg px-3 py-1.5 text-xs font-medium hover:bg-slate-200 transition-colors"
                  >
                    {copied ? <Check size={13} /> : <Copy size={13} />}
                    {copied ? "הועתק!" : "העתק URL"}
                  </button>
                  <button
                    onClick={reset}
                    className="flex items-center gap-1 bg-slate-100 text-slate-700 rounded-lg px-3 py-1.5 text-xs font-medium hover:bg-slate-200 transition-colors"
                  >
                    <RefreshCw size={13} />
                    חדש
                  </button>
                </div>
              </div>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={imageUrl}
                alt={description}
                className="w-full"
                style={{ maxHeight: "500px", objectFit: "contain", background: "#f9fafb" }}
              />
            </div>
          )}
        </div>

        {/* Gallery sidebar */}
        <div className="space-y-4">
          <h3 className="font-semibold text-slate-900 text-sm flex items-center gap-2">
            <ImageIcon size={16} />
            יצירות קודמות ({gallery.length})
          </h3>
          {gallery.length === 0 ? (
            <div className="bg-slate-50 rounded-xl p-6 text-center">
              <p className="text-sm text-slate-400">עדיין אין תמונות</p>
              <p className="text-xs text-slate-300 mt-1">צור את התמונה הראשונה שלך!</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              {gallery.map((img) => (
                <button
                  key={img.id}
                  onClick={() => {
                    setImageUrl(img.imageUrl);
                    setPhase("result");
                  }}
                  className="group relative rounded-xl overflow-hidden border border-slate-200 hover:border-blue-300 transition-all aspect-square"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={img.imageUrl}
                    alt={img.headline}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all flex items-end">
                    <div className="p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <p className="text-white text-[10px] font-medium truncate">{img.headline}</p>
                      <p className="text-white/70 text-[9px]">
                        {new Date(img.createdAt).toLocaleDateString("he-IL")}
                      </p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
