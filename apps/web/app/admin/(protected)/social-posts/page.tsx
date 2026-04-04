"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Sparkles, Copy, Check, Loader2, RefreshCw, Trash2, Edit2 } from "lucide-react";
import toast from "react-hot-toast";

type Client = { id: string; name: string; industry: string | null };

type SavedPost = {
  id: string;
  clientId: string;
  content: string;
  platform: string;
  status: string;
  imageUrl: string | null;
  createdAt: string;
  client: { name: string };
};

const STYLES = [
  { id: "professional", label: "👔 מקצועי" },
  { id: "fun", label: "😄 שנוי" },
  { id: "sales", label: "💰 מכירתי" },
  { id: "inspiring", label: "⭐ מעורר השראה" },
  { id: "urgent", label: "🔥 דחיפות" },
] as const;

const PLATFORMS = [
  { id: "facebook", label: "Facebook", icon: "📘" },
  { id: "instagram", label: "Instagram", icon: "📸" },
  { id: "linkedin", label: "LinkedIn", icon: "💼" },
  { id: "whatsapp", label: "WhatsApp", icon: "💬" },
] as const;

const LANGUAGES = [
  { id: "hebrew", label: "עברית" },
  { id: "arabic", label: "العربية" },
  { id: "english", label: "English" },
] as const;

type StyleId = (typeof STYLES)[number]["id"];
type PlatformId = (typeof PLATFORMS)[number]["id"];
type LanguageId = (typeof LANGUAGES)[number]["id"];

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  async function copy() {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success("הועתק!");
    setTimeout(() => setCopied(false), 2000);
  }
  return (
    <button
      onClick={copy}
      className="flex items-center gap-1 text-xs text-gray-500 hover:text-indigo-600 transition"
    >
      {copied ? <Check size={12} className="text-green-500" /> : <Copy size={12} />}
      {copied ? "הועתק" : "העתק"}
    </button>
  );
}

