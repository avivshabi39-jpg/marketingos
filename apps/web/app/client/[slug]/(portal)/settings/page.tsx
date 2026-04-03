import { notFound, redirect } from "next/navigation";
import { getClientSession } from "@/lib/clientAuth";
import { prisma } from "@/lib/prisma";
import { PasswordChangeForm } from "./PasswordChangeForm";
import { Building2, Phone, Mail, Globe, Palette } from "lucide-react";

export default async function ClientSettingsPage({
  params,
}: {
  params: { slug: string };
}) {
  const session = await getClientSession();
  if (!session || session.slug !== params.slug) {
    redirect(`/client/${params.slug}/login`);
  }

  const client = await prisma.client.findUnique({
    where: { slug: params.slug },
    select: {
      id: true,
      name: true,
      slug: true,
      email: true,
      phone: true,
      industry: true,
      primaryColor: true,
      plan: true,
      isActive: true,
    },
  });

  if (!client || !client.isActive) notFound();

  const INDUSTRY_HE: Record<string, string> = {
    ROOFING: "גגות",
    ALUMINUM: "אלומיניום",
    COSMETICS: "קוסמטיקה",
    CLEANING: "ניקיון",
    REAL_ESTATE: "נדל״ן",
    OTHER: "אחר",
  };

  const PLAN_HE: Record<string, string> = {
    BASIC: "בסיסי",
    PRO: "פרו",
    AGENCY: "סוכנות",
  };

  return (
    <div className="space-y-6 max-w-2xl" dir="rtl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">הגדרות</h1>
        <p className="text-gray-500 mt-0.5 text-sm">פרטי העסק שלך וניהול גישה לפורטל</p>
      </div>

      {/* Business info card */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-50 flex items-center gap-2">
          <Building2 size={18} className="text-gray-400" />
          <h2 className="font-semibold text-gray-900">פרטי העסק</h2>
          <span className="text-xs text-gray-400 mr-auto">(לעדכון פרטים, פנה לצוות MarketingOS)</span>
        </div>

        <div className="px-6 py-5 space-y-4">
          {/* Name */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
              שם העסק
            </label>
            <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-lg px-4 py-2.5">
              <Building2 size={15} className="text-gray-400 flex-shrink-0" />
              <p className="text-sm text-gray-800 font-medium">{client.name}</p>
            </div>
          </div>

          {/* Email */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
              כתובת אימייל
            </label>
            <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-lg px-4 py-2.5">
              <Mail size={15} className="text-gray-400 flex-shrink-0" />
              <p className="text-sm text-gray-700 font-mono" dir="ltr">{client.email}</p>
            </div>
          </div>

          {/* Phone */}
          {client.phone && (
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                טלפון
              </label>
              <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-lg px-4 py-2.5">
                <Phone size={15} className="text-gray-400 flex-shrink-0" />
                <p className="text-sm text-gray-700" dir="ltr">{client.phone}</p>
              </div>
            </div>
          )}

          {/* Industry */}
          {client.industry && (
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                תעשייה
              </label>
              <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-lg px-4 py-2.5">
                <Globe size={15} className="text-gray-400 flex-shrink-0" />
                <p className="text-sm text-gray-700">
                  {INDUSTRY_HE[client.industry] ?? client.industry}
                </p>
              </div>
            </div>
          )}

          {/* Color + Plan row */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                צבע ראשי
              </label>
              <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-lg px-4 py-2.5">
                <Palette size={15} className="text-gray-400 flex-shrink-0" />
                <div
                  className="w-4 h-4 rounded-full border border-gray-200"
                  style={{ backgroundColor: client.primaryColor }}
                />
                <p className="text-sm text-gray-700 font-mono" dir="ltr">{client.primaryColor}</p>
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                תוכנית
              </label>
              <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-lg px-4 py-2.5">
                <p className="text-sm text-gray-700">{PLAN_HE[client.plan] ?? client.plan}</p>
              </div>
            </div>
          </div>

          {/* Slug */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
              מזהה פורטל (Slug)
            </label>
            <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-lg px-4 py-2.5">
              <p className="text-sm text-gray-700 font-mono" dir="ltr">{client.slug}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Change password card */}
      <PasswordChangeForm slug={params.slug} />
    </div>
  );
}
