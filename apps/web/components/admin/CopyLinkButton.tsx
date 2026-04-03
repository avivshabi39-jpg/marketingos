"use client";

import { useState } from "react";

interface Props {
  url: string;
  label?: string;
}

export function CopyLinkButton({ url, label = "העתק קישור" }: Props) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    // If a relative path is passed, resolve it against the current origin
    const full = url.startsWith("/") ? `${window.location.origin}${url}` : url;
    try {
      await navigator.clipboard.writeText(full);
    } catch {
      // fallback for older browsers / non-HTTPS
      const el = document.createElement("input");
      el.value = full;
      document.body.appendChild(el);
      el.select();
      document.execCommand("copy");
      document.body.removeChild(el);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <button
      onClick={copy}
      title={url}
      className={`text-xs border rounded px-2.5 py-1 transition-colors font-medium ${
        copied
          ? "text-green-700 border-green-300 bg-green-50"
          : "text-gray-500 border-gray-200 hover:text-gray-800 hover:border-gray-400 bg-white"
      }`}
    >
      {copied ? "✓ הועתק" : label}
    </button>
  );
}
