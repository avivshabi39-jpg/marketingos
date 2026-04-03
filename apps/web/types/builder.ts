export type BlockType =
  | "hero"
  | "text"
  | "image"
  | "form"
  | "features"
  | "testimonial"
  | "cta"
  | "whatsapp"
  | "gallery";

export type Block = {
  id: string;
  type: BlockType;
  content: Record<string, string>;
  settings: {
    backgroundColor?: string;
    textColor?: string;
    padding?: "sm" | "md" | "lg";
    alignment?: "right" | "center" | "left";
  };
};

export type BlockDefinition = {
  type: BlockType;
  label: string;
  icon: string;
  category: "basic" | "conversion" | "content";
  defaultContent: Record<string, string>;
  defaultSettings: Block["settings"];
};

export const BLOCK_DEFINITIONS: BlockDefinition[] = [
  {
    type: "hero",
    label: "Hero",
    icon: "🏠",
    category: "basic",
    defaultContent: {
      title: "כותרת ראשית",
      subtitle: "תיאור קצר של השירות שלך",
      cta: "צור קשר",
      ctaColor: "#2563eb",
    },
    defaultSettings: { padding: "lg", alignment: "center" },
  },
  {
    type: "text",
    label: "טקסט",
    icon: "📝",
    category: "basic",
    defaultContent: { text: "הוסף טקסט כאן..." },
    defaultSettings: { padding: "md", alignment: "right" },
  },
  {
    type: "image",
    label: "תמונה",
    icon: "🖼️",
    category: "basic",
    defaultContent: { url: "", alt: "תיאור תמונה" },
    defaultSettings: { padding: "md", alignment: "center" },
  },
  {
    type: "form",
    label: "טופס",
    icon: "📋",
    category: "conversion",
    defaultContent: {
      title: "השאר פרטים",
      button: "שלח פנייה",
      buttonColor: "#2563eb",
      successMessage: "תודה! נחזור אליך בהקדם",
    },
    defaultSettings: { padding: "lg", alignment: "center" },
  },
  {
    type: "cta",
    label: "CTA",
    icon: "🎯",
    category: "conversion",
    defaultContent: {
      title: "מוכנים להתחיל?",
      button: "צור קשר עכשיו",
      buttonColor: "#2563eb",
    },
    defaultSettings: {
      padding: "lg",
      alignment: "center",
      backgroundColor: "#1e40af",
      textColor: "#ffffff",
    },
  },
  {
    type: "whatsapp",
    label: "וואצאפ",
    icon: "💬",
    category: "conversion",
    defaultContent: {
      text: "שלח לנו הודעה בוואצאפ",
      message: "היי, אשמח לשמוע פרטים נוספים",
      sticky: "true",
    },
    defaultSettings: { padding: "md", alignment: "center" },
  },
  {
    type: "features",
    label: "יתרונות",
    icon: "⭐",
    category: "content",
    defaultContent: {
      f1_emoji: "✅",
      f1_title: "יתרון ראשון",
      f1_desc: "תיאור קצר של היתרון",
      f2_emoji: "⚡",
      f2_title: "יתרון שני",
      f2_desc: "תיאור קצר של היתרון",
      f3_emoji: "🏆",
      f3_title: "יתרון שלישי",
      f3_desc: "תיאור קצר של היתרון",
    },
    defaultSettings: { padding: "lg", alignment: "center" },
  },
  {
    type: "testimonial",
    label: "המלצה",
    icon: "💬",
    category: "content",
    defaultContent: {
      quote: "שירות מעולה, ממליץ בחום!",
      author: "ישראל ישראלי",
      role: "לקוח מרוצה",
    },
    defaultSettings: { padding: "lg", alignment: "center" },
  },
  {
    type: "gallery",
    label: "גלריה",
    icon: "🎨",
    category: "content",
    defaultContent: {
      img1: "",
      img2: "",
      img3: "",
      img4: "",
    },
    defaultSettings: { padding: "md", alignment: "center" },
  },
];

export const PADDING_MAP = { sm: "py-6 px-4", md: "py-12 px-6", lg: "py-20 px-8" };
