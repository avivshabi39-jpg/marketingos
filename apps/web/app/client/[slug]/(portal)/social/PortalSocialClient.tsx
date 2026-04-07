"use client";

import { useState } from "react";
import Image from "next/image";

const PLATFORMS = [
  { id: "facebook", label: "Facebook", icon: "📘" },
  { id: "instagram", label: "Instagram", icon: "📸" },
  { id: "whatsapp", label: "WhatsApp", icon: "💬" },
  { id: "linkedin", label: "LinkedIn", icon: "💼" },
];
const STYLES = [
  { id: "professional", label: "👔 מקצועי" },
  { id: "fun", label: "😄 כיפי" },
  { id: "sales", label: "💰 מכירתי" },
  { id: "inspiring", label: "⭐ מעורר" },
  { id: "urgent", label: "🔥 דחוף" },
];
const LANGUAGES = [
  { id: "hebrew", label: "עברית" },
  { id: "arabic", label: "العربية" },
  { id: "english", label: "English" },
];

interface Post { id: string; content: string; platform: string; imageUrl: string | null; createdAt: string }

export function PortalSocialClient({ clientId, clientName, posts: initial }: { clientId: string; clientName: string; posts: Post[] }) {
  const [platform, setPlatform] = useState("facebook");
  const [style, setStyle] = useState("professional");
  const [language, setLanguage] = useState("hebrew");
  const [topic, setTopic] = useState("");
  const [generating, setGenerating] = useState(false);
  const [result, setResult] = useState("");
  const [copied, setCopied] = useState(false);
  const [posts, setPosts] = useState(initial);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [showImage, setShowImage] = useState(false);
  const [imagePrompt, setImagePrompt] = useState("");
  const [genImage, setGenImage] = useState(false);
  const [imageUrl, setImageUrl] = useState("");

  async function generate() {
    if (!topic.trim()) return;
    setGenerating(true);
    try {
      const res = await fetch("/api/social-posts/generate", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ clientId, topic, platform, style, language }) });
      const data = (await res.json()) as { post?: string };
      if (data.post) setResult(data.post);
    } catch { setResult("שגיאה — נסה שוב"); }
    setGenerating(false);
  }

  async function save() {
    if (!result) return;
    const res = await fetch("/api/social-posts", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ clientId, content: result, platform, imageUrl: imageUrl || null }) });
    const data = (await res.json()) as { post?: Post };
    if (data.post) setPosts((p) => [data.post!, ...p]);
  }

  function copy(text: string) { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 2000); }

  async function makeImage() {
    setGenImage(true);
    try {
      const res = await fetch("/api/ai/generate-image", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ clientId, description: imagePrompt || topic, style: "modern", platform }) });
      const data = (await res.json()) as { imageUrl?: string };
      if (data.imageUrl) setImageUrl(data.imageUrl);
    } catch { /* ignore */ }
    setGenImage(false);
  }

  return (
    <div className="max-w-lg mx-auto space-y-5" dir="rtl">
      <div>
        <h1 className="text-xl font-bold">📱 פוסטים שיווקיים</h1>
        <p className="text-sm text-gray-500">צור תוכן מקצועי עם AI</p>
      </div>

      {/* Form */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
        {/* Platform */}
        <div>
          <p className="text-xs font-bold text-gray-500 mb-2">פלטפורמה</p>
          <div className="flex gap-2">
            {PLATFORMS.map((p) => (
              <button key={p.id} onClick={() => setPlatform(p.id)} className={`flex-1 py-2 rounded-lg text-xs font-medium border-2 transition-all ${platform === p.id ? "border-indigo-500 bg-indigo-50 text-indigo-700" : "border-gray-200 text-gray-600"}`}>
                {p.icon} {p.label}
              </button>
            ))}
          </div>
        </div>

        {/* Topic */}
        <div>
          <p className="text-xs font-bold text-gray-500 mb-1.5">נושא *</p>
          <textarea value={topic} onChange={(e) => setTopic(e.target.value)} placeholder="מבצע, טיפ מקצועי, שירות חדש..." rows={2} className="w-full border-2 border-gray-200 rounded-xl px-3 py-2.5 text-sm resize-none outline-none focus:border-indigo-400" />
        </div>

        {/* Style + Language */}
        <div className="flex gap-3">
          <div className="flex-1">
            <p className="text-xs font-bold text-gray-500 mb-1.5">סגנון</p>
            <div className="flex gap-1 flex-wrap">
              {STYLES.map((s) => (
                <button key={s.id} onClick={() => setStyle(s.id)} className={`px-2.5 py-1 rounded-full text-[11px] font-medium border-2 ${style === s.id ? "border-indigo-500 bg-indigo-50 text-indigo-700" : "border-gray-200 text-gray-500"}`}>{s.label}</button>
              ))}
            </div>
          </div>
          <div>
            <p className="text-xs font-bold text-gray-500 mb-1.5">שפה</p>
            <div className="flex gap-1">
              {LANGUAGES.map((l) => (
                <button key={l.id} onClick={() => setLanguage(l.id)} className={`px-2.5 py-1 rounded-full text-[11px] font-medium border-2 ${language === l.id ? "border-indigo-500 bg-indigo-50 text-indigo-700" : "border-gray-200 text-gray-500"}`}>{l.label}</button>
              ))}
            </div>
          </div>
        </div>

        <button onClick={generate} disabled={!topic.trim() || generating} className="w-full py-3 bg-gradient-to-l from-indigo-600 to-purple-600 text-white rounded-xl font-bold text-sm disabled:opacity-40">
          {generating ? "⏳ יוצר..." : "✨ צור פוסט"}
        </button>
      </div>

      {/* Result */}
      {result && (
        <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-3">
          <div className="flex justify-between items-center">
            <span className="font-bold text-sm">✅ הפוסט מוכן</span>
            <span className="text-[10px] text-gray-400">{result.length} תווים</span>
          </div>
          {imageUrl && (
            <div style={{ position: "relative", width: "100%", height: "192px" }}>
              <Image src={imageUrl} alt="post" fill className="object-cover rounded-lg" />
            </div>
          )}
          <div className="bg-gray-50 rounded-lg p-3 text-sm leading-relaxed whitespace-pre-wrap border border-gray-100">{result}</div>
          <div className="flex gap-2">
            <button onClick={() => copy(result)} className={`flex-1 py-2.5 rounded-lg text-xs font-semibold ${copied ? "bg-green-500 text-white" : "bg-gray-100 text-gray-700"}`}>{copied ? "✅ הועתק!" : "📋 העתק"}</button>
            <button onClick={save} className="flex-1 py-2.5 bg-indigo-600 text-white rounded-lg text-xs font-semibold">💾 שמור</button>
            <button onClick={generate} className="flex-1 py-2.5 bg-gray-100 text-gray-600 rounded-lg text-xs">🔄 שוב</button>
          </div>

          {/* Image gen */}
          <button onClick={() => setShowImage(!showImage)} className="w-full py-2 bg-indigo-50 text-indigo-600 border border-indigo-200 rounded-lg text-xs font-medium">
            🎨 {showImage ? "הסתר" : "צור תמונה"}
          </button>
          {showImage && (
            <div className="space-y-2">
              <input value={imagePrompt} onChange={(e) => setImagePrompt(e.target.value)} placeholder="תאר תמונה (אופציונלי)" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-xs outline-none" />
              <button onClick={makeImage} disabled={genImage} className="w-full py-2 bg-indigo-600 text-white rounded-lg text-xs font-semibold disabled:opacity-40">{genImage ? "⏳ יוצר..." : "🎨 צור תמונה AI"}</button>
            </div>
          )}
        </div>
      )}

      {/* Saved posts */}
      {posts.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="font-bold text-sm mb-3">📋 פוסטים שמורים ({posts.length})</p>
          <div className="space-y-2">
            {posts.map((post) => (
              <div key={post.id} className="bg-gray-50 rounded-lg p-3 border border-gray-100">
                <div className="flex justify-between mb-1.5">
                  <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">{post.platform}</span>
                  <span className="text-[10px] text-gray-400">{new Date(post.createdAt).toLocaleDateString("he-IL")}</span>
                </div>
                <p className="text-xs text-gray-700 whitespace-pre-wrap leading-relaxed" style={{ display: expanded === post.id ? "block" : "-webkit-box", WebkitLineClamp: expanded === post.id ? undefined : 3, WebkitBoxOrient: "vertical", overflow: "hidden" } as React.CSSProperties}>{post.content}</p>
                <div className="flex gap-1.5 mt-2">
                  <button onClick={() => copy(post.content)} className="px-2.5 py-1 bg-white border border-gray-200 rounded text-[10px] text-gray-600">📋</button>
                  {post.content.length > 120 && <button onClick={() => setExpanded(expanded === post.id ? null : post.id)} className="text-[10px] text-indigo-600">{expanded === post.id ? "▲ פחות" : "▼ עוד"}</button>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
