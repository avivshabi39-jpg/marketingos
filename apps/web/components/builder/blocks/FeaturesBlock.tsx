"use client";

import { Block } from "@/types/builder";

export default function FeaturesBlock({
  block,
  editable,
  onUpdate,
}: {
  block: Block;
  editable?: boolean;
  onUpdate?: (content: Record<string, string>) => void;
}) {
  const features = [
    { emoji: block.content.f1_emoji, title: block.content.f1_title, desc: block.content.f1_desc, prefix: "f1" },
    { emoji: block.content.f2_emoji, title: block.content.f2_title, desc: block.content.f2_desc, prefix: "f2" },
    { emoji: block.content.f3_emoji, title: block.content.f3_title, desc: block.content.f3_desc, prefix: "f3" },
  ];

  if (!editable) {
    return (
      <section
        className="w-full py-16 px-6"
        style={{ backgroundColor: block.settings.backgroundColor, color: block.settings.textColor }}
      >
        <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
          {features.map((f) => (
            <div key={f.prefix} className="text-center p-6 rounded-xl bg-white/80 shadow-sm">
              <span className="text-4xl mb-3 block">{f.emoji}</span>
              <h3 className="text-lg font-bold mb-2">{f.title}</h3>
              <p className="text-gray-600 text-sm">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>
    );
  }

  return (
    <section className="w-full px-4 py-6">
      <div className="grid grid-cols-3 gap-3">
        {features.map((f) => (
          <div key={f.prefix} className="text-center p-3 rounded-lg border border-gray-200 space-y-1">
            <input
              className="text-2xl text-center bg-transparent outline-none w-full"
              value={f.emoji || ""}
              placeholder="🎯"
              onChange={(e) =>
                onUpdate?.({ ...block.content, [`${f.prefix}_emoji`]: e.target.value })
              }
            />
            <input
              className="text-sm font-bold text-center bg-transparent outline-none w-full border-b border-dashed border-gray-200"
              value={f.title || ""}
              placeholder="כותרת"
              onChange={(e) =>
                onUpdate?.({ ...block.content, [`${f.prefix}_title`]: e.target.value })
              }
            />
            <input
              className="text-xs text-gray-500 text-center bg-transparent outline-none w-full"
              value={f.desc || ""}
              placeholder="תיאור"
              onChange={(e) =>
                onUpdate?.({ ...block.content, [`${f.prefix}_desc`]: e.target.value })
              }
            />
          </div>
        ))}
      </div>
    </section>
  );
}
