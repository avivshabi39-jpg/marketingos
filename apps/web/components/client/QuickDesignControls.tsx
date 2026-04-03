"use client";

import { useState } from "react";
import { Save, Eye, Palette, Type, MousePointer } from "lucide-react";
import toast from "react-hot-toast";

interface QuickDesignControlsProps {
  clientId: string;
  slug: string;
  initialColor: string;
  initialTitle: string;
  initialCta: string;
}

export function QuickDesignControls({
  clientId,
  slug,
  initialColor,
  initialTitle,
  initialCta,
}: QuickDesignControlsProps) {
  const [color, setColor]   = useState(initialColor);
  const [title, setTitle]   = useState(initialTitle);
  const [cta, setCta]       = useState(initialCta);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty]   = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch(`/api/clients/${clientId}/quick-update`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ primaryColor: color, landingPageTitle: title, landingPageCta: cta }),
      });
      if (!res.ok) throw new Error();
      setDirty(false);
      toast.success("השינויים נשמרו! הדף עודכן.");
    } catch {
      toast.error("שגיאה בשמירה, נסה שוב");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
      <div className="flex items-center justify-between mb-5">
        <h2 className="font-semibold text-gray-900 flex items-center gap-2">
          <Palette size={17} className="text-indigo-500" />
          עיצוב מהיר
        </h2>
        <a
          href={`/${slug}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-700 font-medium"
        >
          <Eye size={13} />
          תצוגה מקדימה
        </a>
      </div>

      <div className="space-y-4">
        {/* Primary Color */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg border border-gray-200 overflow-hidden flex-shrink-0">
            <input
              type="color"
              value={color}
              onChange={(e) => { setColor(e.target.value); setDirty(true); }}
              className="w-10 h-10 -m-1 cursor-pointer border-0 bg-transparent"
              style={{ appearance: "none" }}
              aria-label="צבע ראשי"
            />
          </div>
          <div className="flex-1">
            <label className="text-xs font-medium text-gray-600 flex items-center gap-1">
              <span className="w-3 h-3 rounded-full inline-block border border-gray-300" style={{ background: color }} />
              צבע ראשי
            </label>
            <p className="text-xs text-gray-400 font-mono">{color}</p>
          </div>
        </div>

        {/* Title */}
        <div>
          <label className="text-xs font-medium text-gray-600 flex items-center gap-1.5 mb-1.5">
            <Type size={12} />
            כותרת הדף
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => { setTitle(e.target.value); setDirty(true); }}
            placeholder="הכנס כותרת ראשית..."
            className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-300 bg-gray-50"
            maxLength={200}
          />
        </div>

        {/* CTA */}
        <div>
          <label className="text-xs font-medium text-gray-600 flex items-center gap-1.5 mb-1.5">
            <MousePointer size={12} />
            טקסט כפתור הקריאה לפעולה
          </label>
          <input
            type="text"
            value={cta}
            onChange={(e) => { setCta(e.target.value); setDirty(true); }}
            placeholder="למשל: צור קשר עכשיו"
            className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-300 bg-gray-50"
            maxLength={100}
          />
        </div>

        <button
          onClick={handleSave}
          disabled={saving || !dirty}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-600 text-white text-sm font-semibold rounded-xl hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Save size={15} />
          {saving ? "שומר..." : "שמור שינויים"}
        </button>
      </div>
    </div>
  );
}
