"use client";

import { useState } from "react";

interface ClientData {
  id: string;
  name: string;
  slug: string;
  pagePublished: boolean;
  autoReplyActive: boolean;
  greenApiInstanceId: string | null;
}

const FAQ_SECTIONS = [
  {
    id: "getting_started",
    icon: "🚀",
    title: "התחלה מהירה",
    color: "#6366f1",
    faqs: [
      {
        q: "איך מתחילים להשתמש במערכת?",
        a: `שלושה צעדים ראשונים:
1. 🧙 בנה את הדף שלך — לחץ "בנה דף" בתפריט ועקוב אחרי 15 השאלות
2. 💬 חבר WhatsApp — הכנס פרטי Green API בהגדרות
3. 📢 שתף את הקישור — שלח ללקוחות שלך

זה הכל! מהרגע שהדף עולה — לידים מגיעים אוטומטית.`,
      },
      {
        q: "איך בונים דף נחיתה?",
        a: `לחץ על "🧙 בנה דף" בתפריט.

המערכת תשאל אותך 15 שאלות על העסק שלך:
- שם העסק ותחום
- מה הבעיה שאתה פותר
- מה היתרונות שלך
- המלצות לקוחות
- פרטי קשר

אחרי שתענה — AI יבנה לך דף מקצועי תוך דקות!`,
      },
      {
        q: "איך מקבלים לידים?",
        a: `כשמישהו ממלא את הטופס בדף שלך:
1. הליד מופיע מיידית תחת "לידים" 🎯
2. קבל התראה לטלפון 🔔
3. וואצאפ אוטומטי נשלח ללקוח 💬

כל הלידים שמורים אוטומטית — לא תפספס אף אחד!`,
      },
    ],
  },
  {
    id: "leads",
    icon: "🎯",
    title: "ניהול לידים",
    color: "#22c55e",
    faqs: [
      {
        q: "מה עושים עם ליד חדש?",
        a: `1. נכנס ללידים → לחץ על הליד
2. התקשר / שלח וואצאפ בלחיצה אחת
3. שנה סטטוס: חדש → נוצר קשר → מתאים → סגור
4. הוסף הערות לשיחה

טיפ של מיכאל: "ליד שמקבל תגובה תוך 5 דקות — סוגר פי 3 יותר! ⚡"`,
      },
      {
        q: "איך לשלוח וואצאפ ללידים?",
        a: `שתי דרכים:

1. ליד בודד: לחץ על הכפתור 💬 ליד שם הליד
2. שידור לכולם: לחץ "📢 שידור" בתפריט

לשידור — בחר קהל (כולם / חדשים / נוצר קשר) וכתוב הודעה.
AI יכתוב לך הודעה מנצחת!`,
      },
      {
        q: "מה עושים עם ליד שלא עונה?",
        a: `המערכת עושה זה אוטומטית:
- יום 1: followup אוטומטי
- יום 3: נסיון שני

אבל אתה יכול גם:
1. שלח הודעה אישית עם הצעה מיוחדת
2. שנה סטטוס ל"לא רלוונטי" אם לא מתאים
3. בקש ביקורת גוגל אם הוא לקוח עבר

טיפ: "אל תוותר לפני 5 נסיונות!" — מיכאל`,
      },
    ],
  },
  {
    id: "whatsapp",
    icon: "💬",
    title: "WhatsApp",
    color: "#25d366",
    faqs: [
      {
        q: "איך מחברים WhatsApp?",
        a: `3 צעדים פשוטים:

1. פתח green-api.com → הירשם חינם
2. צור "Instance" → העתק Instance ID + Token
3. הכנס בהגדרות → WhatsApp → שמור → בדוק חיבור

הסריקה: פתח וואצאפ בנייד → תפריט → מכשירים מקושרים → סרוק QR

ברגע שמחובר — כל ליד מקבל הודעה אוטומטית! 🎉`,
      },
      {
        q: "למה הוואצאפ לא עובד?",
        a: `בדוק לפי הסדר:

1. ✅ האם ה-Instance פעיל ב-green-api.com?
2. ✅ האם הסרקת QR חדש (פג תוקף אחרי 48 שעות)?
3. ✅ האם הכנסת את ה-Instance ID ו-Token נכון?
4. ✅ האם הוואצאפ שלך מחובר לאינטרנט?

אם עדיין לא עובד: לחץ "בדוק חיבור" בהגדרות ובדוק מה הסטטוס.`,
      },
      {
        q: "כמה הודעות אפשר לשלוח?",
        a: `בתוכנית הנוכחית:
- שידורים: עד 100 הודעות ביום
- הודעות בודדות: ללא הגבלה
- Auto-reply: ללא הגבלה

טיפ חשוב: שלח הודעות עם תוכן אמיתי ולא ספאם — וואצאפ עלול לחסום מספרים שמשלחים ספאם.`,
      },
    ],
  },
  {
    id: "page",
    icon: "🌐",
    title: "דף הנחיתה",
    color: "#8b5cf6",
    faqs: [
      {
        q: "איך עורכים את הדף?",
        a: `שתי דרכים:

1. עריכה פשוטה: לחץ "✏️ ערוך דף" → שנה טקסטים ישירות
2. בנייה מחדש: לחץ "🧙 בנה דף" → עקוב אחרי השאלות שוב

בעריכה: לחץ על כל בלוק → שנה → "שמור" → "פרסם" ✅`,
      },
      {
        q: "איך הדף עולה בגוגל?",
        a: `המערכת עושה SEO אוטומטי:
✅ כותרת ותיאור לגוגל
✅ Meta description
✅ Sitemap.xml
✅ JSON-LD (עסק מקומי)
✅ Open Graph (שיתוף ברשתות)

כדי לשפר:
1. הגדרות → הדף שלי → כתוב כותרת SEO טובה
2. הוסף מילות מפתח של התחום שלך
3. שתף את הקישור בכל מקום אפשרי

גוגל יאנדקס את הדף תוך 24-48 שעות.`,
      },
      {
        q: "מה הקישור לדף שלי?",
        a: `מצא אותו ב:
- הגדרות → הדף שלי → הקישור שלך
- לחץ "📋 העתק" לשיתוף מהיר

איפה לשתף:
📱 סיגנטורת מייל | 💼 ביו אינסטגרם
📘 פייסבוק | 💬 סטטוס וואצאפ | 🗺️ גוגל ביז`,
      },
    ],
  },
  {
    id: "ai",
    icon: "🤖",
    title: "הסוכן AI",
    color: "#f59e0b",
    faqs: [
      {
        q: "מה הסוכן AI יכול לעשות?",
        a: `מיכאל — הסוכן שלך — יכול:

📝 לכתוב עבורך:
- פוסטים לפייסבוק/אינסטגרם
- הודעות וואצאפ
- מיילים מכירה
- סקריפט מכירה טלפוני

📊 לנתח:
- ביצועי הלידים שלך
- SWOT לעסק
- המלצות שיפור

⚡ לבצע:
- לבנות דף נחיתה
- לשלוח שידור וואצאפ
- ליצור דוח ביצועים`,
      },
      {
        q: "איך לשאול את הסוכן?",
        a: `פשוט דבר איתו בטבעיות:

✅ "תכתוב לי פוסט פייסבוק על מבצע קיץ"
✅ "כמה לידים יש לי החודש?"
✅ "תשלח שידור לכל הלידים החדשים"
✅ "תעשה לי ניתוח SWOT לעסק"
✅ "תכתוב סקריפט מכירה לשיחות קרות"

הסוכן ישאל אותך שאלות לפני כל פעולה — ענה ותקבל תוצאות מדויקות! 🎯`,
      },
    ],
  },
];

