"use client";

import { useState } from "react";

interface SavedImage {
  id: string;
  imageUrl: string;
  platform: string;
  createdAt: Date | string;
}

const STYLES = [
  { id: "modern", label: "🎨 מודרני", desc: "נקי ומינימלי" },
  { id: "luxury", label: "👑 יוקרתי", desc: "פרמיום ואלגנטי" },
  { id: "energetic", label: "⚡ אנרגטי", desc: "צבעוני ודינמי" },
  { id: "warm", label: "🌅 חם", desc: "ידידותי ומזמין" },
  { id: "tech", label: "💻 טכנולוגי", desc: "עתידני ודיגיטלי" },
  { id: "minimal", label: "⬜ מינימל", desc: "פשוט ונקי" },
];

const PLATFORMS = [
  { id: "instagram", label: "📸 Instagram", size: "1080×1080" },
  { id: "facebook", label: "📘 Facebook", size: "1200×630" },
  { id: "whatsapp", label: "💬 WhatsApp", size: "800×800" },
  { id: "story", label: "📱 Story", size: "1080×1920" },
  { id: "linkedin", label: "💼 LinkedIn", size: "1200×627" },
];

const QUICK_PROMPTS = [
  { label: "🎁 מבצע מיוחד", prompt: "מבצע הנחה מיוחדת עם תג מחיר" },
  { label: "⭐ המלצת לקוח", prompt: "כרטיס המלצה מלקוח מרוצה מקצועי" },
  { label: "💡 טיפ מקצועי", prompt: "כרטיס טיפ מקצועי לעסקים" },
  { label: "🏆 הצגת שירות", prompt: "תמונה מקצועית להצגת שירות" },
  { label: "📊 מספרים", prompt: "אינפוגרפיקה עם נתונים מרשימים" },
  { label: "👋 ברוכים הבאים", prompt: "הכרזה על מוצר חדש או שירות" },
];

