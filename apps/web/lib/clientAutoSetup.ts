/**
 * Auto-setup for newly created clients.
 * Applies industry snapshot blocks, WhatsApp template, and creates an inbox notification.
 */

import { prisma } from "@/lib/prisma";

type SnapBlock = {
  type: string;
  id: string;
  content: Record<string, string>;
  settings: Record<string, string | boolean>;
};

const DEFAULT_SETTINGS = {
  backgroundColor: "#ffffff",
  textColor: "#111827",
  padding: "md",
  alignment: "right",
} as const;

function makeBlocks(s: {
  color: string;
  title: string;
  subtitle: string;
  cta: string;
  f1: string;
  f2: string;
  f3: string;
  waText: string;
}): SnapBlock[] {
  return [
    {
      id: "b1",
      type: "hero",
      content: { title: s.title, subtitle: s.subtitle, cta: s.cta },
      settings: { ...DEFAULT_SETTINGS, backgroundColor: s.color, textColor: "#ffffff", alignment: "center" },
    },
    {
      id: "b2",
      type: "features",
      content: { title: "למה לבחור בנו?", item1Title: s.f1, item1Desc: "", item2Title: s.f2, item2Desc: "", item3Title: s.f3, item3Desc: "" },
      settings: { ...DEFAULT_SETTINGS, backgroundColor: "#f8fafc", alignment: "center" },
    },
    {
      id: "b3",
      type: "form",
      content: { title: "השאר פרטים ונחזור אליך", subtitle: "", button: s.cta },
      settings: { ...DEFAULT_SETTINGS },
    },
    {
      id: "b4",
      type: "whatsapp",
      content: { text: s.waText, phone: "" },
      settings: { ...DEFAULT_SETTINGS, backgroundColor: "#25d366", textColor: "#ffffff", alignment: "center" },
    },
  ];
}

const INDUSTRY_SNAPSHOTS: Record<string, {
  blocks: SnapBlock[];
  landingPageTitle: string;
  landingPageCta: string;
  landingPageColor: string;
  whatsappTemplate: string;
}> = {
  ROOFING: {
    blocks: makeBlocks({ color: "#1e3a5f", title: "גגות מקצועיים — איכות ואמינות", subtitle: "שירות מהיר, מחירים הוגנים, אחריות מלאה", cta: "קבל הצעת מחיר חינם", f1: "✓ אחריות 10 שנה", f2: "✓ מחיר שקוף", f3: "✓ זמינות מיידית", waText: "דבר איתנו עכשיו" }),
    landingPageTitle: "גגות מקצועיים — איכות ואמינות",
    landingPageCta: "קבל הצעת מחיר חינם",
    landingPageColor: "#1e3a5f",
    whatsappTemplate: "שלום {name}! קיבלנו את בקשתך לגגות. ניצור קשר תוך שעה ✅",
  },
  ALUMINUM: {
    blocks: makeBlocks({ color: "#1e3a5f", title: "אלומיניום מקצועי לבית ולעסק", subtitle: "שירות מהיר, מחירים הוגנים, אחריות מלאה", cta: "קבל הצעת מחיר", f1: "✓ ביצוע מקצועי", f2: "✓ חומרי פרמיום", f3: "✓ זמינות מיידית", waText: "דבר איתנו עכשיו" }),
    landingPageTitle: "אלומיניום מקצועי לבית ולעסק",
    landingPageCta: "קבל הצעת מחיר",
    landingPageColor: "#1e3a5f",
    whatsappTemplate: "שלום {name}! קיבלנו את בקשתך. ניצור קשר תוך שעה ✅",
  },
  COSMETICS: {
    blocks: makeBlocks({ color: "#c2185b", title: "טיפולי יופי מתקדמים", subtitle: "תוצאות מדהימות, חוויה בלתי נשכחת", cta: "קביעת תור", f1: "✓ ציוד מקצועי", f2: "✓ מטפלת מוסמכת", f3: "✓ תוצאות מוכחות", waText: "שלחי הודעה עכשיו" }),
    landingPageTitle: "טיפולי יופי מתקדמים",
    landingPageCta: "קביעת תור",
    landingPageColor: "#c2185b",
    whatsappTemplate: "היי {name}! שמחים שפנית אלינו. נחזור אליך לתאם תור 💆‍♀️",
  },
  CLEANING: {
    blocks: makeBlocks({ color: "#00796b", title: "ניקיון מקצועי לבית ולעסק", subtitle: "צוות אמין, מחירים נוחים, תוצאות מושלמות", cta: "קבל הצעת מחיר", f1: "✓ צוות מיומן", f2: "✓ חומרים ידידותיים", f3: "✓ זמינות גמישה", waText: "צור קשר" }),
    landingPageTitle: "ניקיון מקצועי לבית ולעסק",
    landingPageCta: "קבל הצעת מחיר",
    landingPageColor: "#00796b",
    whatsappTemplate: "שלום {name}! קיבלנו פנייתך. ניצור קשר לתאם מועד 🧽",
  },
  REAL_ESTATE: {
    blocks: makeBlocks({ color: "#1565c0", title: "מצא את הנכס המושלם שלך", subtitle: "ניסיון, מקצועיות ותוצאות מוכחות", cta: "השאר פרטים", f1: "✓ ניסיון עשיר", f2: "✓ נכסים בלעדיים", f3: "✓ ליווי אישי", waText: "שלח הודעה" }),
    landingPageTitle: "מצא את הנכס המושלם שלך",
    landingPageCta: "השאר פרטים",
    landingPageColor: "#1565c0",
    whatsappTemplate: "שלום {name}! קיבלתי את פנייתך. אשמח לעזור למצוא את הנכס המתאים 🏠",
  },
  FINANCE: {
    blocks: makeBlocks({ color: "#1a237e", title: "ייעוץ פיננסי מקצועי", subtitle: "נסיון, אמינות ותוצאות מוכחות", cta: "לייעוץ חינם", f1: "✓ רישיון מלא", f2: "✓ ניסיון 15+ שנה", f3: "✓ תוצאות מוכחות", waText: "שאל שאלה עכשיו" }),
    landingPageTitle: "ייעוץ פיננסי מקצועי",
    landingPageCta: "לייעוץ חינם",
    landingPageColor: "#1a237e",
    whatsappTemplate: "שלום {name}! קיבלתי את פנייתך. אחזור אליך לייעוץ בהקדם 📊",
  },
};