export default function SocialPostsPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [form, setForm] = useState<{
    topic: string;
    imageUrl: string;
    imageFile: File | null;
    imagePreview: string;
    style: StyleId;
    platform: PlatformId;
    language: LanguageId;
    clientId: string;
  }>({
    topic: "",
    imageUrl: "",
    imageFile: null,
    imagePreview: "",
    style: "professional",
    platform: "facebook",
    language: "hebrew",
    clientId: "",
  });

  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [editingResult, setEditingResult] = useState(false);
  const [editedText, setEditedText] = useState("");
  const [savedPosts, setSavedPosts] = useState<SavedPost[]>([]);
  const [loadingPosts, setLoadingPosts] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch("/api/clients")
      .then((r) => r.json())
      .then((d) => {
        setClients(d.clients ?? []);
        if (d.clients?.[0]) setForm((f) => ({ ...f, clientId: d.clients[0].id }));
      })
      .catch(() => {});
  }, []);

  const loadPosts = useCallback(() => {
    setLoadingPosts(true);
    const qs = form.clientId ? `?clientId=${form.clientId}` : "";
    fetch(`/api/social-posts${qs}`)
      .then((r) => r.json())
      .then((d) => setSavedPosts(d.posts ?? []))
      .catch(() => {})
      .finally(() => setLoadingPosts(false));
  }, [form.clientId]);

  useEffect(() => {
    loadPosts();
  }, [loadPosts]);

  function handleFileSelect(file: File) {
    const preview = URL.createObjectURL(file);
    setForm((f) => ({ ...f, imageFile: file, imagePreview: preview, imageUrl: "" }));
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file?.type.startsWith("image/")) handleFileSelect(file);
  }

  async function generate() {
    if (!form.clientId) { toast.error("בחר לקוח"); return; }
    if (!form.topic.trim()) { toast.error("הכנס נושא לפוסט"); return; }
    setGenerating(true);
    setResult(null);
    try {
      const res = await fetch("/api/social-posts/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientId: form.clientId,
          topic: form.topic,
          imageUrl: form.imageUrl || (form.imagePreview ? "image_attached" : ""),
          style: form.style,
          platform: form.platform,
          language: form.language,
        }),
      });
      if (!res.ok) {
        const d = await res.json();
        toast.error(d.error ?? "שגיאה ביצירת הפוסט");
        return;
      }
      const data = await res.json();
      setResult(data.post ?? data.caption ?? "");
      toast.success("הפוסט מוכן! ✨");
    } finally {
      setGenerating(false);
    }
  }

  async function savePost() {
    if (!result && !editedText) return;
    if (!form.clientId) return;
    setSaving(true);
    try {
      const content = editingResult ? editedText : result!;
      const res = await fetch("/api/social-posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientId: form.clientId,
          content,
          platform: form.platform,
          status: "draft",
          imageUrl: form.imageUrl || null,
        }),
      });
      if (!res.ok) { toast.error("שגיאה בשמירה"); return; }
      toast.success("הפוסט נשמר!");
      loadPosts();
    } finally {
      setSaving(false);
    }
  }

  async function deletePost(id: string) {
    const res = await fetch(`/api/social-posts?id=${id}`, { method: "DELETE" });
    if (res.ok) {
      setSavedPosts((prev) => prev.filter((p) => p.id !== id));
      toast.success("הפוסט נמחק");
    } else {
      toast.error("שגיאה במחיקה");
    }
  }

  const displayText = editingResult ? editedText : (result ?? "");

  return (
    <div className="space-y-6" dir="rtl">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Sparkles size={22} className="text-purple-500" /> יוצר פוסטים לסושיאל
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          AI יוצר פוסט מוכן לפרסום בעברית עם האשטגים
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* RIGHT PANEL — Creation */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 space-y-5">
            <h2 className="font-semibold text-gray-900 flex items-center gap-2">
              <span className="text-lg">📱</span> צור פוסט שיווקי
            </h2>

            {/* Client dropdown */}
            <div>
              <label className="text-xs font-medium text-gray-600 block mb-1">
                בחר לקוח
              </label>
              <select
                value={form.clientId}
                onChange={(e) => setForm((f) => ({ ...f, clientId: e.target.value }))}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:ring-2 focus:ring-indigo-300 outline-none"
              >
                <option value="">בחר לקוח</option>
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            {/* 1. Image */}
            <div>
              <label className="text-xs font-medium text-gray-600 block mb-2">
                1. תמונה (אופציונלי)
              </label>
              <div
                ref={dropRef}
                onDragOver={(e) => e.preventDefault()}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-gray-200 rounded-xl p-4 text-center cursor-pointer hover:border-indigo-300 hover:bg-indigo-50/30 transition-all"
              >
                {form.imagePreview ? (
                  <div className="flex items-center gap-3">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={form.imagePreview}
                      alt="preview"
                      className="w-[120px] h-[120px] object-cover rounded-lg flex-shrink-0"
                    />
                    <div className="text-right flex-1">
                      <p className="text-sm text-gray-700 font-medium">
                        {form.imageFile?.name}
                      </p>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setForm((f) => ({
                            ...f,
                            imageFile: null,
                            imagePreview: "",
                          }));
                        }}
                        className="text-xs text-red-500 hover:text-red-700 mt-1"
                      >
                        הסר תמונה
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="py-4">
                    <span className="text-2xl">📎</span>
                    <p className="text-sm text-gray-400 mt-1">
                      גרור תמונה לכאן או לחץ לבחירה
                    </p>
                  </div>
                )}
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleFileSelect(file);
                }}
              />
              <div className="flex items-center gap-2 mt-2">
                <span className="text-xs text-gray-400">או הכנס URL:</span>
                <input
                  value={form.imageUrl}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      imageUrl: e.target.value,
                      imagePreview: "",
                      imageFile: null,
                    }))
                  }
                  placeholder="https://..."
                  className="flex-1 border border-gray-200 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-200"
                />
              </div>
            </div>

            {/* 2. Topic */}
            <div>
              <label className="text-xs font-medium text-gray-600 block mb-1">
                2. נושא / מילות מפתח
              </label>
              <textarea
                value={form.topic}
                onChange={(e) => setForm((f) => ({ ...f, topic: e.target.value }))}
                rows={3}
                placeholder="מבצע קיץ, שירות..."
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-300 outline-none resize-none"
              />
            </div>

            {/* 3. Style */}
            <div>
              <label className="text-xs font-medium text-gray-600 block mb-2">
                3. סגנון
              </label>
              <div className="flex flex-wrap gap-2">
                {STYLES.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => setForm((f) => ({ ...f, style: s.id }))}
                    className={`px-3 py-1.5 text-sm rounded-full border transition-all ${
                      form.style === s.id
                        ? "border-indigo-500 bg-indigo-50 text-indigo-700 font-medium"
                        : "border-gray-200 text-gray-600 hover:border-gray-300"
                    }`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>

            {/* 4. Platform */}
            <div>
              <label className="text-xs font-medium text-gray-600 block mb-2">
                4. פלטפורמה
              </label>
              <div className="flex flex-wrap gap-2">
                {PLATFORMS.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => setForm((f) => ({ ...f, platform: p.id }))}
                    className={`px-3 py-1.5 text-sm rounded-full border transition-all ${
                      form.platform === p.id
                        ? "border-indigo-500 bg-indigo-50 text-indigo-700 font-medium"
                        : "border-gray-200 text-gray-600 hover:border-gray-300"
                    }`}
                  >
                    {p.icon} {p.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Language */}
            <div>
              <label className="text-xs font-medium text-gray-600 block mb-2">
                5. שפה
              </label>
              <div className="flex gap-2">
                {LANGUAGES.map((l) => (
                  <button
                    key={l.id}
                    onClick={() => setForm((f) => ({ ...f, language: l.id }))}
                    className={`flex-1 px-3 py-1.5 text-sm rounded-full border transition-all ${
                      form.language === l.id
                        ? "border-indigo-500 bg-indigo-50 text-indigo-700 font-medium"
                        : "border-gray-200 text-gray-600 hover:border-gray-300"
                    }`}
                  >
                    {l.label}
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={generate}
              disabled={generating || !form.clientId || !form.topic.trim()}
              className="w-full flex items-center justify-center gap-2 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white font-semibold py-3 rounded-xl transition"
            >
              {generating ? (
                <>
                  <Loader2 size={18} className="animate-spin" /> יוצר פוסט...
                </>
              ) : (
                <>
                  <Sparkles size={18} /> ✨ צור פוסט עם AI
                </>
              )}
            </button>
          </div>

          {/* Result */}
          {result !== null && (
            <div className="bg-white rounded-xl border border-green-200 shadow-sm p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="font-semibold text-gray-900 flex items-center gap-2">
                  <span className="w-5 h-5 bg-green-100 text-green-600 rounded-full flex items-center justify-center text-xs font-bold">
                    ✓
                  </span>
                  הפוסט מוכן!{" "}
                  {PLATFORMS.find((p) => p.id === form.platform)?.icon}
                </h2>
              </div>

              {/* Image preview if attached */}
              {form.imagePreview && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={form.imagePreview}
                  alt="post image"
                  className="w-full max-h-48 object-cover rounded-lg"
                />
              )}

              {/* Post text */}
              {editingResult ? (
                <textarea
                  value={editedText}
                  onChange={(e) => setEditedText(e.target.value)}
                  rows={8}
                  className="w-full border border-indigo-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-200 resize-vertical"
                />
              ) : (
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-sm text-gray-800 whitespace-pre-wrap leading-relaxed">
                    {result}
                  </p>
                </div>
              )}

              {/* Action buttons */}
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => {
                    if (editingResult) {
                      setResult(editedText);
                      setEditingResult(false);
                    } else {
                      setEditedText(result);
                      setEditingResult(true);
                    }
                  }}
                  className="flex items-center gap-1.5 text-xs border border-gray-200 rounded-lg px-3 py-1.5 text-gray-600 hover:border-indigo-300 hover:text-indigo-600 transition"
                >
                  <Edit2 size={12} />
                  {editingResult ? "סיים עריכה" : "ערוך"}
                </button>

                <CopyButton text={displayText} />

                <button
                  onClick={savePost}
                  disabled={saving}
                  className="flex items-center gap-1.5 text-xs bg-indigo-600 text-white px-3 py-1.5 rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition"
                >
                  {saving ? <Loader2 size={11} className="animate-spin" /> : null}
                  💾 שמור
                </button>

                <button
                  onClick={generate}
                  disabled={generating}
                  className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-indigo-600 border border-gray-200 rounded-lg px-3 py-1.5 transition"
                >
                  <RefreshCw size={12} /> 🔄 צור שוב
                </button>
              </div>
            </div>
          )}
        </div>

        {/* LEFT PANEL — Saved posts */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 h-fit">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900 text-sm">פוסטים שמורים</h3>
            <button
              onClick={loadPosts}
              className="text-gray-400 hover:text-indigo-500 transition"
            >
              <RefreshCw size={13} />
            </button>
          </div>

          {loadingPosts ? (
            <div className="flex justify-center py-8">
              <Loader2 size={20} className="animate-spin text-gray-300" />
            </div>
          ) : savedPosts.length === 0 ? (
            <div className="text-center py-8 text-gray-300">
              <Sparkles size={28} className="mx-auto mb-2" />
              <p className="text-xs">פוסטים ששמרת יופיעו כאן</p>
            </div>
          ) : (
            <div className="space-y-3">
              {savedPosts.map((post) => {
                const plat = PLATFORMS.find((p) => p.id === post.platform);
                return (
                  <div
                    key={post.id}
                    className="p-3 rounded-lg border border-gray-100 hover:border-indigo-200 transition-all group"
                  >
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <span className="text-[10px] text-gray-400">
                        {plat?.icon} {plat?.label ?? post.platform} · {post.client.name}
                      </span>
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition">
                        <button
                          onClick={() =>
                            navigator.clipboard
                              .writeText(post.content)
                              .then(() => toast.success("הועתק!"))
                          }
                          className="text-gray-400 hover:text-indigo-500"
                        >
                          <Copy size={11} />
                        </button>
                        <button
                          onClick={() => deletePost(post.id)}
                          className="text-gray-400 hover:text-red-500"
                        >
                          <Trash2 size={11} />
                        </button>
                      </div>
                    </div>
                    <p className="text-xs text-gray-600 whitespace-pre-wrap break-words">
                      {post.content}
                    </p>
                    <p className="text-[10px] text-gray-400 mt-1">
                      {new Date(post.createdAt).toLocaleDateString("he-IL")}
                    </p>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
