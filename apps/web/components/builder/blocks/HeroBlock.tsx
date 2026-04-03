"use client";

import { Block } from "@/types/builder";

export default function HeroBlock({
  block,
  editable,
  onUpdate,
}: {
  block: Block;
  editable?: boolean;
  onUpdate?: (content: Record<string, string>) => void;
}) {
  const { title, subtitle, cta, ctaColor } = block.content;
  const bg = block.settings.backgroundColor || "#1e40af";
  const textColor = block.settings.textColor || "#ffffff";

  if (!editable) {
    return (
      <section
        className="w-full text-center py-20 px-6"
        style={{ backgroundColor: bg, color: textColor }}
      >
        <h1 className="text-4xl md:text-5xl font-bold mb-4">{title}</h1>
        {subtitle && <p className="text-xl md:text-2xl mb-8 opacity-90">{subtitle}</p>}
        {cta && (
          <button
            className="px-8 py-3 rounded-lg text-white font-semibold text-lg shadow-lg hover:opacity-90 transition"
            style={{ backgroundColor: ctaColor || "#2563eb" }}
          >
            {cta}
          </button>
        )}
      </section>
    );
  }

  return (
    <section
      className="w-full text-center py-12 px-6 rounded-lg"
      style={{ backgroundColor: bg, color: textColor }}
    >
      <input
        className="text-3xl font-bold mb-3 bg-transparent border-b border-dashed border-white/40 text-center w-full outline-none"
        style={{ color: textColor }}
        value={title || ""}
        placeholder="כותרת ראשית"
        onChange={(e) => onUpdate?.({ ...block.content, title: e.target.value })}
      />
      <input
        className="text-lg mb-6 bg-transparent border-b border-dashed border-white/30 text-center w-full outline-none opacity-90"
        style={{ color: textColor }}
        value={subtitle || ""}
        placeholder="תת כותרת"
        onChange={(e) => onUpdate?.({ ...block.content, subtitle: e.target.value })}
      />
      <div className="flex items-center justify-center gap-2">
        <input
          className="px-4 py-2 rounded-lg text-white font-semibold text-center bg-transparent border border-white/40 outline-none"
          style={{ backgroundColor: ctaColor || "#2563eb" }}
          value={cta || ""}
          placeholder="טקסט כפתור"
          onChange={(e) => onUpdate?.({ ...block.content, cta: e.target.value })}
        />
      </div>
    </section>
  );
}
