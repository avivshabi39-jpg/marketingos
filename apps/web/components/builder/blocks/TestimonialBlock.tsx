"use client";

import { Block } from "@/types/builder";
import { Quote } from "lucide-react";

export default function TestimonialBlock({
  block,
  editable,
  onUpdate,
}: {
  block: Block;
  editable?: boolean;
  onUpdate?: (content: Record<string, string>) => void;
}) {
  const { quote, author, role } = block.content;

  if (!editable) {
    return (
      <section
        className="w-full py-16 px-6"
        style={{ backgroundColor: block.settings.backgroundColor || "#f9fafb" }}
      >
        <div className="max-w-2xl mx-auto text-center">
          <Quote size={32} className="mx-auto mb-4 text-blue-400" />
          <blockquote className="text-xl font-medium text-slate-800 mb-4 leading-relaxed">
            &ldquo;{quote}&rdquo;
          </blockquote>
          <p className="font-semibold text-slate-700">{author}</p>
          {role && <p className="text-sm text-slate-500">{role}</p>}
        </div>
      </section>
    );
  }

  return (
    <section className="w-full px-4 py-6 space-y-2">
      <Quote size={20} className="mx-auto text-blue-400" />
      <textarea
        className="w-full text-center bg-transparent border-b border-dashed border-slate-200 outline-none resize-none text-base"
        value={quote || ""}
        placeholder="ציטוט / המלצה"
        rows={2}
        onChange={(e) => onUpdate?.({ ...block.content, quote: e.target.value })}
      />
      <input
        className="w-full text-sm font-semibold text-center bg-transparent border-b border-dashed border-slate-200 outline-none"
        value={author || ""}
        placeholder="שם הממליץ"
        onChange={(e) => onUpdate?.({ ...block.content, author: e.target.value })}
      />
      <input
        className="w-full text-xs text-slate-500 text-center bg-transparent outline-none"
        value={role || ""}
        placeholder="תפקיד / כותרת"
        onChange={(e) => onUpdate?.({ ...block.content, role: e.target.value })}
      />
    </section>
  );
}
