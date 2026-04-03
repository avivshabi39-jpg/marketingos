"use client";

import { useState } from "react";
import { Copy, Check, MessageCircle, Download } from "lucide-react";

interface ShareCenterProps {
  slug: string;
  clientName: string;
  appUrl: string;
}

export function ShareCenter({ slug, clientName, appUrl }: ShareCenterProps) {
  const landingUrl = `${appUrl}/${slug}`;
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(landingUrl)}&color=4f46e5&bgcolor=ffffff`;

  const [copiedUrl, setCopiedUrl]   = useState(false);
  const [copiedPost, setCopiedPost] = useState(false);
  const [postText, setPostText]     = useState("");
  const [loadingPost, setLoadingPost] = useState(false);

  const copy = async (text: string, setter: (v: boolean) => void) => {
    await navigator.clipboard.writeText(text).catch(() => {});
    setter(true);
    setTimeout(() => setter(false), 2000);
  };

  const generatePost = async () => {
    setLoadingPost(true);
    try {
      const res = await fetch("/api/ai/social-post", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clientName, platform: "facebook", url: landingUrl }),
      });
      if (res.ok) {
        const data = await res.json() as { post?: string };
        setPostText(data.post ?? `✨ ${clientName}\n\nבואו לבקר בדף שלנו!\n${landingUrl}`);
      } else {
        setPostText(`✨ ${clientName}\n\nבואו לבקר בדף שלנו!\n${landingUrl}`);
      }
    } catch {
      setPostText(`✨ ${clientName}\n\nבואו לבקר בדף שלנו!\n${landingUrl}`);
    } finally {
      setLoadingPost(false);
    }
  };

  const shareWhatsApp = () => {
    const text = encodeURIComponent(`${clientName} — הדף שלנו: ${landingUrl}`);
    window.open(`https://wa.me/?text=${text}`, "_blank");
  };

  return (
    <div id="share" className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-5">
      <h2 className="font-semibold text-gray-900">שתף את הדף שלך</h2>

      {/* 1. Link */}
      <div className="space-y-2">
        <p className="text-sm font-medium text-gray-700 flex items-center gap-2">
          <span>🔗</span> קישור לדף שלי
        </p>
        <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5">
          <p className="text-sm text-gray-600 flex-1 truncate font-mono" dir="ltr">{landingUrl}</p>
          <button
            onClick={() => copy(landingUrl, setCopiedUrl)}
            className="flex-shrink-0 flex items-center gap-1 text-xs font-medium px-3 py-1.5 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 rounded-lg transition-colors"
          >
            {copiedUrl ? <Check size={13} /> : <Copy size={13} />}
            {copiedUrl ? "הועתק!" : "העתק"}
          </button>
          <button
            onClick={shareWhatsApp}
            className="flex-shrink-0 flex items-center gap-1 text-xs font-medium px-3 py-1.5 bg-green-50 text-green-700 hover:bg-green-100 rounded-lg transition-colors"
          >
            <MessageCircle size={13} />
            שלח
          </button>
        </div>
      </div>

      {/* 2. Facebook Post */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium text-gray-700 flex items-center gap-2">
            <span>📋</span> פוסט לפייסבוק
          </p>
          <button
            onClick={generatePost}
            disabled={loadingPost}
            className="text-xs font-medium px-3 py-1.5 bg-purple-50 text-purple-700 hover:bg-purple-100 rounded-lg transition-colors disabled:opacity-50"
          >
            {loadingPost ? "יוצר..." : "✨ AI כתוב פוסט"}
          </button>
        </div>
        {postText ? (
          <div className="relative bg-gray-50 border border-gray-200 rounded-xl p-3">
            <p className="text-sm text-gray-700 whitespace-pre-line leading-relaxed">{postText}</p>
            <button
              onClick={() => copy(postText, setCopiedPost)}
              className="mt-2 flex items-center gap-1 text-xs font-medium text-indigo-600 hover:text-indigo-700"
            >
              {copiedPost ? <Check size={13} /> : <Copy size={13} />}
              {copiedPost ? "הועתק!" : "העתק פוסט"}
            </button>
          </div>
        ) : (
          <p className="text-xs text-gray-400">לחץ על "AI כתוב פוסט" לייצור תוכן</p>
        )}
      </div>

      {/* 3. QR Code */}
      <div className="space-y-2">
        <p className="text-sm font-medium text-gray-700 flex items-center gap-2">
          <span>📱</span> QR Code
        </p>
        <div className="flex items-center gap-4">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={qrUrl} alt="QR Code" className="w-24 h-24 rounded-lg border border-gray-200" />
          <div className="space-y-2">
            <p className="text-xs text-gray-500">סרוק כדי לפתוח את הדף ישירות</p>
            <a
              href={qrUrl}
              download={`qr-${slug}.png`}
              className="flex items-center gap-1 text-xs font-medium px-3 py-1.5 bg-gray-50 text-gray-700 hover:bg-gray-100 border border-gray-200 rounded-lg transition-colors"
            >
              <Download size={13} />
              הורד QR
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
