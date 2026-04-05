import { Sidebar } from "@/components/admin/Sidebar";
import { KeyboardShortcuts } from "@/components/admin/KeyboardShortcuts";
import { TopBar } from "@/components/admin/TopBar";
import { AdminOnboarding } from "@/components/admin/AdminOnboarding";
import { PushPermission } from "@/components/admin/PushPermission";
import { PwaInstallBanner } from "@/components/admin/PwaInstallBanner";
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
    <div className="flex min-h-screen" dir="ltr">
      <Sidebar hasRealEstate={hasRealEstate} />
      <div className="flex-1 overflow-auto pb-16 lg:pb-0" dir="rtl">
        {isPastDue && (
          <div className="bg-yellow-50 border-b border-yellow-200 px-6 py-3 text-sm text-yellow-800 flex items-center justify-between gap-4" dir="rtl">
            <span>⚠️ יש בעיה עם תשלום המנוי שלך. אנא עדכן את פרטי התשלום כדי להמשיך להשתמש בשירות.</span>
            <Link href="/admin/billing" className="font-semibold underline hover:text-yellow-900 whitespace-nowrap">
              עדכן תשלום
            </Link>
          </div>
        )}
        <TopBar />
        <div className="p-8">{children}</div>
      </div>
      <KeyboardShortcuts />
      <AdminOnboarding userName="משתמש חדש" />
      <PushPermission />
      <PwaInstallBanner />
    </div>
  );
}
