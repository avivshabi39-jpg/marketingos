"use client";

import { useState } from "react";
import { Copy, Check, ExternalLink, MessageCircle } from "lucide-react";

interface Props {
  pageUrl: string;
  clientName: string;
  hasLeads: boolean;
}

export function TrafficActionBar({ pageUrl, clientName, hasLeads }: Props) {
  const [copied, setCopied] = useState(false);

  const copyLink = async () => {
    await navigator.clipboard.writeText(pageUrl).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const shareWhatsApp = () => {
    const text = encodeURIComponent(`${clientName} — בואו לבקר: ${pageUrl}`);
    window.open(`https://wa.me/?text=${text}`, "_blank");
  };

  return (
    <div className="bg-white rounded-xl border border-slate-100 shadow-sm px-4 py-3 flex items-center gap-3 flex-wrap">
      {/* Context message */}
      <div className="flex-1 min-w-0">
        <p className="text-xs font-semibold text-slate-700">
          {!hasLeads
            ? "🚀 הדף שלך באוויר — שתף כדי להתחיל לקבל לידים"
            : "🔗 שתף את הדף שלך לעוד לידים"}
        </p>
        <p className="text-[11px] text-slate-400 truncate font-mono mt-0.5" dir="ltr">
          {pageUrl}
        </p>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 flex-shrink-0">
        <button
          onClick={copyLink}
          className={`inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-lg transition-colors ${
            copied
              ? "bg-green-50 text-green-700"
              : "bg-blue-50 text-blue-700 hover:bg-blue-100"
          }`}
        >
          {copied ? <Check size={13} /> : <Copy size={13} />}
          {copied ? "הועתק!" : "העתק קישור"}
        </button>

        <button
          onClick={shareWhatsApp}
          className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-lg bg-green-50 text-green-700 hover:bg-green-100 transition-colors"
        >
          <MessageCircle size={13} />
          וואצאפ
        </button>

        <a
          href={pageUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-2 rounded-lg bg-slate-50 text-slate-600 hover:bg-slate-100 transition-colors"
        >
          <ExternalLink size={13} />
          פתח
        </a>
      </div>
    </div>
  );
}
