"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowRight, Download, RefreshCw, Sparkles, Megaphone, Loader2, Trash2 } from "lucide-react";
import toast from "react-hot-toast";

type ImageType = "facebook_post" | "instagram_post" | "instagram_story" | "whatsapp";
type Template = "real_estate" | "cosmetics" | "cleaning" | "roofing" | "general";

type CampaignImage = {
  id: string;
  imageType: string;
  template: string;
  headline: string;
  imageUrl: string;
  createdAt: string;
  settingsJson: unknown;
};

type ClientData = {
  id: string;
  name: string;
  industry: string | null;
  whatsappNumber: string | null;
  primaryColor: string;
  logoUrl: string | null;
  phone: string | null;
};

const IMAGE_TYPES: { value: ImageType; label: string; size: string; icon: string }[] = [
  { value: "facebook_post",   label: "פוסט פייסבוק",     size: "1200×630",  icon: "📘" },
  { value: "instagram_post",  label: "פוסט אינסטגרם",    size: "1080×1080", icon: "📸" },
  { value: "instagram_story", label: "סטורי אינסטגרם",   size: "1080×1920", icon: "📱" },
  { value: "whatsapp",        label: "תמונת וואצאפ",      size: "800×800",   icon: "💬" },
];

const TEMPLATES: { value: Template; label: string }[] = [
  { value: "real_estate", label: "נדל\"ן" },
  { value: "cosmetics",   label: "קוסמטיקה" },
  { value: "cleaning",    label: "ניקיון" },
  { value: "roofing",     label: "גגות" },
  { value: "general",     label: "כללי" },
];

