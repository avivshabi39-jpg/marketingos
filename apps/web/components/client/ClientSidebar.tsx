"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  LayoutDashboard,
  Users,
  Settings,
  LogOut,
  Menu,
  X,
  ChevronLeft,
  ChevronDown,
  TrendingUp,
  Globe,
  Bot,
  Home,
  Megaphone,
  Radio,
  Share2,
  Mail,
  Zap,
  Search,
  FileBarChart,
  CalendarDays,
  Palette,
  HelpCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type NavItem = {
  label: string;
  href: string;
  icon: React.ElementType;
};

type NavGroup = {
  label: string;
  href: string;
  icon: React.ElementType;
  children?: NavItem[];
};

// ---------------------------------------------------------------------------
// Navigation structure: 6 primary items (+ Properties for RE)
// All 17 original routes are preserved inside hubs
// ---------------------------------------------------------------------------

function buildNav(slug: string, isRealEstate: boolean): NavGroup[] {
  const base = `/client/${slug}`;

  const items: NavGroup[] = [
    // 1. Dashboard — no children
    { label: "ראשי", href: base, icon: LayoutDashboard },

    // 2. Leads — no children
    { label: "לידים", href: `${base}/leads`, icon: Users },

    // 3. My Page — groups: build, edit, SEO, AI designer
    {
      label: "הדף שלי",
      href: `${base}/build-page`,
      icon: Globe,
      children: [
        { label: "בנה דף",    href: `${base}/build-page`,  icon: Globe },
        { label: "ערוך דף",   href: `${base}/edit-page`,   icon: Globe },
        { label: "SEO וגוגל", href: `${base}/seo`,         icon: Search },
        { label: "עיצוב AI",  href: `${base}/ai-designer`, icon: Palette },
      ],
    },

    // 4. Marketing — groups: broadcast, social, email, automations
    {
      label: "שיווק",
      href: `${base}/broadcast`,
      icon: Megaphone,
      children: [
        { label: "שידור",      href: `${base}/broadcast`,   icon: Radio },
        { label: "פוסטים",     href: `${base}/social`,      icon: Share2 },
        { label: "מיילים",     href: `${base}/email`,       icon: Mail },
        { label: "אוטומציות",  href: `${base}/automations`, icon: Zap },
        { label: "קמפיינים",   href: `${base}/campaigns`,   icon: Megaphone },
      ],
    },

    // 5. Michael (AI) — groups: agent, reports, analytics, appointments, help
    {
      label: "מיכאל",
      href: `${base}/ai-agent`,
      icon: Bot,
      children: [
        { label: "הסוכן שלי",  href: `${base}/ai-agent`,     icon: Bot },
        { label: "דוחות",      href: `${base}/reports`,      icon: FileBarChart },
        { label: "אנליטיקס",   href: `${base}/analytics`,    icon: TrendingUp },
        { label: "תורים",      href: `${base}/appointments`, icon: CalendarDays },
        { label: "עזרה",       href: `${base}/help`,         icon: HelpCircle },
      ],
    },

    // 6. Settings — no children
    { label: "הגדרות", href: `${base}/settings`, icon: Settings },
  ];

  // Conditional: Properties for real estate (after Leads)
  if (isRealEstate) {
    items.splice(2, 0, {
      label: "נכסים",
      href: `${base}/properties`,
      icon: Home,
    });
  }

  return items;
}

// ---------------------------------------------------------------------------
// Logout handler
// ---------------------------------------------------------------------------

async function handleLogout(slug: string) {
  await fetch("/api/client-auth/login", { method: "DELETE" });
  window.location.href = `/client/${slug}/login`;
}

// ---------------------------------------------------------------------------
// Single nav link
// ---------------------------------------------------------------------------

function NavLink({
  item,
  active,
  primaryColor,
  onClick,
  compact,
}: {
  item: NavItem;
  active: boolean;
  primaryColor: string;
  onClick?: () => void;
  compact?: boolean;
}) {
  const Icon = item.icon;
  return (
    <Link
      href={item.href}
      onClick={onClick}
      className={cn(
        "flex items-center gap-3 rounded-xl text-sm font-medium transition-all duration-150 group",
        compact ? "px-3 py-2 mr-3" : "px-3 py-2.5 min-h-[40px]",
        active ? "shadow-md" : "text-slate-400 hover:text-white hover:bg-slate-800"
      )}
      style={
        active
          ? { backgroundColor: primaryColor, color: "white", boxShadow: `0 4px 12px ${primaryColor}33` }
          : undefined
      }
      dir="rtl"
    >
      <Icon
        size={compact ? 15 : 18}
        className={cn(
          "flex-shrink-0 transition-colors",
          active ? "text-white" : "text-slate-500 group-hover:text-slate-300"
        )}
      />
      <span className="flex-1">{item.label}</span>
      {active && !compact && <ChevronLeft size={14} className="mr-auto opacity-60 text-white" />}
    </Link>
  );
}

