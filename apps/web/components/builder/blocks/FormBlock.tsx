"use client";

import { Block } from "@/types/builder";
import { useState } from "react";

export default function FormBlock({
  block,
  editable,
  onUpdate,
  clientSlug,
}: {
  block: Block;
  editable?: boolean;
  onUpdate?: (content: Record<string, string>) => void;
  clientSlug?: string;
}) {
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const { title, button, buttonColor, successMessage } = block.content;

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!clientSlug) return;
    setLoading(true);
    const formData = new FormData(e.currentTarget);
    const data = {
      fullName: formData.get("fullName") as string,
      phone: formData.get("phone") as string,
      email: formData.get("email") as string || undefined,
      businessName: formData.get("fullName") as string,
      description: formData.get("message") as string || undefined,
    };
    try {
      await fetch(`/api/intake/${clientSlug}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      setSubmitted(true);
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  }

  if (!editable) {
    if (submitted) {
      return (
        <section className="w-full py-16 px-6 text-center bg-green-50">
          <p className="text-xl font-semibold text-green-700">
            {successMessage || "תודה! נחזור אליך בהקדם"}
          </p>
        </section>
      );
    }

    return (
      <section className="w-full py-16 px-6" style={{ backgroundColor: block.settings.backgroundColor }}>
        <div className="max-w-md mx-auto">
          <h2 className="text-2xl font-bold text-center mb-6">{title || "השאר פרטים"}</h2>
          <form onSubmit={handleSubmit} className="space-y-4" dir="rtl">
            <input
              name="fullName"
              required
              placeholder="שם מלא *"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-300 outline-none"
            />
            <input
              name="phone"
              required
              type="tel"
              dir="ltr"
              placeholder="* טלפון"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-300 outline-none text-left"
            />
            <input
              name="email"
              type="email"
              dir="ltr"
              placeholder="אימייל"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-300 outline-none text-left"
            />
            <textarea
              name="message"
              placeholder="הודעה"
              rows={3}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-300 outline-none resize-none"
            />
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-lg text-white font-semibold text-lg transition hover:opacity-90 disabled:opacity-50"
              style={{ backgroundColor: buttonColor || "#2563eb" }}
            >
              {loading ? "שולח..." : button || "שלח"}
            </button>
          </form>
        </div>
      </section>
    );
  }

  return (
    <section className="w-full px-4 py-6">
      <div className="max-w-md mx-auto space-y-3">
        <input
          className="w-full text-xl font-bold text-center bg-transparent border-b border-dashed border-gray-300 outline-none pb-1"
          value={title || ""}
          placeholder="כותרת טופס"
          onChange={(e) => onUpdate?.({ ...block.content, title: e.target.value })}
        />
        <div className="space-y-2 opacity-60 pointer-events-none">
          <div className="h-10 bg-gray-100 rounded-lg border border-gray-200" />
          <div className="h-10 bg-gray-100 rounded-lg border border-gray-200" />
          <div className="h-10 bg-gray-100 rounded-lg border border-gray-200" />
        </div>
        <input
          className="w-full py-2 rounded-lg text-white font-semibold text-center outline-none"
          style={{ backgroundColor: buttonColor || "#2563eb" }}
          value={button || ""}
          placeholder="טקסט כפתור"
          onChange={(e) => onUpdate?.({ ...block.content, button: e.target.value })}
        />
        <input
          className="w-full text-sm text-center bg-transparent border-b border-dashed border-gray-200 outline-none text-gray-500"
          value={successMessage || ""}
          placeholder="הודעת הצלחה"
          onChange={(e) => onUpdate?.({ ...block.content, successMessage: e.target.value })}
        />
      </div>
    </section>
  );
}