export function PortalDesignerClient({
  client,
  savedImages,
}: {
  client: { id: string; name: string; slug: string; industry: string | null; primaryColor: string };
  savedImages: SavedImage[];
}) {
  const [description, setDescription] = useState("");
  const [style, setStyle] = useState("modern");
  const [platform, setPlatform] = useState("instagram");
  const [generating, setGenerating] = useState(false);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [gallery, setGallery] = useState(savedImages);
  const [error, setError] = useState<string | null>(null);

  async function generate() {
    if (!description.trim()) return;
    setGenerating(true);
    setError(null);
    setImageUrl(null);

    try {
      const res = await fetch("/api/ai/generate-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientId: client.id,
          description,
          style,
          platform,
        }),
      });

      if (!res.ok) throw new Error("Generation failed");

      const data = await res.json();
      setImageUrl(data.imageUrl);

      if (data.imageUrl) {
        setGallery((prev) => [
          {
            id: data.generationId || Date.now().toString(),
            imageUrl: data.imageUrl,
            platform,
            createdAt: new Date().toISOString(),
          },
          ...prev,
        ]);
      }
    } catch {
      setError("שגיאה ביצירת התמונה — נסה שוב");
    }
    setGenerating(false);
  }

  function downloadImage(url: string) {
    const link = document.createElement("a");
    link.href = url;
    link.download = `image-${Date.now()}.jpg`;
    link.target = "_blank";
    link.click();
  }

  return (
    <div style={{ padding: "16px", direction: "rtl", maxWidth: "800px" }}>
      {/* Header */}
      <div style={{ marginBottom: "20px" }}>
        <h1 style={{ fontSize: "20px", fontWeight: 800, margin: 0 }}>
          🎨 מעצב תמונות AI
        </h1>
        <p style={{ fontSize: "13px", color: "#6b7280", margin: "4px 0 0" }}>
          תמונות שיווקיות מקצועיות תוך שניות
        </p>
      </div>

      {/* Creation panel */}
      <div
        style={{
          background: "white",
          borderRadius: "14px",
          border: "1px solid #e5e7eb",
          padding: "20px",
          marginBottom: "20px",
        }}
      >
        {/* Quick prompts */}
        <div style={{ marginBottom: "14px" }}>
          <label
            style={{
              fontSize: "12px",
              fontWeight: 700,
              color: "#6b7280",
              display: "block",
              marginBottom: "8px",
            }}
          >
            💡 התחל מתבנית:
          </label>
          <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
            {QUICK_PROMPTS.map((qp) => (
              <button
                key={qp.label}
                onClick={() => setDescription(qp.prompt)}
                style={{
                  padding: "5px 12px",
                  background:
                    description === qp.prompt ? "#eef2ff" : "#f3f4f6",
                  color:
                    description === qp.prompt ? "#6366f1" : "#374151",
                  border: `1px solid ${description === qp.prompt ? "#c7d2fe" : "#e5e7eb"}`,
                  borderRadius: "20px",
                  fontSize: "12px",
                  cursor: "pointer",
                }}
              >
                {qp.label}
              </button>
            ))}
          </div>
        </div>

        {/* Description */}
        <div style={{ marginBottom: "14px" }}>
          <label
            style={{
              fontSize: "12px",
              fontWeight: 700,
              color: "#6b7280",
              display: "block",
              marginBottom: "6px",
            }}
          >
            תאר את התמונה *
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="למשל: תמונה שיווקית לעסק ניקיון עם לקוח מרוצה בבית נקי"
            rows={3}
            style={{
              width: "100%",
              padding: "10px 12px",
              border: "2px solid #e5e7eb",
              borderRadius: "10px",
              fontSize: "14px",
              resize: "none",
              direction: "rtl",
              fontFamily: "inherit",
              outline: "none",
            }}
          />
        </div>

        {/* Platform */}
        <div style={{ marginBottom: "14px" }}>
          <label
            style={{
              fontSize: "12px",
              fontWeight: 700,
              color: "#6b7280",
              display: "block",
              marginBottom: "8px",
            }}
          >
            פלטפורמה
          </label>
          <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
            {PLATFORMS.map((p) => (
              <button
                key={p.id}
                onClick={() => setPlatform(p.id)}
                style={{
                  padding: "7px 12px",
                  background: platform === p.id ? "#eef2ff" : "#f9fafb",
                  border: `2px solid ${platform === p.id ? "#6366f1" : "#e5e7eb"}`,
                  borderRadius: "8px",
                  cursor: "pointer",
                  fontSize: "11px",
                  fontWeight: platform === p.id ? 700 : 400,
                  color: platform === p.id ? "#6366f1" : "#374151",
                  textAlign: "center",
                }}
              >
                {p.label}
                <br />
                <span style={{ fontSize: "10px", opacity: 0.7 }}>
                  {p.size}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Style */}
        <div style={{ marginBottom: "16px" }}>
          <label
            style={{
              fontSize: "12px",
              fontWeight: 700,
              color: "#6b7280",
              display: "block",
              marginBottom: "8px",
            }}
          >
            סגנון עיצוב
          </label>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(3, 1fr)",
              gap: "6px",
            }}
          >
            {STYLES.map((s) => (
              <button
                key={s.id}
                onClick={() => setStyle(s.id)}
                style={{
                  padding: "8px 10px",
                  textAlign: "center",
                  background: style === s.id ? "#eef2ff" : "#f9fafb",
                  border: `2px solid ${style === s.id ? "#6366f1" : "#e5e7eb"}`,
                  borderRadius: "8px",
                  cursor: "pointer",
                }}
              >
                <div
                  style={{
                    fontSize: "13px",
                    fontWeight: style === s.id ? 700 : 400,
                    color: style === s.id ? "#6366f1" : "#374151",
                  }}
                >
                  {s.label}
                </div>
                <div style={{ fontSize: "10px", color: "#9ca3af" }}>
                  {s.desc}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Generate button */}
        <button
          onClick={generate}
          disabled={!description.trim() || generating}
          style={{
            width: "100%",
            padding: "13px",
            background:
              description.trim() && !generating
                ? "linear-gradient(135deg, #6366f1, #8b5cf6)"
                : "#e5e7eb",
            color:
              description.trim() && !generating ? "white" : "#9ca3af",
            border: "none",
            borderRadius: "10px",
            fontWeight: 700,
            fontSize: "15px",
            cursor: "pointer",
          }}
        >
          {generating ? "⏳ יוצר תמונה..." : "✨ צור תמונה AI"}
        </button>

        {error && (
          <div
            style={{
              marginTop: "10px",
              padding: "10px 14px",
              background: "#fef2f2",
              border: "1px solid #fecaca",
              borderRadius: "8px",
              fontSize: "13px",
              color: "#dc2626",
            }}
          >
            ⚠️ {error}
          </div>
        )}
      </div>

      {/* Result */}
      {imageUrl && (
        <div
          style={{
            background: "white",
            borderRadius: "14px",
            border: "1px solid #e5e7eb",
            padding: "20px",
            marginBottom: "20px",
          }}
        >
          <div
            style={{ fontWeight: 700, fontSize: "15px", marginBottom: "14px" }}
          >
            ✅ התמונה מוכנה
          </div>

          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={imageUrl}
            alt="Generated"
            style={{
              width: "100%",
              maxHeight: "400px",
              objectFit: "contain",
              borderRadius: "10px",
              border: "1px solid #e5e7eb",
              marginBottom: "14px",
            }}
          />

          <div style={{ display: "flex", gap: "8px" }}>
            <button
              onClick={() => downloadImage(imageUrl)}
              style={{
                flex: 1,
                padding: "10px",
                background: "#6366f1",
                color: "white",
                border: "none",
                borderRadius: "8px",
                fontWeight: 600,
                cursor: "pointer",
                fontSize: "13px",
              }}
            >
              ⬇️ הורד תמונה
            </button>
            <button
              onClick={() => {
                navigator.clipboard.writeText(imageUrl);
              }}
              style={{
                flex: 1,
                padding: "10px",
                background: "#f3f4f6",
                color: "#374151",
                border: "none",
                borderRadius: "8px",
                cursor: "pointer",
                fontSize: "13px",
              }}
            >
              📋 העתק קישור
            </button>
            <button
              onClick={generate}
              style={{
                flex: 1,
                padding: "10px",
                background: "#f3f4f6",
                color: "#374151",
                border: "none",
                borderRadius: "8px",
                cursor: "pointer",
                fontSize: "13px",
              }}
            >
              🔄 נסה שוב
            </button>
          </div>
        </div>
      )}

      {/* Gallery */}
      {gallery.length > 0 && (
        <div
          style={{
            background: "white",
            borderRadius: "14px",
            border: "1px solid #e5e7eb",
            padding: "20px",
          }}
        >
          <div
            style={{ fontWeight: 700, fontSize: "15px", marginBottom: "14px" }}
          >
            🖼️ הגלריה שלי ({gallery.length})
          </div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(3, 1fr)",
              gap: "8px",
            }}
          >
            {gallery.map((img) => (
              <div key={img.id} style={{ position: "relative" }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={img.imageUrl}
                  alt="Saved"
                  onClick={() => {
                    setImageUrl(img.imageUrl);
                    window.scrollTo({ top: 0, behavior: "smooth" });
                  }}
                  style={{
                    width: "100%",
                    aspectRatio: "1",
                    objectFit: "cover",
                    borderRadius: "8px",
                    cursor: "pointer",
                    border: "1px solid #e5e7eb",
                  }}
                />
                {img.platform && (
                  <div
                    style={{
                      position: "absolute",
                      bottom: "4px",
                      right: "4px",
                      background: "rgba(0,0,0,0.6)",
                      color: "white",
                      fontSize: "9px",
                      padding: "2px 6px",
                      borderRadius: "4px",
                    }}
                  >
                    {img.platform}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
