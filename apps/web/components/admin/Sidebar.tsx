"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import {
  LayoutDashboard,
  Building2,
  Landmark,
  Users,
  GitBranch,
  ClipboardList,
  BarChart3,
  Settings,
  LogOut,
  Menu,
  X,
  Home,
  CreditCard,
  Paintbrush,
  Megaphone,
  Mail,
  Flame,
  Share2,
  Radio,
  CalendarDays,
  ShieldCheck,
  MessageSquare,
  Layout,
  Wand2,
} from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { label: "🏠 ראשי",             href: "/admin/dashboard",       icon: LayoutDashboard, tooltip: "סקירה כללית — נתונים, לקוחות ולידים" },
  { label: "📬 הודעות נכנסות",    href: "/admin/inbox",           icon: MessageSquare,   tooltip: "הודעות וואצאפ ופניות נכנסות" },
  { label: "👥 הלקוחות שלי",      href: "/admin/clients",         icon: Building2,       tooltip: "ניהול כל הלקוחות ועסקים שלך" },
  { label: "🏢 ניהול משרד",       href: "/admin/offices",         icon: Landmark,        tooltip: "ניהול משרדי נדל\"ן וסוכנים", reOnly: true },
  { label: "🎯 לידים חדשים",      href: "/admin/leads",           icon: Users,           tooltip: "כל הפניות שהגיעו מדפי הנחיתה" },
  { label: "🏆 לידים חמים",       href: "/admin/lead-scoring",    icon: Flame,           tooltip: "לידים עם ציון גבוה — הכי סביר לסגור" },
  { label: "⚡ אוטומציות",        href: "/admin/automations",     icon: GitBranch,       tooltip: "תהליכים אוטומטיים — מיילים, הודעות ותזכורות" },
  { label: "📋 טפסי לקוחות",     href: "/admin/intake-forms",    icon: ClipboardList,   tooltip: "טפסי קבלת מידע מלקוחות חדשים" },
  { label: "🎨 מעצב AI",           href: "/admin/ai-designer",     icon: Megaphone,       tooltip: "צור תמונות שיווקיות מקצועיות עם AI" },
  { label: "Facebook Ads",        href: "/admin/facebook-ads",    icon: Share2,          tooltip: "ניהול מודעות ממומנות בפייסבוק" },
  { label: "📧 מיילים",            href: "/admin/email",           icon: Mail,            tooltip: "תבניות מייל ורצפי שיווק אוטומטיים" },
  { label: "📱 פוסטים לסושיאל",  href: "/admin/social-posts",    icon: Share2,          tooltip: "יצירת תוכן לפייסבוק, אינסטגרם ועוד" },
  { label: "📢 שידור וואצאפ",    href: "/admin/broadcast",       icon: Radio,           tooltip: "שלח הודעת וואצאפ לכל הלידים בבת אחת" },
  { label: "📅 ניהול תורים",     href: "/admin/appointments",    icon: CalendarDays,    tooltip: "ניהול פגישות, תורים ולוח זמנים" },
  { label: "📊 דוחות ביצועים",   href: "/admin/reports",         icon: BarChart3,       tooltip: "דוחות שבועיים וחודשיים לשליחה ללקוח" },
  { label: "🏡 נכסי נדל\"ן",    href: "/admin/properties",      icon: Home,            tooltip: "ניהול נכסים, מחירים ותמונות", reOnly: true },
  { label: "🚀 התחל מתבנית",     href: "/admin/snapshots",       icon: Layout,          tooltip: "הפעל לקוח חדש עם חבילה מוכנה לפי ענף" },
  { label: "✨ בנה דף נחיתה",    href: "/admin/ai-agent",        icon: Wand2,           tooltip: "בנה דף נחיתה חדש בעזרת AI" },
  { label: "💳 מנוי ותשלום",     href: "/admin/billing",         icon: CreditCard,      tooltip: "ניהול מנוי, חיובים וחשבוניות" },
  { label: "🔧 מצב המערכת",      href: "/admin/system",          icon: ShieldCheck,     tooltip: "בדיקת תקינות כל חלקי המערכת" },
  { label: "דוח מערכת",          href: "/admin/system-report",   icon: BarChart3,       tooltip: "דוח פנימי של פעילות המערכת" },
  { label: "⚙️ הגדרות",         href: "/admin/settings",        icon: Settings,        tooltip: "הגדרות חשבון, צבעים ופרטי עסק" },
];

function NavItem({
  item,
  active,
  onClick,
  badge,
}: {
  item: (typeof navItems)[number];
  active: boolean;
  onClick?: () => void;
  badge?: number;
}) {
  const Icon = item.icon;
  return (
    <Link
      href={item.href}
      onClick={onClick}
      title={item.tooltip}
      className={cn(
        "flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium transition-all duration-150 group min-h-[44px]",
        active
          ? "bg-indigo-50 text-indigo-700"
          : "text-gray-500 hover:bg-gray-50 hover:text-gray-700"
      )}
      dir="rtl"
    >
      <Icon
        size={18}
        className={cn(
          "flex-shrink-0 transition-colors",
          active
            ? "text-indigo-600"
            : "text-gray-400 group-hover:text-gray-500"
        )}
      />
      <span className="flex-1">{item.label}</span>
      {badge ? (
        <span className="flex-shrink-0 text-xs font-bold px-1.5 py-0.5 rounded-full bg-red-100 text-red-600">
          {badge > 99 ? "99+" : badge}
        </span>
      ) : null}
    </Link>
  );
}

