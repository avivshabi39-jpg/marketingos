"use client";

import Link from "next/link";
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
} from "lucide-react";
import { cn } from "@/lib/utils";

type NavItem = {
  label: string;
  href: string;
  icon: React.ElementType;
};

function buildNav(slug: string, isRealEstate: boolean): NavItem[] {
  const items: NavItem[] = [
    { label: "🏠 הבית שלי",    href: `/client/${slug}`,            icon: LayoutDashboard },
    { label: "🎯 הלידים שלי",  href: `/client/${slug}/leads`,      icon: Users },
    { label: "📊 הדוחות שלי",  href: `/client/${slug}/reports`,    icon: FileBarChart },
    { label: "📅 התורים שלי",  href: `/client/${slug}/appointments`, icon: FileBarChart },
    { label: "📢 שידור",       href: `/client/${slug}/broadcast`,    icon: FileBarChart },
    { label: "🌐 הדף שלי",     href: `/client/${slug}/settings`,   icon: Globe },
    { label: "✏️ ערוך דף",     href: `/client/${slug}/edit-page`,  icon: Globe },
    { label: "🤖 הסוכן שלי",   href: `/client/${slug}/ai-agent`,   icon: Bot },
    { label: "⚙️ הגדרות",     href: `/client/${slug}/settings`,   icon: Settings },
  ];
  if (isRealEstate) {
    items.splice(2, 0, {
      label: "🏡 הנכסים שלי",
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
      className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 group min-h-[44px]"
      style={
        active
          ? { backgroundColor: primaryColor, color: "white", boxShadow: "0 1px 3px rgba(0,0,0,0.2)" }
          : undefined
      }
      data-active={active ? "true" : undefined}
      dir="rtl"
    >
      <Icon
        size={18}
        className={cn(
          "flex-shrink-0 transition-colors",
          active ? "text-white" : "text-gray-500 group-hover:text-white"
        )}
      />
      <span className={active ? "text-white" : "text-gray-400 group-hover:text-white"}>
        {item.label}
      </span>
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
    <div className="flex flex-col h-full">
      {/* Logo / brand header */}
      <div className="flex items-center gap-3 px-4 py-4 border-b border-gray-800">
        {brandLogo ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={brandLogo}
            alt={clientName}
            className="h-8 object-contain flex-shrink-0"
          />
        ) : (
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center text-white font-bold text-sm flex-shrink-0"
            style={{ backgroundColor: primaryColor }}
          >
            {clientName[0]}
          </div>
        )}
        <div className="min-w-0 flex-1">
          <p className="text-white font-semibold text-sm leading-tight truncate">{clientName}</p>
          <p className="text-gray-500 text-xs flex items-center gap-1">
            <TrendingUp size={11} />
            פורטל לקוחות
          </p>
        </div>
        {/* Mobile close */}
        <button
          className="lg:hidden text-gray-400 hover:text-white min-w-[44px] min-h-[44px] flex items-center justify-center"
          onClick={() => setMobileOpen(false)}
          aria-label="סגור תפריט"
        >
          <X size={18} />
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto" dir="rtl">
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
      <div className="px-3 pb-5 border-t border-gray-800 pt-3">
        <button
          onClick={() => handleLogout(slug)}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-400 hover:bg-gray-800 hover:text-white transition-all duration-150"
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
      <aside className="hidden lg:flex flex-col w-60 min-h-screen bg-gray-900 flex-shrink-0">
        {sidebarContent}
      </aside>

      {/* Mobile hamburger */}
      <button
        className="lg:hidden fixed top-4 right-4 z-50 p-2 bg-gray-900 text-white rounded-lg shadow-lg"
        onClick={() => setMobileOpen(true)}
        aria-label="פתח תפריט"
      >
        <Menu size={20} />
      </button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-40 flex" dir="rtl">
          <aside className="relative flex flex-col w-60 min-h-screen bg-gray-900 z-50">
            {sidebarContent}
          </aside>
          <div
            className="flex-1 bg-black/50"
            onClick={() => setMobileOpen(false)}
          />
        </div>
      )}
    </>
  );
}
