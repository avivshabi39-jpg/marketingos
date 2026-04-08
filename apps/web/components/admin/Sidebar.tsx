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
  ChevronDown,
  ChevronLeft,
} from "lucide-react";
import { cn } from "@/lib/utils";

type NavGroup = {
  title: string;
  items: (typeof navItems)[number][];
  collapsible?: boolean;
};

const navItems = [
  { label: "ראשי",             href: "/admin/dashboard",       icon: LayoutDashboard, tooltip: "סקירה כללית — נתונים, לקוחות ולידים" },
  { label: "הלקוחות שלי",      href: "/admin/clients",         icon: Building2,       tooltip: "ניהול כל הלקוחות ועסקים שלך — לידים בתוך כל לקוח" },
  { label: "הודעות",           href: "/admin/inbox",           icon: MessageSquare,   tooltip: "הודעות וואצאפ ופניות נכנסות" },
  { label: "תורים",            href: "/admin/appointments",    icon: CalendarDays,    tooltip: "ניהול פגישות, תורים ולוח זמנים" },
];

const marketingItems = [
  { label: "תבניות",           href: "/admin/snapshots",       icon: Layout,          tooltip: "הפעל לקוח חדש עם חבילה מוכנה לפי ענף" },
  { label: "סושיאל",           href: "/admin/social-posts",    icon: Share2,          tooltip: "יצירת תוכן לפייסבוק, אינסטגרם ועוד" },
  { label: "מעצב AI",          href: "/admin/ai-designer",     icon: Megaphone,       tooltip: "צור תמונות שיווקיות מקצועיות עם AI" },
  { label: "שידור",            href: "/admin/broadcast",       icon: Radio,           tooltip: "שלח הודעת וואצאפ לכל הלידים בבת אחת" },
  { label: "מיילים",           href: "/admin/email",           icon: Mail,            tooltip: "תבניות מייל ורצפי שיווק אוטומטיים" },
];

const analyticsItems = [
  { label: "דוחות",            href: "/admin/reports",         icon: BarChart3,       tooltip: "דוחות שבועיים וחודשיים לשליחה ללקוח" },
  { label: "ציון לידים",       href: "/admin/lead-scoring",    icon: Flame,           tooltip: "לידים עם ציון גבוה — הכי סביר לסגור" },
  { label: "סוכן AI",          href: "/admin/ai-agent",        icon: Wand2,           tooltip: "בנה דף נחיתה חדש בעזרת AI" },
];

