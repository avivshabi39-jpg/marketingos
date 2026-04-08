import { Sidebar } from "@/components/admin/Sidebar";
import { KeyboardShortcuts } from "@/components/admin/KeyboardShortcuts";
import { TopBar } from "@/components/admin/TopBar";
import { AdminOnboarding } from "@/components/admin/AdminOnboarding";
import { PushPermission } from "@/components/admin/PushPermission";
import { DarkModeToggle } from "@/components/ui/DarkModeToggle";
import dynamic from "next/dynamic";

const PwaInstallBanner = dynamic(() => import("@/components/admin/PwaInstallBanner").then((m) => ({ default: m.PwaInstallBanner })), { ssr: false });
const InactivityGuard = dynamic(() => import("@/components/admin/InactivityGuard").then((m) => ({ default: m.InactivityGuard })), { ssr: false });
const AdminCommandPalette = dynamic(() => import("@/components/admin/AdminCommandPalette").then((m) => ({ default: m.AdminCommandPalette })), { ssr: false });
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import Link from "next/link";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session) redirect("/admin/login");

  // אם האשף לא הושלם — redirect לאשף הכניסה (אלא אם כבר בדרך לשם)
  const hdrs = await headers();
  const pathname = hdrs.get("x-pathname") ?? hdrs.get("x-invoke-path") ?? "";
  const isOnboarding = pathname.includes("/onboarding");
  const isPastDue = hdrs.get("x-subscription-past-due") === "1";

  if (!isOnboarding && session.onboardingCompleted === false) {
    // בדוק בDB — ה-JWT עשוי להיות ישן
    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      select: { onboardingCompleted: true },
    });
    if (user && !user.onboardingCompleted) {
      redirect("/admin/onboarding");
    }
  }

  const isSuperAdmin = session.role === "SUPER_ADMIN";
  const hasRealEstate = await prisma.client.count({
    where: isSuperAdmin
      ? { industry: "REAL_ESTATE", isActive: true }
      : { ownerId: session.userId, industry: "REAL_ESTATE", isActive: true },
  }) > 0;

  return (
    <div className="flex min-h-screen" style={{ backgroundColor: '#F8FAFC' }} dir="ltr">
      <Sidebar hasRealEstate={hasRealEstate} />
      <div className="flex-1 overflow-auto pb-16 lg:pb-0" dir="rtl">
        {isPastDue && (
          <div className="bg-amber-50 border-b border-amber-200 px-6 py-3 text-sm text-amber-800 flex items-center justify-between gap-4" dir="rtl">
            <span>יש בעיה עם תשלום המנוי שלך. אנא עדכן את פרטי התשלום כדי להמשיך להשתמש בשירות.</span>
            <Link href="/admin/billing" className="font-semibold underline hover:text-amber-900 whitespace-nowrap">
              עדכן תשלום
            </Link>
          </div>
        )}
        <div className="flex items-center justify-between sticky top-0 z-10"
             style={{ borderBottom: '1px solid #E2E8F0', backgroundColor: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(8px)' }}>
          <TopBar />
          <div className="px-4"><DarkModeToggle /></div>
        </div>
        <div className="p-6 lg:p-8">{children}</div>
      </div>
      <KeyboardShortcuts />
      <AdminOnboarding userName="משתמש חדש" />
      <PushPermission />
      <PwaInstallBanner />
      <InactivityGuard />
      <AdminCommandPalette />
    </div>
  );
}
