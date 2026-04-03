import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession, isSuperAdmin } from "@/lib/auth";
import { slugify } from "@/lib/utils";

type SnapBlock = { type: string; id: string; content: Record<string, string>; settings: Record<string, string> };

const DEFAULT_SETTINGS = { backgroundColor: "#ffffff", textColor: "#111827", padding: "md" as const, alignment: "right" as const };

function makeBlocks(s: { color: string; title: string; subtitle: string; cta: string; f1: string; f2: string; f3: string; waText: string }): SnapBlock[] {
  return [
    { id: "b1", type: "hero",     content: { title: s.title, subtitle: s.subtitle, cta: s.cta },           settings: { ...DEFAULT_SETTINGS, backgroundColor: s.color, textColor: "#ffffff", alignment: "center" } },
    { id: "b2", type: "features", content: { title: "למה לבחור בנו?", item1Title: s.f1, item1Desc: "", item2Title: s.f2, item2Desc: "", item3Title: s.f3, item3Desc: "" }, settings: { ...DEFAULT_SETTINGS, backgroundColor: "#f8fafc", alignment: "center" } },
    { id: "b3", type: "form",     content: { title: "השאר פרטים ונחזור אליך", subtitle: "", button: s.cta }, settings: { ...DEFAULT_SETTINGS } },
    { id: "b4", type: "whatsapp", content: { text: s.waText, phone: "" },                                    settings: { ...DEFAULT_SETTINGS, backgroundColor: "#25d366", textColor: "#ffffff", alignment: "center" } },
  ];
}

