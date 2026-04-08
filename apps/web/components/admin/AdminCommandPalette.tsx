"use client";

import { CommandPalette, type Command } from "@/components/ui/CommandPalette";
import { useCommandPalette } from "@/hooks/useCommandPalette";

export function AdminCommandPalette() {
  const { open, close } = useCommandPalette();

  const commands: Command[] = [
    // ניווט — Navigation
    { id: "dashboard", label: "דשבורד", description: "סקירה כללית — נתונים, לקוחות ולידים", icon: "📊", href: "/admin/dashboard", group: "ניווט", keywords: ["home", "dashboard", "ראשי", "בית"] },
    { id: "clients", label: "הלקוחות שלי", description: "ניהול כל הלקוחות ועסקים", icon: "🏢", href: "/admin/clients", group: "ניווט", keywords: ["clients", "לקוחות", "עסקים"] },
    { id: "inbox", label: "הודעות", description: "הודעות וואצאפ ופניות נכנסות", icon: "💬", href: "/admin/inbox", group: "ניווט", keywords: ["inbox", "messages", "הודעות", "וואצאפ", "whatsapp"] },
    { id: "appointments", label: "תורים", description: "ניהול פגישות, תורים ולוח זמנים", icon: "📅", href: "/admin/appointments", group: "ניווט", keywords: ["appointments", "calendar", "פגישות", "תורים", "לוח"] },
    { id: "reports", label: "דוחות", description: "דוחות שבועיים וחודשיים", icon: "📈", href: "/admin/reports", group: "ניווט", keywords: ["reports", "דוחות", "אנליטיקס", "analytics"] },
    { id: "lead-scoring", label: "ציון לידים", description: "לידים עם ציון גבוה — הכי סביר לסגור", icon: "🔥", href: "/admin/lead-scoring", group: "ניווט", keywords: ["leads", "scoring", "לידים", "ציון", "hot"] },
    { id: "settings", label: "הגדרות", description: "הגדרות חשבון, צבעים ופרטי עסק", icon: "⚙️", href: "/admin/settings", group: "ניווט", keywords: ["settings", "הגדרות"] },

    // כלי שיווק — Marketing Tools
    { id: "snapshots", label: "תבניות", description: "הפעל לקוח חדש עם חבילה מוכנה לפי ענף", icon: "📋", href: "/admin/snapshots", group: "כלי שיווק", keywords: ["templates", "snapshots", "תבניות", "חבילה"] },
    { id: "social-posts", label: "סושיאל", description: "יצירת תוכן לפייסבוק, אינסטגרם ועוד", icon: "📱", href: "/admin/social-posts", group: "כלי שיווק", keywords: ["social", "facebook", "instagram", "סושיאל", "פוסט"] },
    { id: "ai-designer", label: "מעצב AI", description: "צור תמונות שיווקיות מקצועיות עם AI", icon: "🎨", href: "/admin/ai-designer", group: "כלי שיווק", keywords: ["design", "ai", "image", "עיצוב", "תמונה"] },
    { id: "broadcast", label: "שידור", description: "שלח הודעת וואצאפ לכל הלידים בבת אחת", icon: "📢", href: "/admin/broadcast", group: "כלי שיווק", keywords: ["broadcast", "שידור", "וואצאפ", "whatsapp"] },
    { id: "email", label: "מיילים", description: "תבניות מייל ורצפי שיווק אוטומטיים", icon: "📧", href: "/admin/email", group: "כלי שיווק", keywords: ["email", "mail", "מייל", "sequences"] },

    // פעולות — Actions
    { id: "new-client", label: "הוסף לקוח חדש", description: "צור כרטיס לקוח חדש במערכת", icon: "➕", href: "/admin/clients/new", group: "פעולות", keywords: ["add", "new", "חדש", "לקוח"] },
    { id: "ai-agent", label: "סוכן AI", description: "בנה דף נחיתה חדש בעזרת AI", icon: "🤖", href: "/admin/ai-agent", group: "פעולות", keywords: ["ai", "agent", "בנה", "דף", "landing"] },
    { id: "system", label: "בריאות מערכת", description: "בדיקת תקינות כל חלקי המערכת", icon: "🛡️", href: "/admin/system", group: "פעולות", keywords: ["system", "health", "מערכת", "בדיקה"] },
    { id: "billing", label: "חיוב", description: "ניהול מנוי, חיובים וחשבוניות", icon: "💳", href: "/admin/billing", group: "פעולות", keywords: ["billing", "payment", "חיוב", "מנוי", "חשבונית"] },
  ];

  return <CommandPalette open={open} onClose={close} commands={commands} />;
}
