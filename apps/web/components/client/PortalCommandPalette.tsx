"use client";

import { CommandPalette, type Command } from "@/components/ui/CommandPalette";
import { useCommandPalette } from "@/hooks/useCommandPalette";

export function PortalCommandPalette({ slug }: { slug: string }) {
  const { open, close } = useCommandPalette();

  const commands: Command[] = [
    // ניווט — Navigation
    { id: "home", label: "לוח בקרה", description: "סקירה כללית ונתונים", icon: "🏠", href: `/client/${slug}`, group: "ניווט", keywords: ["home", "dashboard", "בית", "ראשי"] },
    { id: "leads", label: "לידים", description: "ניהול לידים ופניות", icon: "🎯", href: `/client/${slug}/leads`, group: "ניווט", keywords: ["leads", "לידים", "לקוחות", "פניות"] },
    { id: "appointments", label: "פגישות", description: "ניהול פגישות ותורים", icon: "📅", href: `/client/${slug}/appointments`, group: "ניווט", keywords: ["calendar", "פגישה", "תור", "appointments"] },
    { id: "broadcast", label: "שידור", description: "שלח הודעה לכל הלידים", icon: "📢", href: `/client/${slug}/broadcast`, group: "ניווט", keywords: ["broadcast", "שידור", "הודעות", "whatsapp"] },
    { id: "automations", label: "אוטומציות", description: "תהליכים אוטומטיים", icon: "⚡", href: `/client/${slug}/automations`, group: "ניווט", keywords: ["auto", "automation", "אוטומציה", "תהליך"] },
    { id: "email", label: "מיילים", description: "תבניות מייל ורצפים", icon: "📧", href: `/client/${slug}/email`, group: "ניווט", keywords: ["email", "mail", "מייל", "sequences"] },
    { id: "social", label: "סושיאל", description: "יצירת תוכן לרשתות חברתיות", icon: "📱", href: `/client/${slug}/social-posts`, group: "ניווט", keywords: ["social", "סושיאל", "פוסט", "facebook", "instagram"] },
    { id: "settings", label: "הגדרות", description: "הגדרות הפורטל שלי", icon: "⚙️", href: `/client/${slug}/settings`, group: "ניווט", keywords: ["settings", "הגדרות", "הגדרה"] },

    // פעולות — Actions
    { id: "build-page", label: "בנה דף נחיתה", description: "צור דף נחיתה חדש עם AI", icon: "🧙", href: `/client/${slug}/build-page`, group: "פעולות", keywords: ["build", "page", "דף", "נחיתה", "landing"] },
    { id: "edit-page", label: "ערוך דף נחיתה", description: "ערוך את הדף הקיים שלך", icon: "✏️", href: `/client/${slug}/edit-page`, group: "פעולות", keywords: ["edit", "ערוך", "דף", "עריכה"] },
    { id: "ai-agent", label: "הסוכן שלי", description: "בקש מה-AI לעזור לך", icon: "🤖", href: `/client/${slug}/ai-agent`, group: "פעולות", keywords: ["ai", "agent", "סוכן", "עזרה"] },
    { id: "designer", label: "עיצוב AI", description: "צור תמונות שיווקיות", icon: "🎨", href: `/client/${slug}/ai-designer`, group: "פעולות", keywords: ["design", "image", "עיצוב", "תמונה"] },
    { id: "seo", label: "SEO וגוגל", description: "שפר את הנוכחות בגוגל", icon: "🔍", href: `/client/${slug}/seo`, group: "פעולות", keywords: ["seo", "google", "גוגל", "חיפוש"] },
    { id: "help", label: "עזרה", description: "שאלות נפוצות ותמיכה", icon: "💡", href: `/client/${slug}/help`, group: "פעולות", keywords: ["help", "faq", "עזרה", "תמיכה"] },
  ];

  return <CommandPalette open={open} onClose={close} commands={commands} />;
}