const settingsItems = [
  { label: "הגדרות",          href: "/admin/settings",        icon: Settings,        tooltip: "הגדרות חשבון, צבעים ופרטי עסק" },
  { label: "מערכת",            href: "/admin/system",          icon: ShieldCheck,     tooltip: "בדיקת תקינות כל חלקי המערכת" },
  { label: "חיוב",             href: "/admin/billing",         icon: CreditCard,      tooltip: "ניהול מנוי, חיובים וחשבוניות" },
  { label: "משרד",             href: "/admin/offices",         icon: Landmark,        tooltip: "ניהול משרדי נדל\"ן וסוכנים", reOnly: true },
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
        "flex items-center gap-3 px-4 py-2.5 rounded-xl mx-2 mb-0.5",
        "transition-all duration-150 text-sm font-medium",
        active
          ? "bg-blue-600 text-white shadow-sm"
          : "text-slate-400 hover:bg-slate-800 hover:text-white"
      )}
      dir="rtl"
    >
      <Icon className="w-[18px] h-[18px] flex-shrink-0" />
      <span className="flex-1">{item.label}</span>
      {badge ? (
        <span className="mr-auto bg-blue-500 text-white text-xs px-2 py-0.5 rounded-full">
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
  isFirst,
}: {
  group: NavGroup;
  pathname: string;
  hasRealEstate: boolean;
  newLeadsCount: number;
  inboxUnread: number;
  onItemClick: () => void;
  isFirst?: boolean;
}) {
  const [collapsed, setCollapsed] = useState(group.collapsible ?? false);
  const filteredItems = group.items.filter(
    (item) => !("reOnly" in item && item.reOnly && !hasRealEstate)
  );
  if (filteredItems.length === 0) return null;

  return (
    <div className="mb-2">
      {/* Separator between groups */}
      {!isFirst && (
        <div className="border-t border-[#1E293B] my-2 mx-4" />
      )}
      <button
        onClick={group.collapsible ? () => setCollapsed(!collapsed) : undefined}
        className={cn(
          "px-4 mb-2 text-[11px] font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1 w-full text-right",
          group.collapsible && "hover:text-slate-400 cursor-pointer"
        )}
      >
        {group.title}
        {group.collapsible && (
          <ChevronDown
            size={12}
            className={cn(
              "transition-transform duration-200",
              collapsed && "-rotate-90"
            )}
          />
        )}
      </button>
      {!collapsed && (
        <div className="space-y-0.5">
          {filteredItems.map((item) => (
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
      )}
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
    <div className="flex flex-col h-full bg-[#0F172A]">
      {/* Logo */}
      <div className="flex items-center gap-3 px-6 py-6 border-b border-[#1E293B]">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center flex-shrink-0 shadow-lg shadow-blue-500/20">
          <span className="text-white font-bold text-sm">M</span>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-white font-bold text-sm leading-tight">MarketingOS</p>
          <p className="text-slate-500 text-xs">פלטפורמת שיווק</p>
        </div>
        {/* Mobile close */}
        <button
          className="lg:hidden text-slate-400 hover:text-white transition-colors flex items-center justify-center min-w-[44px] min-h-[44px]"
          onClick={() => setMobileOpen(false)}
          aria-label="סגור תפריט"
        >
          <X size={20} />
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 overflow-y-auto sidebar-scroll" dir="rtl">
        {navGroups.map((group, index) => (
          <NavGroupSection
            key={group.title}
            group={group}
            pathname={pathname}
            hasRealEstate={hasRealEstate}
            newLeadsCount={newLeadsCount}
            inboxUnread={inboxUnread}
            onItemClick={() => setMobileOpen(false)}
            isFirst={index === 0}
          />
        ))}
      </nav>

      {/* Bottom user + logout */}
      <div className="border-t border-[#1E293B] pt-3 pb-5 px-3" dir="rtl">
        {/* User row */}
        <div className="flex items-center gap-3 px-4 py-2 mb-1">
          <div className="w-8 h-8 bg-slate-700 text-blue-400 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">
            {avatarLetter}
          </div>
          {userEmail ? (
            <span className="text-xs text-slate-400 truncate flex-1">{userEmail}</span>
          ) : (
            <span className="text-xs text-slate-500 truncate flex-1">טוען...</span>
          )}
        </div>
        {/* Logout */}
        <form action="/api/auth/logout" method="POST">
          <button
            type="submit"
            className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm text-slate-400 hover:bg-[#1E293B] hover:text-red-400 transition-all duration-150"
            dir="rtl"
          >
            <LogOut className="w-[18px] h-[18px] flex-shrink-0" />
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
      <aside className="hidden lg:flex flex-col w-[260px] min-h-screen bg-[#0F172A] flex-shrink-0">
        {sidebarContent}
      </aside>

      {/* Mobile hamburger button */}
      <button
        className="lg:hidden fixed top-3 right-3 z-50 bg-[#0F172A] text-white rounded-xl shadow-lg flex items-center justify-center min-w-[44px] min-h-[44px]"
        onClick={() => setMobileOpen(true)}
        aria-label="פתח תפריט"
      >
        <Menu size={20} />
      </button>

      {/* Mobile bottom nav bar */}
      <nav
        className="lg:hidden fixed bottom-0 inset-x-0 z-40 bg-white/80 backdrop-blur-lg border-t border-slate-200 flex"
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
                "flex-1 flex flex-col items-center gap-1 py-2.5 min-h-[56px] text-xs font-medium transition-colors",
                active ? "text-blue-600" : "text-slate-400 hover:text-slate-600"
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
          className="flex-1 flex flex-col items-center gap-1 py-2.5 min-h-[56px] text-xs font-medium text-slate-400 hover:text-slate-600 transition-colors"
        >
          <Menu size={20} />
          <span className="leading-none">עוד</span>
        </button>
      </nav>

      {/* Mobile overlay — always mounted, fades in/out */}
      <div
        className="lg:hidden fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
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
        className="lg:hidden fixed top-0 left-0 z-50 flex flex-col w-[280px] h-screen"
        style={{
          transform: mobileOpen ? "translateX(0)" : "translateX(-100%)",
          transition: "transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
          boxShadow: mobileOpen ? "4px 0 24px rgba(0,0,0,0.3)" : "none",
          overflowY: "auto",
        }}
        aria-hidden={!mobileOpen}
      >
        {sidebarContent}
      </aside>
    </>
  );
}
