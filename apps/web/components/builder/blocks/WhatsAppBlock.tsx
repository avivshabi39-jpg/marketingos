"use client";

import { Block } from "@/types/builder";
import { MessageCircle } from "lucide-react";

export default function WhatsAppBlock({
  block,
  editable,
  onUpdate,
  whatsappNumber,
}: {
  block: Block;
  editable?: boolean;
  onUpdate?: (content: Record<string, string>) => void;
  whatsappNumber?: string;
}) {
  const phone = block.content.phone || whatsappNumber || "";
  const text = block.content.text || "שלח לנו הודעה בוואצאפ";
  const message = block.content.message || "";
  const sticky = block.content.sticky === "true";

  const waUrl = `https://wa.me/${phone.replace(/\D/g, "")}?text=${encodeURIComponent(message)}`;

  if (!editable) {
    return (
      <>
        <section className="w-full py-8 px-6 text-center" style={{ backgroundColor: block.settings.backgroundColor }}>
          <a
            href={waUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-3 bg-green-500 hover:bg-green-600 text-white font-bold py-4 px-8 rounded-full text-lg shadow-lg transition"
          >
            <MessageCircle size={24} />
            {text}
          </a>
        </section>
        {sticky && (
          <a
            href={waUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="fixed bottom-6 left-6 z-50 bg-green-500 hover:bg-green-600 text-white p-4 rounded-full shadow-xl transition"
          >
            <MessageCircle size={28} />
          </a>
        )}
      </>
    );
  }

  return (
    <section className="w-full px-4 py-6 space-y-3">
      <div className="flex items-center justify-center gap-2 text-green-600">
        <MessageCircle size={20} />
        <span className="font-bold">WhatsApp</span>
      </div>
      <input
        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm text-center outline-none"
        value={text}
        placeholder="טקסט כפתור"
        onChange={(e) => onUpdate?.({ ...block.content, text: e.target.value })}
      />
      <input
        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none"
        value={message}
        placeholder="הודעה מוכנה מראש"
        onChange={(e) => onUpdate?.({ ...block.content, message: e.target.value })}
      />
      <label className="flex items-center gap-2 text-sm text-gray-600 justify-center">
        <input
          type="checkbox"
          checked={sticky}
          onChange={(e) =>
            onUpdate?.({ ...block.content, sticky: e.target.checked ? "true" : "false" })
          }
        />
        כפתור צף (sticky)
      </label>
    </section>
  );
}
