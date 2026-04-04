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

type NavGroup = {
  title: string;
  items: (typeof navItems)[number][];
  collapsible?: boolean;
};

const navItems = [
  { label: "🏠 ראשי",             href: "/admin/dashboard",       icon: LayoutDashboard, tooltip: "סקירה כללית — נתונים, לקוחות ולידים" },
  { label: "👥 הלקוחות שלי",      href: "/admin/clients",         icon: Building2,       tooltip: "ניהול כל הלקוחות ועסקים שלך" },
  { label: "🎯 לידים",            href: "/admin/leads",           icon: Users,           tooltip: "כל הפניות שהגיעו מדפי הנחיתה" },
  { label: "📬 הודעות",           href: "/admin/inbox",           icon: MessageSquare,   tooltip: "הודעות וואצאפ ופניות נכנסות" },
  { label: "📅 תורים",            href: "/admin/appointments",    icon: CalendarDays,    tooltip: "ניהול פגישות, תורים ולוח זמנים" },
];

const marketingItems = [
  { label: "🚀 תבניות",           href: "/admin/snapshots",       icon: Layout,          tooltip: "הפעל לקוח חדש עם חבילה מוכנה לפי ענף" },
  { label: "📱 סושיאל",           href: "/admin/social-posts",    icon: Share2,          tooltip: "יצירת תוכן לפייסבוק, אינסטגרם ועוד" },
  { label: "🎨 מעצב AI",          href: "/admin/ai-designer",     icon: Megaphone,       tooltip: "צור תמונות שיווקיות מקצועיות עם AI" },
  { label: "📢 שידור",            href: "/admin/broadcast",       icon: Radio,           tooltip: "שלח הודעת וואצאפ לכל הלידים בבת אחת" },
  { label: "📧 מיילים",           href: "/admin/email",           icon: Mail,            tooltip: "תבניות מייל ורצפי שיווק אוטומטיים" },
];

const analyticsItems = [
  { label: "📊 דוחות",            href: "/admin/reports",         icon: BarChart3,       tooltip: "דוחות שבועיים וחודשיים לשליחה ללקוח" },
  { label: "🏆 ציון לידים",       href: "/admin/lead-scoring",    icon: Flame,           tooltip: "לידים עם ציון גבוה — הכי סביר לסגור" },
  { label: "✨ סוכן AI",          href: "/admin/ai-agent",        icon: Wand2,           tooltip: "בנה דף נחיתה חדש בעזרת AI" },
];

const settingsItems = [
  { label: "⚙️ הגדרות",          href: "/admin/settings",        icon: Settings,        tooltip: "הגדרות חשבון, צבעים ופרטי עסק" },
  { label: "🔧 מערכת",            href: "/admin/system",          icon: ShieldCheck,     tooltip: "בדיקת תקינות כל חלקי המערכת" },
  { label: "💳 חיוב",             href: "/admin/billing",         icon: CreditCard,      tooltip: "ניהול מנוי, חיובים וחשבוניות" },
  { label: "🏢 משרד",             href: "/admin/offices",         icon: Landmark,        tooltip: "ניהול משרדי נדל\"ן וסוכנים", reOnly: true },
];

const navGroups: NavGroup[] = [
  { title: "הלקוחות שלי", items: navItems },
  { title: "כלי שיווק", items: marketingItems },
  { title: "דוחות ואנליטיקס", items: analyticsItems },
  { title: "הגדרות", items: settingsItems, collapsible: true },
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

function NavGroupSection({
  group,
  pathname,
  hasRealEstate,
  newLeadsCount,
  inboxUnread,
  onItemClick,
}: {
  group: NavGroup;
  pathname: string;
  hasRealEstate: boolean;
  newLeadsCount: number;
  inboxUnread: number;
  onItemClick: () => void;
}) {
  const [collapsed, setCollapsed] = useState(group.collapsible ?? false);
  const filteredItems = group.items.filter(
    (item) => !("reOnly" in item && item.reOnly && !hasRealEstate)
  );
  if (filteredItems.length === 0) return null;

  return (
    <div className="mb-3">
      <button
        onClick={group.collapsible ? () => setCollapsed(!collapsed) : undefined}
        className={cn(
          "px-3 mb-1 text-xs font-medium text-gray-400 uppercase tracking-wider flex items-center gap-1 w-full text-right",
          group.collapsible && "hover:text-gray-300 cursor-pointer"
        )}
      >
        {group.title}
        {group.collapsible && (
          <span className="text-[10px]">{collapsed ? "▸" : "▾"}</span>
        )}
      </button>
      {!collapsed &&
        filteredItems.map((item) => (
          <NavItem
            key={item.href}
            item={item}
            active={pathname.startsWith(item.href)}
            onClick={onItemClick}
            badge={
              item.href === "/admin/leads" && newLeadsCount > 0
                ? newLeadsCount
                : item.href === "/admin/inbox" && inboxUnread > 0
                ? inboxUnread
                : undefined
            }
          />
        ))}
    </div>
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
      <nav className="flex-1 px-3 py-4 overflow-y-auto" dir="rtl">
        {navGroups.map((group) => (
          <NavGroupSection
            key={group.title}
            group={group}
            pathname={pathname}
            hasRealEstate={hasRealEstate}
            newLeadsCount={newLeadsCount}
            inboxUnread={inboxUnread}
            onItemClick={() => setMobileOpen(false)}
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
