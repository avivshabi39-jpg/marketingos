import { prisma } from "@/lib/prisma";
import { getClientSession } from "@/lib/clientAuth";
import { redirect } from "next/navigation";
import { LoginForm } from "./LoginForm";
import { BarChart2, TrendingUp, Users, FileBarChart, Shield } from "lucide-react";

export default async function ClientSlugLoginPage({
  params,
}: {
  params: { slug: string };
}) {
  // If already authenticated, redirect to dashboard
  const session = await getClientSession();
  if (session?.slug === params.slug) {
    redirect(`/client/${params.slug}`);
  }

  // Fetch client name to personalize the page
  const client = await prisma.client.findUnique({
    where: { slug: params.slug },
    select: { name: true, primaryColor: true, isActive: true },
  });

  const clientName = client?.isActive ? client.name : null;
  const primaryColor = client?.primaryColor ?? "#4f46e5";

  return (
    <div className="min-h-screen flex" dir="rtl">
      {/* ── Left panel — dark / decorative ── */}
      <div
        className="hidden lg:flex flex-col justify-between flex-1 px-14 py-12 relative overflow-hidden"
        style={{
          background: `linear-gradient(135deg, #0f172a 0%, #1e293b 60%, ${primaryColor}22 100%)`,
        }}
      >
        {/* Glow blobs */}
        <div
          className="absolute top-1/3 right-1/3 w-72 h-72 rounded-full blur-3xl opacity-20 pointer-events-none"
          style={{ backgroundColor: primaryColor }}
        />
        <div className="absolute bottom-1/4 left-1/4 w-48 h-48 bg-indigo-500/15 rounded-full blur-3xl pointer-events-none" />

        {/* Logo */}
        <div className="flex items-center gap-3 relative z-10">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center shadow-lg"
            style={{ backgroundColor: primaryColor }}
          >
            <TrendingUp size={20} className="text-white" />
          </div>
          <span className="text-white font-bold text-xl tracking-tight">MarketingOS</span>
        </div>

        {/* Center content */}
        <div className="space-y-8 relative z-10">
          {clientName && (
            <div>
              <p className="text-gray-400 text-sm font-medium uppercase tracking-widest mb-2">
                פורטל לקוחות של
              </p>
              <h2 className="text-4xl font-bold text-white leading-tight">{clientName}</h2>
            </div>
          )}
          {!clientName && (
            <div>
              <h2 className="text-4xl font-bold text-white leading-tight">
                פורטל לקוחות<br />
                <span className="text-indigo-300">MarketingOS</span>
              </h2>
            </div>
          )}

          <p className="text-gray-400 text-base leading-relaxed max-w-sm">
            צפייה בלידים, דוחות ביצועים, ומידע על הקמפיינים שלך — הכל במקום אחד.
          </p>

          {/* Feature list */}
          <div className="space-y-3">
            {[
              { icon: Users,       label: "מעקב אחר לידים בזמן אמת" },
              { icon: FileBarChart, label: "דוחות ביצועים מפורטים" },
              { icon: Shield,       label: "גישה מאובטחת לנתונים שלך" },
              { icon: BarChart2,    label: "ניתוח מקורות ופילוח קהל" },
            ].map(({ icon: Icon, label }) => (
              <div key={label} className="flex items-center gap-3 text-gray-300">
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: `${primaryColor}33` }}
                >
                  <Icon size={16} style={{ color: primaryColor }} />
                </div>
                <span className="text-sm">{label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <p className="text-gray-600 text-xs relative z-10">
          © {new Date().getFullYear()} MarketingOS · כל הזכויות שמורות
        </p>
      </div>

      {/* ── Right panel — login form ── */}
      <div
        className="w-full lg:w-[420px] flex items-center justify-center px-8 py-12 relative bg-white"
      >
        {/* Mobile logo */}
        <div className="absolute top-6 right-6 flex items-center gap-2 lg:hidden">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ backgroundColor: primaryColor }}
          >
            <TrendingUp size={16} className="text-white" />
          </div>
          <span className="font-bold text-gray-900 text-sm">MarketingOS</span>
        </div>

        <div className="w-full max-w-sm space-y-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">כניסה לפורטל</h1>
            {clientName ? (
              <p className="text-gray-500 mt-1 text-sm">
                ברוך הבא ל-<span className="font-medium text-gray-700">{clientName}</span>
              </p>
            ) : (
              <p className="text-gray-500 mt-1 text-sm">הזן את הסיסמה כדי להיכנס</p>
            )}
          </div>

          <LoginForm slug={params.slug} primaryColor={primaryColor} />

          <p className="text-center text-gray-400 text-xs">
            בעיה בכניסה?{" "}
            <a
              href="mailto:support@marketingos.io"
              className="text-indigo-500 hover:text-indigo-700 underline underline-offset-2 transition-colors"
            >
              צור קשר
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
