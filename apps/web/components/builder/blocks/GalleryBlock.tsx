"use client";

import { Block } from "@/types/builder";
import { ImageIcon, Upload, Loader2, X, Plus } from "lucide-react";
import { useState, useRef } from "react";

const GALLERY_KEYS = ["img1", "img2", "img3", "img4", "img5", "img6", "img7", "img8", "img9", "img10"];

export default function GalleryBlock({
  block,
  editable,
  onUpdate,
}: {
  block: Block;
  editable?: boolean;
  onUpdate?: (content: Record<string, string>) => void;
}) {
  const [uploading, setUploading] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const uploadingKey = useRef<string>("");

  const images = GALLERY_KEYS.map((k) => ({ key: k, url: block.content[k] || "" })).filter((_, i) => i < 10);
  const filledImages = images.filter((i) => i.url);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const key = uploadingKey.current;
    setUploading(key);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      if (res.ok) {
        const data = await res.json() as { url: string };
        onUpdate?.({ ...block.content, [key]: data.url });
      }
    } catch { /* ignore */ } finally {
      setUploading(null);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  function addSlot() {
    const nextKey = GALLERY_KEYS.find((k) => !block.content[k]);
    if (!nextKey) return;
    uploadingKey.current = nextKey;
    inputRef.current?.click();
  }

  function removeImage(key: string) {
    onUpdate?.({ ...block.content, [key]: "" });
  }

  if (!editable) {
    if (filledImages.length === 0) return null;
    return (
      <section className="w-full py-12 px-6" style={{ backgroundColor: block.settings.backgroundColor }}>
        <div className={`max-w-5xl mx-auto grid gap-4 ${filledImages.length === 1 ? "grid-cols-1" : filledImages.length <= 3 ? "grid-cols-3" : "grid-cols-2 md:grid-cols-4"}`}>
          {filledImages.map(({ key, url }) => (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img key={key} src={url} alt="" className="w-full h-48 object-cover rounded-lg shadow-sm" />
          ))}
        </div>
      </section>
    );
  }

  return (
    <section className="w-full px-4 py-6">
      <input ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp,image/gif" className="hidden" onChange={handleFileChange} />
      <div className="flex items-center gap-2 text-slate-500 mb-3">
        <ImageIcon size={16} />
        <span className="text-sm font-medium">גלריה ({filledImages.length}/10)</span>
      </div>

      <div className="grid grid-cols-3 gap-2">
        {filledImages.map(({ key, url }) => (
          <div key={key} className="relative aspect-square">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={url} alt="" className="w-full h-full object-cover rounded-lg" />
            <button
              onClick={() => removeImage(key)}
              className="absolute top-1 left-1 p-0.5 rounded-full bg-white/90 shadow hover:bg-red-50"
            >
              <X size={12} className="text-red-500" />
            </button>
            {uploading === key && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/30 rounded-lg">
                <Loader2 size={20} className="animate-spin text-white" />
              </div>
            )}
          </div>
        ))}

        {filledImages.length < 10 && (
          <button
            onClick={addSlot}
            disabled={!!uploading}
            className="aspect-square flex flex-col items-center justify-center border-2 border-dashed border-slate-300 rounded-lg text-slate-400 hover:border-blue-400 hover:text-blue-500 transition-colors disabled:opacity-50"
          >
            {uploading === "new" ? <Loader2 size={20} className="animate-spin" /> : <Plus size={20} />}
            <span className="text-xs mt-1">הוסף</span>
          </button>
        )}
      </div>

      {filledImages.length < 10 && (
        <button
          onClick={addSlot}
          disabled={!!uploading}
          className="mt-3 w-full flex items-center justify-center gap-2 text-xs text-slate-500 border border-slate-200 rounded-lg py-1.5 hover:bg-slate-50 transition"
        >
          <Upload size={12} /> העלה תמונה ({filledImages.length}/10)
        </button>
      )}
    </section>
  );
}
