import { Block } from "@/types/builder";

export type IndustryTemplate = {
  id: string;
  label: string;
  blocks: Block[];
};

export const INDUSTRY_TEMPLATES: IndustryTemplate[] = [
  {
    id: "roofing",
    label: "🏠 גגות ואיטום",
    blocks: [
      {
        id: "t-hero-1",
        type: "hero",
        content: {
          title: "גגות מקצועיים",
          subtitle: "שירות אמין ומהיר עם אחריות מלאה",
          cta: "צור קשר עכשיו",
          ctaColor: "#2563eb",
        },
        settings: { padding: "lg", alignment: "center", backgroundColor: "#1e3a5f", textColor: "#ffffff" },
      },
      {
        id: "t-features-1",
        type: "features",
        content: {
          f1_emoji: "✅",
          f1_title: "איכות גבוהה",
          f1_desc: "חומרים מהשורה הראשונה ועבודה מדויקת",
          f2_emoji: "⚡",
          f2_title: "מהירות ביצוע",
          f2_desc: "סיום עבודה בזמנים קצרים",
          f3_emoji: "🏆",
          f3_title: "אחריות מלאה",
          f3_desc: "אחריות של שנים על כל עבודה",
        },
        settings: { padding: "lg", alignment: "center" },
      },
      {
        id: "t-form-1",
        type: "form",
        content: {
          title: "קבל הצעת מחיר חינם",
          button: "שלח פנייה",
          buttonColor: "#2563eb",
          successMessage: "תודה! ניצור איתך קשר תוך שעה",
        },
        settings: { padding: "lg", alignment: "center" },
      },
      {
        id: "t-whatsapp-1",
        type: "whatsapp",
        content: {
          text: "שלח לנו וואצאפ",
          message: "היי, אשמח לקבל הצעת מחיר לגג",
          sticky: "true",
        },
        settings: { padding: "md", alignment: "center" },
      },
    ],
  },
  {
    id: "cosmetics",
    label: "💄 קוסמטיקה ויופי",
    blocks: [
      {
        id: "t-hero-2",
        type: "hero",
        content: {
          title: "היופי שלך מתחיל כאן",
          subtitle: "טיפולי יופי מתקדמים בידיים מקצועיות",
          cta: "קבע תור עכשיו",
          ctaColor: "#ec4899",
        },
        settings: { padding: "lg", alignment: "center", backgroundColor: "#fdf2f8", textColor: "#831843" },
      },
      {
        id: "t-features-2",
        type: "features",
        content: {
          f1_emoji: "💎",
          f1_title: "טיפולים מתקדמים",
          f1_desc: "טכנולוגיות חדשניות לתוצאות מושלמות",
          f2_emoji: "🌿",
          f2_title: "מוצרים טבעיים",
          f2_desc: "רק מוצרים באיכות הגבוהה ביותר",
          f3_emoji: "⭐",
          f3_title: "ניסיון של שנים",
          f3_desc: "מאות לקוחות מרוצים",
        },
        settings: { padding: "lg", alignment: "center" },
      },
      {
        id: "t-gallery-2",
        type: "gallery",
        content: { img1: "", img2: "", img3: "", img4: "" },
        settings: { padding: "md", alignment: "center" },
      },
      {
        id: "t-form-2",
        type: "form",
        content: {
          title: "השאירו פרטים ונחזור אליכם",
          button: "קבע תור",
          buttonColor: "#ec4899",
          successMessage: "תודה! נחזור אליך בהקדם",
        },
        settings: { padding: "lg", alignment: "center" },
      },
      {
        id: "t-whatsapp-2",
        type: "whatsapp",
        content: {
          text: "שלחו לנו וואצאפ",
          message: "היי, אשמח לקבוע תור",
          sticky: "true",
        },
        settings: { padding: "md", alignment: "center" },
      },
    ],
  },
  {
    id: "cleaning",
    label: "🧹 ניקיון",
    blocks: [
      {
        id: "t-hero-3",
        type: "hero",
        content: {
          title: "שירותי ניקיון מקצועיים",
          subtitle: "נקיון יסודי לבית ולעסק",
          cta: "הזמן שירות",
          ctaColor: "#059669",
        },
        settings: { padding: "lg", alignment: "center", backgroundColor: "#ecfdf5", textColor: "#064e3b" },
      },
      {
        id: "t-features-3",
        type: "features",
        content: {
          f1_emoji: "✨",
          f1_title: "ניקיון יסודי",
          f1_desc: "תשומת לב לכל פרט",
          f2_emoji: "🕐",
          f2_title: "זמינות גבוהה",
          f2_desc: "שירות 7 ימים בשבוע",
          f3_emoji: "💯",
          f3_title: "שביעות רצון מלאה",
          f3_desc: "אחריות על כל עבודה",
        },
        settings: { padding: "lg", alignment: "center" },
      },
      {
        id: "t-form-3",
        type: "form",
        content: {
          title: "קבל הצעת מחיר",
          button: "שלח בקשה",
          buttonColor: "#059669",
          successMessage: "תודה! נחזור אליך בקרוב",
        },
        settings: { padding: "lg", alignment: "center" },
      },
      {
        id: "t-whatsapp-3",
        type: "whatsapp",
        content: {
          text: "וואצאפ לנו עכשיו",
          message: "שלום, אשמח לקבל הצעת מחיר לניקיון",
          sticky: "true",
        },
        settings: { padding: "md", alignment: "center" },
      },
    ],
  },
  {
    id: "real_estate",
    label: "🏢 נדל\"ן",
    blocks: [
      {
        id: "t-hero-4",
        type: "hero",
        content: {
          title: "הנכס המושלם מחכה לך",
          subtitle: "ליווי מקצועי בקנייה ומכירה של נדל\"ן",
          cta: "חפש נכסים",
          ctaColor: "#7c3aed",
        },
        settings: { padding: "lg", alignment: "center", backgroundColor: "#2e1065", textColor: "#ffffff" },
      },
      {
        id: "t-features-4",
        type: "features",
        content: {
          f1_emoji: "🏠",
          f1_title: "מגוון נכסים",
          f1_desc: "דירות, בתים, פנטהאוזים ועוד",
          f2_emoji: "🤝",
          f2_title: "ליווי אישי",
          f2_desc: "סוכן מקצועי שמלווה אותך בכל שלב",
          f3_emoji: "📈",
          f3_title: "מחירים הוגנים",
          f3_desc: "הערכת שווי מקצועית וחינמית",
        },
        settings: { padding: "lg", alignment: "center" },
      },
      {
        id: "t-form-4",
        type: "form",
        content: {
          title: "מחפש נכס? השאר פרטים",
          button: "שלח פנייה",
          buttonColor: "#7c3aed",
          successMessage: "תודה! הסוכן שלנו יחזור אליך בהקדם",
        },
        settings: { padding: "lg", alignment: "center" },
      },
      {
        id: "t-whatsapp-4",
        type: "whatsapp",
        content: {
          text: "דבר עם סוכן בוואצאפ",
          message: "היי, אני מחפש נכס ואשמח לשמוע פרטים",
          sticky: "true",
        },
        settings: { padding: "md", alignment: "center" },
      },
    ],
  },
];
