"use client";

import { useState, useEffect } from "react";
import { Lightbulb, X, Wand2 } from "lucide-react";

type Suggestion = {
  id: string;
  suggestion: string;
  type: string;
};

interface Props {
  clientId: string;
  onSuggestionClick?: (text: string) => void;
}

export function AiSuggestionsBar({ clientId, onSuggestionClick }: Props) {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetch(`/api/ai/suggestions?clientId=${clientId}`)
      .then((r) => r.ok ? r.json() : null)
      .then((d: { suggestions?: Suggestion[] } | null) => {
        if (d?.suggestions?.length) setSuggestions(d.suggestions);
      })
      .catch(() => {});
  }, [clientId]);

  function dismiss(id: string) {
    setDismissed((prev) => new Set([...prev, id]));
  }

  function dismissAll() {
    fetch("/api/ai/suggestions", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ clientId }),
    }).catch(() => {});
    setSuggestions([]);
  }

  const visible = suggestions.filter((s) => !dismissed.has(s.id));
  if (visible.length === 0) return null;

  return (
    <div className="space-y-2 mb-4">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold text-blue-700 flex items-center gap-1">
          <Lightbulb size={13} />
          הצעות מהסוכן
        </p>
        <button onClick={dismissAll} className="text-xs text-slate-400 hover:text-slate-600">
          סגור הכל
        </button>
      </div>
      {visible.map((s) => (
        <div
          key={s.id}
          className="flex items-start gap-3 bg-blue-50 border border-blue-100 rounded-xl px-4 py-3"
        >
          <Lightbulb size={14} className="text-blue-500 flex-shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <p className="text-sm text-slate-700">💡 הסוכן ממליץ: {s.suggestion}</p>
            {onSuggestionClick && (
              <button
                onClick={() => onSuggestionClick(s.suggestion)}
                className="mt-1.5 flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 font-medium"
              >
                <Wand2 size={11} />
                לחץ לשיפור עם AI
              </button>
            )}
          </div>
          <button
            onClick={() => dismiss(s.id)}
            className="text-slate-300 hover:text-slate-500 flex-shrink-0"
          >
            <X size={14} />
          </button>
        </div>
      ))}
    </div>
  );
}