// ---------------------------------------------------------------------------
// Expandable nav group
// ---------------------------------------------------------------------------

function NavGroupItem({
  group,
  pathname,
  slug,
  primaryColor,
  onMobileClose,
}: {
  group: NavGroup;
  pathname: string;
  slug: string;
  primaryColor: string;
  onMobileClose: () => void;
}) {
  const base = `/client/${slug}`;

  // Check if any child is active
  const childActive = group.children?.some((c) => pathname.startsWith(c.href)) ?? false;
  const selfActive = group.href === base
    ? pathname === group.href
    : pathname.startsWith(group.href);
  const isActive = selfActive || childActive;

  const [expanded, setExpanded] = useState(childActive);

  // No children → simple link
  if (!group.children) {
    return (
      <NavLink
        item={group}
        active={group.href === base ? pathname === base : pathname.startsWith(group.href)}
        primaryColor={primaryColor}
        onClick={onMobileClose}
      />
    );
  }

  // Has children → expandable group
  const Icon = group.icon;
  return (
    <div>
      <button
        onClick={() => setExpanded(!expanded)}
        className={cn(
          "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 group min-h-[40px]",
          isActive
            ? "text-white bg-slate-800"
            : "text-slate-400 hover:text-white hover:bg-slate-800"
        )}
        dir="rtl"
      >
        <Icon
          size={18}
          className={cn(
            "flex-shrink-0 transition-colors",
            isActive ? "text-white" : "text-slate-500 group-hover:text-slate-300"
          )}
        />
        <span className="flex-1 text-right">{group.label}</span>
        <ChevronDown
          size={14}
          className={cn(
            "transition-transform duration-200 opacity-50",
            expanded ? "rotate-180" : ""
          )}
        />
      </button>

      {/* Children */}
      <div
        className={cn(
          "overflow-hidden transition-all duration-200",
          expanded ? "max-h-[300px] opacity-100 mt-0.5" : "max-h-0 opacity-0"
        )}
      >
        {group.children.map((child) => (
          <NavLink
            key={child.href}
            item={child}
            active={pathname.startsWith(child.href)}
            primaryColor={primaryColor}
            onClick={onMobileClose}
            compact
          />
        ))}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main sidebar component
// ---------------------------------------------------------------------------

export function ClientSidebar({
  slug,
  clientName,
  primaryColor,
  brandLogo,
  industry,
}: {
  slug: string;
  clientName: string;
  primaryColor: string;
  brandLogo?: string | null;
  industry?: string | null;
}) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const navGroups = buildNav(slug, industry === "REAL_ESTATE");

  const sidebarContent = (
    <div className="flex flex-col h-full bg-slate-900">
      {/* Logo / brand header */}
      <div className="flex items-center gap-3 px-4 py-4 border-b border-slate-800">
        {brandLogo ? (
          <Image
            src={brandLogo}
            alt={clientName}
            width={120}
            height={32}
            className="h-8 object-contain flex-shrink-0"
            style={{ width: "auto" }}
            priority
          />
        ) : (
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center text-white font-bold text-sm flex-shrink-0 shadow-lg"
            style={{ backgroundColor: primaryColor, boxShadow: `0 4px 12px ${primaryColor}33` }}
          >
            {clientName[0]}
          </div>
        )}
        <div className="min-w-0 flex-1">
          <p className="text-white font-semibold text-sm leading-tight truncate">{clientName}</p>
          <p className="text-slate-500 text-xs flex items-center gap-1">
            <TrendingUp size={11} />
            פורטל לקוחות
          </p>
        </div>
        {/* Mobile close */}
        <button
          className="lg:hidden text-slate-400 hover:text-white min-w-[44px] min-h-[44px] flex items-center justify-center transition-colors"
          onClick={() => setMobileOpen(false)}
          aria-label="סגור תפריט"
        >
          <X size={18} />
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto sidebar-scroll" dir="rtl">
        {navGroups.map((group) => (
          <NavGroupItem
            key={group.label}
            group={group}
            pathname={pathname}
            slug={slug}
            primaryColor={primaryColor}
            onMobileClose={() => setMobileOpen(false)}
          />
        ))}
      </nav>

      {/* Logout */}
      <div className="px-3 pb-5 border-t border-slate-800 pt-3">
        <button
          onClick={() => handleLogout(slug)}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-slate-400 hover:bg-slate-800 hover:text-red-400 transition-all duration-150"
          dir="rtl"
        >
          <LogOut size={18} className="flex-shrink-0" />
          <span>התנתק</span>
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex flex-col w-[260px] min-h-screen bg-slate-900 flex-shrink-0">
        {sidebarContent}
      </aside>

      {/* Mobile hamburger */}
      <button
        className="lg:hidden fixed top-4 right-4 z-50 p-2.5 bg-slate-900 text-white rounded-xl shadow-lg"
        onClick={() => setMobileOpen(true)}
        aria-label="פתח תפריט"
      >
        <Menu size={20} />
      </button>

      {/* Mobile overlay + sidebar */}
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