export function Sidebar({ hasRealEstate = false }: { hasRealEstate?: boolean }) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [newLeadsCount, setNewLeadsCount] = useState(0);
  const [inboxUnread, setInboxUnread] = useState(0);

  useEffect(() => {
    fetch("/api/users/me")
      .then((res) => (res.ok ? res.json() : null))
      .then((data: { user?: { email?: string; name?: string } } | null) => {
        if (data?.user?.email) {
          setUserEmail(data.user.email);
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    fetch("/api/leads/stats")
      .then((r) => r.ok ? r.json() : null)
      .then((d: { stats?: Record<string, number> } | null) => {
        if (d?.stats?.NEW) setNewLeadsCount(d.stats.NEW);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    fetch("/api/inbox")
      .then((r) => r.ok ? r.json() : null)
      .then((d: { unread?: number } | null) => {
        if (d?.unread) setInboxUnread(d.unread);
      })
      .catch(() => {});
  }, []);

  const avatarLetter = userEmail ? userEmail[0].toUpperCase() : "U";

  const sidebarContent = (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 py-5 border-b border-gray-100">
        <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center flex-shrink-0">
          <span className="text-white font-bold text-sm">M</span>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-gray-900 font-bold text-sm leading-tight">MarketingOS</p>
          <p className="text-gray-400 text-xs">פלטפורמת שיווק</p>
        </div>
        {/* Mobile close */}
        <button
          className="lg:hidden text-gray-400 hover:text-gray-600 transition-colors flex items-center justify-center min-w-[44px] min-h-[44px]"
          onClick={() => setMobileOpen(false)}
          aria-label="סגור תפריט"
        >
          <X size={20} />
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto" dir="rtl">
        <p className="px-3 mb-2 text-xs font-medium text-gray-400 uppercase tracking-wider">
          תפריט ראשי
        </p>
        {navItems.filter((item) => !("reOnly" in item && item.reOnly && !hasRealEstate)).map((item) => (
          <NavItem
            key={item.href}
            item={item}
            active={pathname.startsWith(item.href)}
            onClick={() => setMobileOpen(false)}
            badge={
              item.href === "/admin/leads" && newLeadsCount > 0 ? newLeadsCount :
              item.href === "/admin/inbox" && inboxUnread > 0 ? inboxUnread :
              undefined
            }
          />
        ))}
      </nav>

      {/* Bottom user + logout */}
      <div className="border-t border-gray-100 pt-3 pb-5 px-3" dir="rtl">
        {/* User row */}
        <div className="flex items-center gap-3 px-3 py-2 mb-1">
          <div className="w-8 h-8 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">
            {avatarLetter}
          </div>
          {userEmail ? (
            <span className="text-xs text-gray-500 truncate flex-1">{userEmail}</span>
          ) : (
            <span className="text-xs text-gray-400 truncate flex-1">טוען...</span>
          )}
        </div>
        {/* Logout */}
        <form action="/api/auth/logout" method="POST">
          <button
            type="submit"
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-gray-500 hover:bg-gray-50 hover:text-red-500 transition-colors"
            dir="rtl"
          >
            <LogOut size={18} className="flex-shrink-0" />
            <span>יציאה</span>
          </button>
        </form>
      </div>
    </div>
  );

  // Mobile bottom nav — show only the 4 most important items
  const mobileNavItems = navItems.slice(0, 4);

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex flex-col w-60 min-h-screen bg-white border-r border-gray-100 flex-shrink-0">
        {sidebarContent}
      </aside>

      {/* Mobile hamburger button */}
      <button
        className="lg:hidden fixed top-3 right-3 z-50 bg-white border border-gray-200 text-gray-600 rounded-lg shadow-sm flex items-center justify-center min-w-[44px] min-h-[44px]"
        onClick={() => setMobileOpen(true)}
        aria-label="פתח תפריט"
      >
        <Menu size={20} />
      </button>

      {/* Mobile bottom nav bar */}
      <nav
        className="lg:hidden fixed bottom-0 inset-x-0 z-40 bg-white border-t border-gray-100 flex"
        dir="rtl"
        aria-label="ניווט ראשי"
      >
        {mobileNavItems.map((item) => {
          const Icon = item.icon;
          const active = pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex-1 flex flex-col items-center gap-1 py-2 min-h-[56px] text-xs font-medium transition-colors",
                active ? "text-indigo-600" : "text-gray-400 hover:text-gray-600"
              )}
            >
              <Icon size={20} />
              <span className="leading-none">{item.label}</span>
            </Link>
          );
        })}
        {/* "More" button opens the full sidebar */}
        <button
          onClick={() => setMobileOpen(true)}
          className="flex-1 flex flex-col items-center gap-1 py-2 min-h-[56px] text-xs font-medium text-gray-400 hover:text-gray-600 transition-colors"
        >
          <Menu size={20} />
          <span className="leading-none">עוד</span>
        </button>
      </nav>

      {/* Mobile overlay — always mounted, fades in/out */}
      <div
        className="lg:hidden fixed inset-0 z-40 bg-black/50"
        style={{
          opacity: mobileOpen ? 1 : 0,
          pointerEvents: mobileOpen ? "auto" : "none",
          transition: "opacity 0.3s ease",
        }}
        onClick={() => setMobileOpen(false)}
        aria-hidden="true"
      />

      {/* Mobile sidebar — slides in from left, always mounted */}
      <aside
        className="lg:hidden fixed top-0 left-0 z-50 flex flex-col w-[280px] h-screen bg-white border-r border-gray-100"
        style={{
          transform: mobileOpen ? "translateX(0)" : "translateX(-100%)",
          transition: "transform 0.3s ease",
          boxShadow: mobileOpen ? "4px 0 24px rgba(0,0,0,0.15)" : "none",
          overflowY: "auto",
        }}
        aria-hidden={!mobileOpen}
      >
        {sidebarContent}
      </aside>
    </>
  );
}