export default function CampaignsPage() {
  const params = useParams();
  const clientId = params.id as string;

  const [client, setClient] = useState<ClientData | null>(null);
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [imageType, setImageType] = useState<ImageType>("facebook_post");
  const [template, setTemplate] = useState<Template>("general");
  const [headline, setHeadline] = useState("");
  const [subheadline, setSubheadline] = useState("");
  const [price, setPrice] = useState("");
  const [generating, setGenerating] = useState(false);
  const [generatingHeadline, setGeneratingHeadline] = useState(false);
  const [result, setResult] = useState<{ svg: string; dataUrl: string; dimensions: { width: number; height: number } } | null>(null);
  const [history, setHistory] = useState<CampaignImage[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(true);

  useEffect(() => {
    async function loadClient() {
      try {
        const res = await fetch(`/api/clients/${clientId}/builder`);
        if (res.ok) {
          const data = await res.json();
          setClient(data.client);
          // Auto-detect template from industry
          const ind = data.client.industry?.toLowerCase() || "";
          if (ind.includes("REAL_ESTATE")) setTemplate("real_estate");
          else if (ind.includes("COSMETICS")) setTemplate("cosmetics");
          else if (ind.includes("CLEANING")) setTemplate("cleaning");
          else if (ind.includes("ROOFING")) setTemplate("roofing");
        }
      } catch { /* ignore */ }
    }
    loadClient();
  }, [clientId]);

  const loadHistory = useCallback(async () => {
    try {
      const res = await fetch(`/api/ai/campaign-image?clientId=${clientId}`);
      if (res.ok) {
        const data = await res.json();
        setHistory(data.images || []);
      }
    } catch { /* ignore */ } finally {
      setLoadingHistory(false);
    }
  }, [clientId]);

  useEffect(() => { loadHistory(); }, [loadHistory]);

  async function generateHeadline() {
    if (!client) return;
    setGeneratingHeadline(true);
    try {
      const res = await fetch("/api/ai/landing-page", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clientId, field: "headline", blockType: "hero" }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.text) setHeadline(data.text);
      }
    } catch { /* ignore */ } finally {
      setGeneratingHeadline(false);
    }
  }

  async function generate() {
    if (!headline.trim()) { toast.error("נדרשת כותרת ראשית"); return; }
    setGenerating(true);
    try {
      const res = await fetch("/api/ai/campaign-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientId,
          imageType,
          template,
          data: {
            headline,
            subheadline: subheadline || undefined,
            price: price || undefined,
            phone: client?.phone || undefined,
            logoUrl: client?.logoUrl || undefined,
            primaryColor: client?.primaryColor,
            businessName: client?.name,
          },
        }),
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setResult(data);
      setStep(3);
      loadHistory();
      toast.success("התמונה נוצרה בהצלחה! ✨");
    } catch {
      toast.error("שגיאה ביצירת תמונה");
    } finally {
      setGenerating(false);
    }
  }

  function downloadImage() {
    if (!result) return;
    const a = document.createElement("a");
    a.href = result.dataUrl;
    a.download = `campaign-${imageType}-${Date.now()}.svg`;
    a.click();
    toast.success("התמונה הורדה");
  }

  return (
    <div className="space-y-6" dir="rtl">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href={`/admin/clients/${clientId}`} className="text-gray-400 hover:text-gray-600">
          <ArrowRight size={18} />
        </Link>
        <div className="flex items-center gap-2">
          <Megaphone size={20} className="text-indigo-500" />
          <h1 className="text-2xl font-bold text-gray-900">יוצר תמונות קמפיין</h1>
        </div>
        {client && <span className="text-sm text-gray-500">· {client.name}</span>}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Form */}
        <div className="lg:col-span-2 space-y-6">
          {/* Step 1: Type */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 space-y-4">
            <h2 className="font-semibold text-gray-900 flex items-center gap-2">
              <span className="w-6 h-6 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center text-xs font-bold">1</span>
              בחר סוג תמונה
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {IMAGE_TYPES.map((t) => (
                <button
                  key={t.value}
                  onClick={() => setImageType(t.value)}
                  className={`flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition-all ${
                    imageType === t.value
                      ? "border-indigo-500 bg-indigo-50"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <span className="text-2xl">{t.icon}</span>
                  <p className="text-xs font-medium text-center text-gray-700">{t.label}</p>
                  <p className="text-[10px] text-gray-400">{t.size}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Step 2: Content */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 space-y-4">
            <h2 className="font-semibold text-gray-900 flex items-center gap-2">
              <span className="w-6 h-6 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center text-xs font-bold">2</span>
              הוסף תוכן
            </h2>

            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1">תבנית</label>
              <div className="flex gap-2 flex-wrap">
                {TEMPLATES.map((t) => (
                  <button
                    key={t.value}
                    onClick={() => setTemplate(t.value)}
                    className={`px-3 py-1.5 text-sm rounded-lg border transition-all ${
                      template === t.value ? "border-indigo-500 bg-indigo-50 text-indigo-700" : "border-gray-200 text-gray-600 hover:border-gray-300"
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-sm font-medium text-gray-700">כותרת ראשית *</label>
                <button
                  onClick={generateHeadline}
                  disabled={generatingHeadline}
                  className="flex items-center gap-1 text-xs text-purple-600 bg-purple-50 px-2 py-1 rounded-lg hover:bg-purple-100 transition"
                >
                  {generatingHeadline ? <Loader2 size={11} className="animate-spin" /> : <Sparkles size={11} />}
                  ✨ צור כותרת אוטומטית
                </button>
              </div>
              <input
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-300 outline-none"
                value={headline}
                onChange={(e) => setHeadline(e.target.value)}
                placeholder="גגות מקצועיים — שירות אמין ומהיר"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1">כותרת משנה (אופציונלי)</label>
              <input
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-300 outline-none"
                value={subheadline}
                onChange={(e) => setSubheadline(e.target.value)}
                placeholder="צרו קשר עכשיו לקבלת הצעת מחיר"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1">מחיר (אופציונלי)</label>
              <input
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-300 outline-none"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="₪1,500,000"
              />
            </div>

            <button
              onClick={generate}
              disabled={generating || !headline.trim()}
              className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-semibold py-3 rounded-xl transition"
            >
              {generating ? (
                <><Loader2 size={18} className="animate-spin" /> יוצר תמונה...</>
              ) : (
                <><Sparkles size={18} /> ✨ צור תמונה</>
              )}
            </button>
          </div>

          {/* Step 3: Preview */}
          {result && (
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 space-y-4">
              <h2 className="font-semibold text-gray-900 flex items-center gap-2">
                <span className="w-6 h-6 bg-green-100 text-green-600 rounded-full flex items-center justify-center text-xs font-bold">3</span>
                תצוגה מקדימה
              </h2>
              <div className="border border-gray-200 rounded-xl overflow-hidden max-h-80 flex items-center justify-center bg-gray-50">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={result.dataUrl}
                  alt="Campaign preview"
                  className="max-w-full max-h-80 object-contain"
                />
              </div>
              <p className="text-xs text-gray-500 text-center">{result.dimensions.width} × {result.dimensions.height} px</p>
              <div className="flex gap-3">
                <button
                  onClick={downloadImage}
                  className="flex-1 flex items-center justify-center gap-2 border border-gray-200 text-gray-700 py-2.5 rounded-lg hover:bg-gray-50 transition text-sm font-medium"
                >
                  <Download size={16} /> הורד תמונה
                </button>
                <button
                  onClick={generate}
                  disabled={generating}
                  className="flex-1 flex items-center justify-center gap-2 bg-indigo-50 text-indigo-600 py-2.5 rounded-lg hover:bg-indigo-100 transition text-sm font-medium"
                >
                  <RefreshCw size={16} /> צור מחדש
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Right: History */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 space-y-4 h-fit">
          <h3 className="font-semibold text-gray-900 text-sm">היסטוריה</h3>
          {loadingHistory ? (
            <div className="flex justify-center py-8">
              <Loader2 size={20} className="animate-spin text-gray-300" />
            </div>
          ) : history.length === 0 ? (
            <div className="text-center py-8">
              <Megaphone size={28} className="mx-auto text-gray-200 mb-2" />
              <p className="text-sm text-gray-400">עדיין אין תמונות</p>
              <p className="text-xs text-gray-300 mt-1">התמונות שתיצור יופיעו כאן</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              {history.map((img) => (
                <div key={img.id} className="relative group">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={img.imageUrl}
                    alt={img.headline}
                    className="w-full h-20 object-cover rounded-lg border border-gray-100 cursor-pointer hover:opacity-90"
                    onClick={() => setResult({ svg: "", dataUrl: img.imageUrl, dimensions: { width: 1200, height: 630 } })}
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 rounded-lg transition-colors" />
                  <p className="text-[10px] text-gray-500 mt-0.5 truncate">{img.headline}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