const DEFAULT_SNAPSHOT = {
  blocks: makeBlocks({ color: "#4f46e5", title: "ברוכים הבאים לעסק שלנו", subtitle: "שירות מקצועי, אמינות ותוצאות", cta: "צור קשר עכשיו", f1: "✓ שירות אישי", f2: "✓ מחירים הוגנים", f3: "✓ זמינות גבוהה", waText: "דבר איתנו" }),
  landingPageTitle: "ברוכים הבאים לעסק שלנו",
  landingPageCta: "צור קשר עכשיו",
  landingPageColor: "#4f46e5",
  whatsappTemplate: "שלום {name}! קיבלנו את פנייתך. ניצור קשר בהקדם ✅",
};

export async function autoSetupNewClient(client: {
  id: string;
  name: string;
  industry: string | null;
  ownerId: string;
}): Promise<string[]> {
  const actions: string[] = [];

  const snap = INDUSTRY_SNAPSHOTS[client.industry ?? ""] ?? DEFAULT_SNAPSHOT;

  // 1. Apply industry page blocks
  await prisma.client.update({
    where: { id: client.id },
    data: {
      pageBlocks: snap.blocks,
      pagePublished: false,
      landingPageTitle: snap.landingPageTitle,
      landingPageCta: snap.landingPageCta,
      landingPageColor: snap.landingPageColor,
    },
  });
  actions.push("בניתי דף נחיתה מותאם לענף שלך");

  // 2. Set WhatsApp auto-reply template
  await prisma.client.update({
    where: { id: client.id },
    data: {
      whatsappTemplate: snap.whatsappTemplate,
      autoReplyActive: true,
    },
  });
  actions.push("הגדרתי הודעת ברכה אוטומטית לוואצאפ");

  // 3. Create inbox notification for the admin
  try {
    await prisma.inboxEvent.create({
      data: {
        userId: client.ownerId,
        type: "lead",
        title: `לקוח חדש נוסף: ${client.name}`,
        description: "המערכת הכינה דף נחיתה + הודעת וואצאפ — בדוק ופרסם",
        clientId: client.id,
      },
    });
    actions.push("יצרתי התראה בדשבורד");
  } catch {
    // inboxEvent model might not exist on all deployments — non-fatal
  }

  return actions;
}