const QUICK_GUIDES = [
  {
    icon: "🚀",
    title: "5 דקות להתחלה",
    steps: [
      'לחץ "🧙 בנה דף" ועקוב אחרי 15 השאלות',
      "חבר WhatsApp בהגדרות (3 דקות)",
      "שתף את הקישור בוואצאפ שלך",
      "המתן ללידים הראשונים! 🎉",
    ],
    color: "#6366f1",
  },
  {
    icon: "📈",
    title: "להכפיל לידים",
    steps: [
      "שתף הקישור בכל הרשתות",
      "הוסף לסיגנטורת המייל שלך",
      "שלח שידור וואצאפ ללקוחות קיימים",
      "בקש מלקוחות מרוצים לשתף",
    ],
    color: "#22c55e",
  },
  {
    icon: "💰",
    title: "לסגור יותר עסקאות",
    steps: [
      "הפעל חזרה אוטומטית ללידים",
      "חזור לכל ליד תוך 5 דקות",
      "השתמש בסקריפט המכירה של מיכאל",
      "בקש ביקורת גוגל מלקוחות סגורים",
    ],
    color: "#f59e0b",
  },
];

export function PortalHelpClient({ client }: { client: ClientData }) {
  const [activeSection, setActiveSection] = useState<string | null>(null);
  const [openFaq, setOpenFaq] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const filteredSections = search
    ? FAQ_SECTIONS.map((s) => ({
        ...s,
        faqs: s.faqs.filter(
          (f) => f.q.includes(search) || f.a.includes(search)
        ),
      })).filter((s) => s.faqs.length > 0)
    : activeSection
      ? FAQ_SECTIONS.filter((s) => s.id === activeSection)
      : FAQ_SECTIONS;

  return (
    <div style={{ padding: "16px", direction: "rtl", maxWidth: "700px" }}>
      {/* Header */}
      <div style={{ marginBottom: "20px" }}>
        <h1 style={{ fontSize: "20px", fontWeight: 800, margin: 0 }}>
          💡 מרכז עזרה
        </h1>
        <p style={{ fontSize: "13px", color: "#6b7280", margin: "4px 0 0" }}>
          כל התשובות שאתה צריך — במקום אחד
        </p>
      </div>

      {/* Quick guides */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: "10px",
          marginBottom: "20px",
        }}
      >
        {QUICK_GUIDES.map((guide) => (
          <div
            key={guide.title}
            style={{
              background: "white",
              borderRadius: "12px",
              border: `2px solid ${guide.color}30`,
              padding: "14px",
            }}
          >
            <div style={{ fontSize: "24px", marginBottom: "6px" }}>
              {guide.icon}
            </div>
            <div
              style={{
                fontWeight: 700,
                fontSize: "13px",
                color: guide.color,
                marginBottom: "8px",
              }}
            >
              {guide.title}
            </div>
            {guide.steps.map((step, i) => (
              <div
                key={i}
                style={{
                  fontSize: "11px",
                  color: "#6b7280",
                  padding: "3px 0",
                  borderBottom:
                    i < guide.steps.length - 1
                      ? "1px solid #f3f4f6"
                      : "none",
                  display: "flex",
                  gap: "6px",
                }}
              >
                <span style={{ color: guide.color, fontWeight: 700 }}>
                  {i + 1}.
                </span>
                {step}
              </div>
            ))}
          </div>
        ))}
      </div>

      {/* Ask Michael banner */}
      <div
        style={{
          background: "linear-gradient(135deg, #1e293b, #334155)",
          borderRadius: "14px",
          padding: "16px 18px",
          marginBottom: "20px",
          color: "white",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <div>
          <div
            style={{ fontWeight: 700, fontSize: "15px", marginBottom: "4px" }}
          >
            🤖 שאל את מיכאל ישירות
          </div>
          <p style={{ fontSize: "12px", opacity: 0.8, margin: 0 }}>
            60 שנות ניסיון — תשובה מיידית לכל שאלה
          </p>
        </div>
        <a
          href={`/client/${client.slug}/ai-agent`}
          style={{
            padding: "10px 20px",
            background: "#6366f1",
            color: "white",
            borderRadius: "10px",
            textDecoration: "none",
            fontWeight: 700,
            fontSize: "13px",
            whiteSpace: "nowrap",
          }}
        >
          דבר עם מיכאל →
        </a>
      </div>

      {/* Search */}
      <div style={{ marginBottom: "14px" }}>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="🔍 חפש בשאלות נפוצות..."
          style={{
            width: "100%",
            padding: "10px 14px",
            border: "2px solid #e5e7eb",
            borderRadius: "10px",
            fontSize: "13px",
            direction: "rtl",
            outline: "none",
          }}
        />
      </div>

      {/* Category filters */}
      {!search && (
        <div
          style={{
            display: "flex",
            gap: "6px",
            flexWrap: "wrap",
            marginBottom: "14px",
          }}
        >
          <button
            onClick={() => setActiveSection(null)}
            style={{
              padding: "6px 14px",
              background: !activeSection ? "#6366f1" : "#f3f4f6",
              color: !activeSection ? "white" : "#374151",
              border: "none",
              borderRadius: "20px",
              fontSize: "12px",
              cursor: "pointer",
              fontWeight: 500,
            }}
          >
            הכל
          </button>
          {FAQ_SECTIONS.map((s) => (
            <button
              key={s.id}
              onClick={() =>
                setActiveSection(activeSection === s.id ? null : s.id)
              }
              style={{
                padding: "6px 14px",
                background: activeSection === s.id ? s.color : "#f3f4f6",
                color: activeSection === s.id ? "white" : "#374151",
                border: "none",
                borderRadius: "20px",
                fontSize: "12px",
                cursor: "pointer",
                fontWeight: 500,
              }}
            >
              {s.icon} {s.title}
            </button>
          ))}
        </div>
      )}

      {/* FAQ sections */}
      {filteredSections.map((section) => (
        <div key={section.id} style={{ marginBottom: "16px" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              marginBottom: "8px",
            }}
          >
            <span style={{ fontSize: "20px" }}>{section.icon}</span>
            <span
              style={{
                fontWeight: 700,
                fontSize: "15px",
                color: section.color,
              }}
            >
              {section.title}
            </span>
          </div>

          <div
            style={{
              background: "white",
              borderRadius: "12px",
              border: "1px solid #e5e7eb",
              overflow: "hidden",
            }}
          >
            {section.faqs.map((faq, i) => {
              const key = `${section.id}-${i}`;
              const isOpen = openFaq === key;

              return (
                <div
                  key={key}
                  style={{
                    borderBottom:
                      i < section.faqs.length - 1
                        ? "1px solid #f3f4f6"
                        : "none",
                  }}
                >
                  <button
                    onClick={() => setOpenFaq(isOpen ? null : key)}
                    style={{
                      width: "100%",
                      padding: "14px 16px",
                      background: isOpen ? section.color + "08" : "white",
                      border: "none",
                      textAlign: "right",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      cursor: "pointer",
                    }}
                  >
                    <span
                      style={{
                        fontWeight: 600,
                        fontSize: "14px",
                        color: isOpen ? section.color : "#111827",
                        textAlign: "right",
                      }}
                    >
                      {faq.q}
                    </span>
                    <span
                      style={{
                        fontSize: "18px",
                        color: section.color,
                        flexShrink: 0,
                        marginRight: "8px",
                        transition: "transform 0.2s",
                        transform: isOpen ? "rotate(180deg)" : "none",
                        display: "inline-block",
                      }}
                    >
                      ▼
                    </span>
                  </button>

                  {isOpen && (
                    <div
                      style={{
                        padding: "12px 16px 16px",
                        fontSize: "13px",
                        color: "#374151",
                        lineHeight: 1.8,
                        whiteSpace: "pre-wrap",
                        background: section.color + "05",
                        borderTop: `1px solid ${section.color}20`,
                      }}
                    >
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ))}

      {/* Contact support */}
      <div
        style={{
          background: "#f9fafb",
          border: "1px solid #e5e7eb",
          borderRadius: "12px",
          padding: "16px",
          textAlign: "center",
          marginTop: "8px",
        }}
      >
        <div style={{ fontSize: "24px", marginBottom: "6px" }}>🙋</div>
        <div
          style={{ fontWeight: 700, fontSize: "14px", marginBottom: "4px" }}
        >
          עדיין לא מצאת תשובה?
        </div>
        <div
          style={{ fontSize: "12px", color: "#6b7280", marginBottom: "12px" }}
        >
          שאל את מיכאל ישירות — הוא זמין 24/7
        </div>
        <a
          href={`/client/${client.slug}/ai-agent`}
          style={{
            padding: "10px 24px",
            background: "#6366f1",
            color: "white",
            borderRadius: "10px",
            textDecoration: "none",
            fontWeight: 700,
            fontSize: "13px",
            display: "inline-block",
          }}
        >
          🤖 דבר עם מיכאל
        </a>
      </div>
    </div>
  );
}
