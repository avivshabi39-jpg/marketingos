"use client";

import { Block } from "@/types/builder";
import { ImageIcon, Upload, Loader2, X } from "lucide-react";
import { useState, useRef } from "react";

export default function ImageBlock({
  block,
  editable,
  onUpdate,
}: {
  block: Block;
  editable?: boolean;
  onUpdate?: (content: Record<string, string>) => void;
}) {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setProgress(20);
    try {
      const fd = new FormData();
      fd.append("file", file);
      setProgress(50);
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      setProgress(80);
      if (res.ok) {
        const data = await res.json() as { url: string };
        onUpdate?.({ ...block.content, url: data.url });
        setProgress(100);
      }
    } catch { /* ignore */ } finally {
      setUploading(false);
      setProgress(0);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  if (!editable) {
    if (!block.content.url) return null;
    return (
      <section className="w-full px-6 py-12" style={{ backgroundColor: block.settings.backgroundColor }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={block.content.url} alt={block.content.alt || ""} className="max-w-full mx-auto rounded-lg shadow-md" />
      </section>
    );
  }

  return (
    <section className="w-full px-4 py-6 space-y-3">
      <input ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp,image/gif" className="hidden" onChange={handleFileChange} />

      {block.content.url ? (
        <div className="relative">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={block.content.url} alt={block.content.alt || ""} className="max-w-full mx-auto rounded-lg shadow-md max-h-48 object-cover w-full" />
          <button
            onClick={() => onUpdate?.({ ...block.content, url: "" })}
            className="absolute top-2 left-2 p-1 rounded-full bg-white shadow border border-slate-200 hover:bg-red-50"
          >
            <X size={14} className="text-red-500" />
          </button>
        </div>
      ) : (
        <button
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-slate-300 rounded-lg text-slate-400 hover:border-blue-400 hover:text-blue-500 transition-colors disabled:opacity-50"
        >
          {uploading ? <Loader2 size={28} className="animate-spin" /> : <ImageIcon size={28} />}
          <span className="text-sm mt-2">{uploading ? "מעלה..." : "לחץ להעלאת תמונה"}</span>
          <span className="text-xs mt-1 text-slate-300">JPG, PNG, WebP עד 5MB</span>
        </button>
      )}

      {uploading && (
        <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
          <div className="h-full bg-blue-500 rounded-full transition-all duration-300" style={{ width: `${progress}%` }} />
        </div>
      )}

      <button
        onClick={() => inputRef.current?.click()}
        disabled={uploading}
        className="w-full flex items-center justify-center gap-2 text-xs text-slate-500 border border-slate-200 rounded-lg py-1.5 hover:bg-slate-50 transition"
      >
        <Upload size={12} /> {block.content.url ? "החלף תמונה" : "העלה תמונה"}
      </button>
    </section>
  );
}
