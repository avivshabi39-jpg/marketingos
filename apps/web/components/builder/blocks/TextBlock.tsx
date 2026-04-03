"use client";

import { Block } from "@/types/builder";

export default function TextBlock({
  block,
  editable,
  onUpdate,
}: {
  block: Block;
  editable?: boolean;
  onUpdate?: (content: Record<string, string>) => void;
}) {
  const alignment = block.settings.alignment || "right";

  if (!editable) {
    return (
      <section
        className="w-full px-6 py-12 max-w-3xl mx-auto"
        style={{
          textAlign: alignment,
          color: block.settings.textColor,
          backgroundColor: block.settings.backgroundColor,
        }}
      >
        <div className="prose prose-lg max-w-none whitespace-pre-wrap">{block.content.text}</div>
      </section>
    );
  }

  return (
    <section
      className="w-full px-4 py-6"
      style={{ textAlign: alignment, backgroundColor: block.settings.backgroundColor }}
    >
      <textarea
        className="w-full min-h-[120px] p-3 border border-gray-200 rounded-lg resize-y text-base outline-none focus:ring-2 focus:ring-indigo-300"
        style={{ textAlign: alignment, color: block.settings.textColor }}
        dir="rtl"
        value={block.content.text || ""}
        placeholder="הוסף טקסט כאן..."
        onChange={(e) => onUpdate?.({ ...block.content, text: e.target.value })}
      />
    </section>
  );
}