// Predefined snapshot data per industry
const SNAPSHOTS: Record<string, {
  whatsappTemplate: string;
  autoReplyActive: boolean;
  landingPageTitle: string;
  landingPageSubtitle: string;
  landingPageCta: string;
  landingPageColor: string;
  blocks: SnapBlock[];
}> = {
  roofing: {
    whatsappTemplate: "שלום {name}! קיבלנו את בקשתך לגגות. ניצור קשר תוך שעה ✅",
    autoReplyActive: true,
    landingPageTitle: "גגות מקצועיים — איכות ואמינות",
    landingPageSubtitle: "שירות מהיר, מחירים הוגנים, אחריות מלאה",
    landingPageCta: "קבל הצעת מחיר חינם",
    landingPageColor: "#1e3a5f",
    blocks: makeBlocks({ color: "#1e3a5f", title: "גגות מקצועיים", subtitle: "שירות מהיר ואמין", cta: "קבל הצעת מחיר", f1: "✓ אחריות 10 שנה", f2: "✓ מחיר שקוף", f3: "✓ זמינות מיידית", waText: "דבר איתנו עכשיו" }),
  },
  cosmetics: {
    whatsappTemplate: "היי {name}! שמחים שפנית אלינו. נחזור אליך לתאם תור 💆‍♀️",
    autoReplyActive: true,
    landingPageTitle: "טיפולי יופי מתקדמים",
    landingPageSubtitle: "תוצאות מדהימות, חוויה בלתי נשכחת",
    landingPageCta: "קביעת תור",
    landingPageColor: "#c2185b",
    blocks: makeBlocks({ color: "#c2185b", title: "טיפולי יופי מתקדמים", subtitle: "לעור בריא ומזהיר", cta: "קבעי תור", f1: "✓ ציוד מקצועי", f2: "✓ מטפלת מוסמכת", f3: "✓ תוצאות מוכחות", waText: "שלחי הודעה עכשיו" }),
  },
  cleaning: {
    whatsappTemplate: "שלום {name}! קיבלנו פנייתך. ניצור קשר לתאם מועד 🧽",
    autoReplyActive: true,
    landingPageTitle: "ניקיון מקצועי לבית ולעסק",
    landingPageSubtitle: "צוות אמין, מחירים נוחים, תוצאות מושלמות",
    landingPageCta: "קבל הצעת מחיר",
    landingPageColor: "#00796b",
    blocks: makeBlocks({ color: "#00796b", title: "ניקיון מקצועי", subtitle: "אמין, מהיר, יסודי", cta: "קבל הצעה", f1: "✓ צוות מיומן", f2: "✓ חומרים ידידותיים", f3: "✓ זמינות גמישה", waText: "צור קשר" }),
  },
  real_estate: {
    whatsappTemplate: "שלום {name}! קיבלתי את פנייתך. אשמח לעזור למצוא את הנכס המתאים 🏠",
    autoReplyActive: true,
    landingPageTitle: "מצא את הנכס המושלם שלך",
    landingPageSubtitle: "ניסיון, מקצועיות ותוצאות מוכחות",
    landingPageCta: "השאר פרטים",
    landingPageColor: "#1565c0",
    blocks: makeBlocks({ color: "#1565c0", title: 'סוכן הנדל"ן שלך', subtitle: "מקצועיות ואמינות", cta: "צור קשר", f1: "✓ ניסיון עשיר", f2: "✓ נכסים בלעדיים", f3: "✓ ליווי אישי", waText: "שלח הודעה" }),
  },
  general: {
    whatsappTemplate: "שלום {name}! קיבלנו את פנייתך. ניצור קשר בהקדם ✅",
    autoReplyActive: true,
    landingPageTitle: "ברוכים הבאים לעסק שלנו",
    landingPageSubtitle: "שירות מקצועי, אמינות ותוצאות",
    landingPageCta: "צור קשר עכשיו",
    landingPageColor: "#4f46e5",
    blocks: makeBlocks({ color: "#4f46e5", title: "השירות המקצועי שלנו", subtitle: "אמינות, מקצועיות ותוצאות מוכחות", cta: "צור קשר", f1: "✓ שירות אישי", f2: "✓ מחירים הוגנים", f3: "✓ זמינות גבוהה", waText: "דבר איתנו" }),
  },
  construction: {
    whatsappTemplate: "שלום {name}! קיבלנו את בקשתך לבנייה. ניצור קשר תוך שעה ✅",
    autoReplyActive: true,
    landingPageTitle: "בנייה וקבלנות מקצועית",
    landingPageSubtitle: "קבלן מוסמך, אחריות מלאה, מחיר שקוף",
    landingPageCta: "קבל הצעת מחיר חינם",
    landingPageColor: "#374151",
    blocks: makeBlocks({ color: "#374151", title: "בנייה וקבלנות", subtitle: "קבלן מוסמך ואמין", cta: "קבל הצעת מחיר", f1: "✓ רישיון קבלן מוסמך", f2: "✓ אחריות 5 שנה", f3: "✓ ביטוח מלא", waText: "שלח הודעה עכשיו" }),
  },
  cleaning_pro: {
    whatsappTemplate: "שלום {name}! שמחים שפנית אלינו לניקיון מקצועי. ניצור קשר לתאם 🧽",
    autoReplyActive: true,
    landingPageTitle: "ניקיון מקצועי Pro",
    landingPageSubtitle: "חומרים ידידותיים לסביבה, תוצאות מושלמות",
    landingPageCta: "קבל הצעת מחיר מיידית",
    landingPageColor: "#0f766e",
    blocks: makeBlocks({ color: "#0f766e", title: "ניקיון מקצועי Pro", subtitle: "חומרים ירוקים, תוצאות מקסימליות", cta: "קבל הצעה", f1: "✓ חומרים ידידותיים", f2: "✓ צוות מוסמך", f3: "✓ הצעת מחיר מיידית", waText: "צור קשר" }),
  },
  agent_personal: {
    whatsappTemplate: "שלום {name}! אני {agentName} ואשמח לעזור לך למצוא את הנכס המושלם 🤝",
    autoReplyActive: true,
    landingPageTitle: "סוכן הנדל\"ן האישי שלך",
    landingPageSubtitle: "ליווי אישי לאורך כל הדרך",
    landingPageCta: "קבע פגישת ייעוץ",
    landingPageColor: "#4338ca",
    blocks: makeBlocks({ color: "#4338ca", title: "סוכן נדל\"ן אישי", subtitle: "ניסיון, אמינות, תוצאות", cta: "צור קשר", f1: "✓ ליווי אישי", f2: "✓ נכסים בלעדיים", f3: "✓ ייעוץ ללא עלות", waText: "שלח הודעה" }),
  },
  realestate_office: {
    whatsappTemplate: "שלום {name}! קיבלנו פנייתך למשרד הנדל\"ן שלנו. סוכן יחזור אליך בהקדם 🏢",
    autoReplyActive: true,
    landingPageTitle: "משרד נדל\"ן מוביל",
    landingPageSubtitle: "עשרות סוכנים, אלפי נכסים, תוצאות מוכחות",
    landingPageCta: "חפש נכסים",
    landingPageColor: "#1e40af",
    blocks: makeBlocks({ color: "#1e40af", title: "משרד נדל\"ן", subtitle: "המשרד המוביל באזורך", cta: "צור קשר", f1: "✓ צוות מנוסה", f2: "✓ אלפי נכסים", f3: "✓ ליווי משפטי", waText: "דבר איתנו" }),
  },
  beauty_salon: {
    whatsappTemplate: "היי {name}! שמחים שפנית לסלון שלנו. ניצור קשר לתאם תור 💅",
    autoReplyActive: true,
    landingPageTitle: "סלון היופי שלך",
    landingPageSubtitle: "טיפולים מתקדמים, חוויה בלתי נשכחת",
    landingPageCta: "קביעת תור אונליין",
    landingPageColor: "#be185d",
    blocks: makeBlocks({ color: "#be185d", title: "סלון יופי", subtitle: "עיצוב, טיפוח ויופי", cta: "קבעי תור", f1: "✓ מעצבות מוסמכות", f2: "✓ מוצרים פרימיום", f3: "✓ אווירה נעימה", waText: "שלחי הודעה" }),
  },
  fitness_trainer: {
    whatsappTemplate: "שלום {name}! קיבלתי את פנייתך. אשמח לעזור לך להגיע ליעדים שלך 💪",
    autoReplyActive: true,
    landingPageTitle: "מאמן הכושר האישי שלך",
    landingPageSubtitle: "תוכנית אימון מותאמת אישית, תוצאות מוכחות",
    landingPageCta: "קבל אימון ניסיון חינם",
    landingPageColor: "#dc2626",
    blocks: makeBlocks({ color: "#dc2626", title: "מאמן כושר אישי", subtitle: "יעדים ברורים, תוצאות אמיתיות", cta: "אימון ניסיון חינם", f1: "✓ תוכנית אישית", f2: "✓ תזונה + אימון", f3: "✓ מעקב שבועי", waText: "צור קשר" }),
  },
};

