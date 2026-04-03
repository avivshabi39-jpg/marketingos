"use client";

import { Block } from "@/types/builder";

export default function CtaBlock({
  block,
  editable,
  onUpdate,
}: {
  block: Block;
  editable?: boolean;
  onUpdate?: (content: Record<string, string>) => void;
}) {
  const bg = block.settings.backgroundColor || "#1e40af";
  const textColor = block.settings.textColor || "#ffffff";
  const { title, button, buttonColor } = block.content;

  if (!editable) {
    return (
      <section
        className="w-full py-16 px-6 text-center"
        style={{ backgroundColor: bg, color: textColor }}
      >
        <h2 className="text-3xl font-bold mb-6">{title}</h2>
        <button
          className="px-8 py-3 rounded-lg text-white font-semibold text-lg shadow-lg hover:opacity-90 transition"
          style={{ backgroundColor: buttonColor || "#f59e0b" }}
        >
          {button}
        </button>
      </section>
    );
  }

  return (
    <section className="w-full px-4 py-6 rounded-lg text-center" style={{ backgroundColor: bg, color: textColor }}>
      <input
        className="text-2xl font-bold text-center bg-transparent border-b border-dashed border-white/30 w-full outline-none mb-4"
        style={{ color: textColor }}
        value={title || ""}
        placeholder="כותרת CTA"
        onChange={(e) => onUpdate?.({ ...block.content, title: e.target.value })}
      />
      <input
        className="px-6 py-2 rounded-lg text-white font-semibold text-center outline-none"
        style={{ backgroundColor: buttonColor || "#f59e0b" }}
        value={button || ""}
        placeholder="טקסט כפתור"
        onChange={(e) => onUpdate?.({ ...block.content, button: e.target.value })}
      />
    </section>
  );
}
