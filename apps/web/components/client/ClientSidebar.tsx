"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  LayoutDashboard,
  Users,
  FileBarChart,
  Settings,
  LogOut,
  Menu,
  X,
  ChevronLeft,
  TrendingUp,
  Globe,
  Bot,
  Home,
  Mail,
  HelpCircle,
  Palette,
  Search,
  CalendarDays,
  Radio,
  Share2,
  Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";

type NavItem = {
  label: string;
  href: string;
  icon: React.ElementType;
};

function buildNav(slug: string, isRealEstate: boolean): NavItem[] {
  const items: NavItem[] = [
    { label: "ראשי",        href: `/client/${slug}`,              icon: LayoutDashboard },
    { label: "לידים",       href: `/client/${slug}/leads`,        icon: Users },
    { label: "דוחות",       href: `/client/${slug}/reports`,      icon: FileBarChart },
    { label: "אנליטיקס",    href: `/client/${slug}/analytics`,    icon: TrendingUp },
    { label: "SEO וגוגל",   href: `/client/${slug}/seo`,          icon: Search },
    { label: "תורים",       href: `/client/${slug}/appointments`, icon: CalendarDays },
    { label: "שידור",       href: `/client/${slug}/broadcast`,    icon: Radio },
    { label: "פוסטים",      href: `/client/${slug}/social`,       icon: Share2 },
    { label: "עיצוב AI",    href: `/client/${slug}/ai-designer`,  icon: Palette },
    { label: "בנה דף",       href: `/client/${slug}/build-page`,   icon: Globe },
    { label: "ערוך דף",     href: `/client/${slug}/edit-page`,    icon: Globe },
    { label: "מיילים",       href: `/client/${slug}/email`,        icon: Mail },
    { label: "אוטומציות",   href: `/client/${slug}/automations`,  icon: Zap },
    { label: "הסוכן שלי",   href: `/client/${slug}/ai-agent`,     icon: Bot },
    { label: "עזרה",        href: `/client/${slug}/help`,         icon: HelpCircle },
    { label: "הגדרות",     href: `/client/${slug}/settings`,     icon: Settings },
  ];
  if (isRealEstate) {
    items.splice(2, 0, {
      label: "הנכסים שלי",
      href: `/client/${slug}/properties`,
      icon: Home,
    });
  }
  return items;
}

async function handleLogout(slug: string) {
  await fetch("/api/client-auth/login", { method: "DELETE" });
  window.location.href = `/client/${slug}/login`;
}

function NavLink({
  item,
  active,
  primaryColor,
  onClick,
}: {
  item: NavItem;
  active: boolean;
  primaryColor: string;
  onClick?: () => void;
}) {
  const Icon = item.icon;
  return (
    <Link
      href={item.href}
      onClick={onClick}
      className={cn(
        "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 group min-h-[40px]",
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
        size={18}
        className={cn(
          "flex-shrink-0 transition-colors",
          active ? "text-white" : "text-slate-500 group-hover:text-slate-300"
        )}
      />
      <span className="flex-1">{item.label}</span>
      {active && <ChevronLeft size={14} className="mr-auto opacity-60 text-white" />}
    </Link>
  );
}

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
  const navItems = buildNav(slug, industry === "REAL_ESTATE");

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
        {navItems.map((item) => {
          const isActive =
            item.href === `/client/${slug}`
              ? pathname === item.href
              : pathname.startsWith(item.href);
          return (
            <NavLink
              key={item.href}
              item={item}
              active={isActive}
              primaryColor={primaryColor}
              onClick={() => setMobileOpen(false)}
            />
          );
        })}
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