const WHATSAPP_TEMPLATES: Record<string, Array<{ type: string; content: string }>> = {
  roofing: [
    { type: "WHATSAPP_NEW_LEAD", content: "🏠 ליד חדש! {{name}} מחפש שירות גגות. טלפון: {{phone}}" },
    { type: "WHATSAPP_FOLLOWUP", content: "שלום {{name}}, רצינו לבדוק אם יש לך שאלות לגבי הצעת המחיר שלנו 😊" },
  ],
  cosmetics: [
    { type: "WHATSAPP_NEW_LEAD", content: "💄 לקוחה חדשה! {{name}} מתעניינת בטיפולים. טלפון: {{phone}}" },
    { type: "WHATSAPP_FOLLOWUP", content: "שלום {{name}}, איך הרגשת אחרי הטיפול? נשמח לשמוע 💕" },
  ],
  cleaning: [
    { type: "WHATSAPP_NEW_LEAD", content: "🧹 ליד חדש! {{name}} צריך ניקיון. טלפון: {{phone}}" },
    { type: "WHATSAPP_FOLLOWUP", content: "שלום {{name}}, שמענו שביקשת ניקיון — עדיין מתעניינת?" },
  ],
  real_estate: [
    { type: "WHATSAPP_NEW_LEAD", content: "🏡 ליד חדש! {{name}} מחפש נכס. טלפון: {{phone}}" },
    { type: "WHATSAPP_FOLLOWUP", content: "שלום {{name}}, נזכרתי בך — האם עדיין מחפש נכס?" },
  ],
  general: [
    { type: "WHATSAPP_NEW_LEAD", content: "✅ ליד חדש! {{name}} פנה אלינו. טלפון: {{phone}}" },
    { type: "WHATSAPP_FOLLOWUP", content: "שלום {{name}}, רצינו לבדוק אם יש לך שאלות נוספות 😊" },
  ],
  construction: [
    { type: "WHATSAPP_NEW_LEAD", content: "🏗️ ליד חדש! {{name}} צריך שירות בנייה. טלפון: {{phone}}" },
    { type: "WHATSAPP_FOLLOWUP", content: "שלום {{name}}, האם עדיין מחפש קבלן מוסמך? נשמח לעזור 🔨" },
  ],
  cleaning_pro: [
    { type: "WHATSAPP_NEW_LEAD", content: "✨ ליד חדש! {{name}} צריך ניקיון מקצועי. טלפון: {{phone}}" },
    { type: "WHATSAPP_FOLLOWUP", content: "שלום {{name}}, עדיין מתעניין בשירות הניקיון שלנו? 🧹" },
  ],
  agent_personal: [
    { type: "WHATSAPP_NEW_LEAD", content: "🤝 ליד חדש! {{name}} מחפש סוכן נדל\"ן. טלפון: {{phone}}" },
    { type: "WHATSAPP_FOLLOWUP", content: "שלום {{name}}, האם עדיין מחפש נכס? יש לי נכסים חדשים שעשויים להתאים לך 🏡" },
  ],
  realestate_office: [
    { type: "WHATSAPP_NEW_LEAD", content: "🏢 ליד חדש! {{name}} פנה למשרד. טלפון: {{phone}}" },
    { type: "WHATSAPP_FOLLOWUP", content: "שלום {{name}}, נזכרנו בך — האם עדיין מחפש נכס? יש לנו נכסים חדשים 🏠" },
  ],
  beauty_salon: [
    { type: "WHATSAPP_NEW_LEAD", content: "💅 לקוחה חדשה! {{name}} רוצה לקבוע תור. טלפון: {{phone}}" },
    { type: "WHATSAPP_FOLLOWUP", content: "היי {{name}}, רצינו לבדוק איך היה הטיפול ואם תרצי לקבוע תור הבא 💕" },
  ],
  fitness_trainer: [
    { type: "WHATSAPP_NEW_LEAD", content: "💪 ליד חדש! {{name}} מתעניין באימון אישי. טלפון: {{phone}}" },
    { type: "WHATSAPP_FOLLOWUP", content: "שלום {{name}}, עדיין רוצה להתחיל להתאמן? מחכה לך לאימון ניסיון חינם 🏋️" },
  ],
};

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => ({})) as { clientId?: string; snapshotKey?: string };
  const { clientId, snapshotKey } = body;

  if (!clientId || !snapshotKey) {
    return NextResponse.json({ error: "חסרים פרמטרים" }, { status: 400 });
  }

  const snap = SNAPSHOTS[snapshotKey];
  if (!snap) return NextResponse.json({ error: "תבנית לא נמצאה" }, { status: 404 });

  // Ownership check
  const client = await prisma.client.findUnique({
    where: { id: clientId },
    select: { id: true, name: true, slug: true, ownerId: true },
  });
  if (!client) return NextResponse.json({ error: "לקוח לא נמצא" }, { status: 404 });
  if (!isSuperAdmin(session) && client.ownerId !== session.userId) {
    return NextResponse.json({ error: "אין הרשאה" }, { status: 403 });
  }

  // Apply snapshot data to client
  await prisma.client.update({
    where: { id: clientId },
    data: {
      whatsappTemplate:    snap.whatsappTemplate,
      autoReplyActive:     snap.autoReplyActive,
      landingPageTitle:    snap.landingPageTitle,
      landingPageSubtitle: snap.landingPageSubtitle,
      landingPageCta:      snap.landingPageCta,
      landingPageColor:    snap.landingPageColor,
      pageBlocks:          JSON.parse(JSON.stringify(snap.blocks)),
      pagePublished:       true,
    },
  });

  // Create/update WhatsApp message templates
  const templates = WHATSAPP_TEMPLATES[snapshotKey] ?? [];
  for (const tpl of templates) {
    await prisma.messageTemplate.upsert({
      where: { userId_type: { userId: session.userId, type: tpl.type } },
      create: { userId: session.userId, type: tpl.type, content: tpl.content },
      update: { content: tpl.content },
    });
  }

  // Create a CLIENT_ONBOARDING intake form for this client
  const formSlug = slugify(`onboarding-${client.slug}-${Date.now()}`);
  await prisma.leadForm.upsert({
    where: { clientId_slug: { clientId, slug: "onboarding" } },
    create: {
      name: `טופס קבלת לקוח — ${client.name}`,
      slug: "onboarding",
      formType: "CLIENT_ONBOARDING",
      clientId,
      thankYouMessage: "תודה! ניצור איתך קשר בהקדם.",
    },
    update: { name: `טופס קבלת לקוח — ${client.name}` },
  });
  void formSlug; // suppress unused warning

  return NextResponse.json({ ok: true, previewUrl: `/${client.slug}` });
}
