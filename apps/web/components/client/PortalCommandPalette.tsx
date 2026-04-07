"use client";

import { CommandPalette, type Command } from "@/components/ui/CommandPalette";
import { useCommandPalette } from "@/hooks/useCommandPalette";

export function PortalCommandPalette({ slug }: { slug: string }) {
  const { open, close } = useCommandPalette();

  const commands: Command[] = [
    { id: "home", label: "לוח בקרה", icon: "🏠", href: `/client/${slug}`, group: "ניווט", keywords: ["home", "dashboard", "בית"] },
    { id: "leads", label: "לידים", description: "ניהול לידים", icon: "🎯", href: `/client/${slug}/leads`, group: "ניווט", keywords: ["leads", "לקוחות"] },
    { id: "appointments", label: "פגישות", icon: "📅", href: `/client/${slug}/appointments`, group: "ניווט", keywords: ["calendar", "פגישה"] },
    { id: "broadcast", label: "שידור", icon: "📢", href: `/client/${slug}/broadcast`, group: "ניווט", keywords: ["broadcast", "הודעות"] },
    { id: "automations", label: "אוטומציות", icon: "⚡", href: `/client/${slug}/automations`, group: "ניווט", keywords: ["auto"] },
    { id: "email", label: "מיילים", icon: "📧", href: `/client/${slug}/email`, group: "ניווט", keywords: ["email", "sequences"] },
    { id: "ai-agent", label: "הסוכן שלי", icon: "🤖", href: `/client/${slug}/ai-agent`, group: "ניווט", keywords: ["ai", "agent", "מיכאל"] },
    { id: "help", label: "עזרה", icon: "💡", href: `/client/${slug}/help`, group: "ניווט", keywords: ["help", "faq"] },
    { id: "settings", label: "הגדרות", icon: "⚙️", href: `/client/${slug}/settings`, group: "ניווט", keywords: ["settings", "הגדרה"] },
    { id: "build-page", label: "בנה דף נחיתה", icon: "🧙", href: `/client/${slug}/build-page`, group: "פעולות", keywords: ["build", "page", "דף"] },
    { id: "seo", label: "SEO וגוגל", icon: "🔍", href: `/client/${slug}/seo`, group: "פעולות", keywords: ["seo", "google"] },
    { id: "designer", label: "עיצוב AI", icon: "🎨", href: `/client/${slug}/ai-designer`, group: "פעולות", keywords: ["design", "image"] },
  ];

  return <CommandPalette open={open} onClose={close} commands={commands} />;
}
