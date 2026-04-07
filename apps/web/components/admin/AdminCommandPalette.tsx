"use client";

import { CommandPalette, type Command } from "@/components/ui/CommandPalette";
import { useCommandPalette } from "@/hooks/useCommandPalette";

export function AdminCommandPalette() {
  const { open, close } = useCommandPalette();

  const commands: Command[] = [
    { id: "dashboard", label: "דשבורד", icon: "📊", href: "/admin/dashboard", group: "ניווט", keywords: ["home", "dashboard"] },
    { id: "clients", label: "לקוחות", icon: "🏢", href: "/admin/clients", group: "ניווט", keywords: ["clients"] },
    { id: "leads", label: "לידים", icon: "🎯", href: "/admin/leads", group: "ניווט", keywords: ["leads"] },
    { id: "settings", label: "הגדרות", icon: "⚙️", href: "/admin/settings", group: "ניווט", keywords: ["settings"] },
    { id: "ai-agent", label: "סוכן AI", icon: "🤖", href: "/admin/ai-agent", group: "ניווט", keywords: ["ai", "agent"] },
    { id: "reports", label: "דוחות", icon: "📈", href: "/admin/reports", group: "ניווט", keywords: ["reports"] },
    { id: "new-client", label: "הוסף לקוח חדש", icon: "➕", href: "/admin/clients/new", group: "פעולות", keywords: ["add", "new", "חדש"] },
    { id: "broadcast", label: "שידור", icon: "📢", href: "/admin/broadcast", group: "פעולות", keywords: ["broadcast"] },
    { id: "system", label: "בריאות מערכת", icon: "🏥", href: "/admin/system", group: "פעולות", keywords: ["system", "health"] },
  ];

  return <CommandPalette open={open} onClose={close} commands={commands} />;
}
