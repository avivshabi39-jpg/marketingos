import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Megaphone, Plus } from "lucide-react";
import { CampaignQuickCreate } from "@/components/admin/CampaignQuickCreate";

export default async function CampaignsIndexPage() {
  const session = await getSession();
  if (!session) redirect("/admin/login");

  // Get all clients for this admin
  const clients = await prisma.client.findMany({
    where: { ownerId: session.userId, isActive: true },
    select: {
      id: true,
      name: true,
      slug: true,
      primaryColor: true,
      _count: { select: { campaignImages: true } },
    },
    orderBy: { name: "asc" },
  });

  // Get latest 3 images per client
  const clientsWithImages = await Promise.all(
    clients.map(async (c) => {
      const images = await prisma.campaignImage.findMany({
        where: { clientId: c.id },
        orderBy: { createdAt: "desc" },
        take: 3,
        select: { id: true, imageUrl: true, headline: true, imageType: true },
      });
      return { ...c, images };
    })
  );

  return (
    <div className="space-y-6" dir="rtl">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Megaphone size={22} className="text-blue-500" /> קמפיינים
          </h1>
          <p className="text-sm text-slate-500 mt-1">יצירת תמונות קמפיין לכל לקוח</p>
        </div>
        {clients.length > 0 && (
          <CampaignQuickCreate
            clients={clients.map((c) => ({ id: c.id, name: c.name, primaryColor: c.primaryColor }))}
          />
        )}
      </div>

      {clients.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm flex flex-col items-center py-16">
          <Megaphone size={36} className="text-slate-200 mb-3" />
          <p className="text-sm text-slate-500">אין לקוחות פעילים</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {clientsWithImages.map((c) => (
            <div key={c.id} className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
              {/* Header */}
              <div className="p-4 flex items-center gap-3 border-b border-slate-50">
                <div
                  className="w-9 h-9 rounded-lg flex items-center justify-center text-white font-bold text-sm flex-shrink-0"
                  style={{ backgroundColor: c.primaryColor }}
                >
                  {c.name[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-slate-900 text-sm truncate">{c.name}</p>
                  <p className="text-xs text-slate-400">{c._count.campaignImages} תמונות</p>
                </div>
                <Link
                  href={`/admin/clients/${c.id}/campaigns`}
                  className="flex items-center gap-1 text-xs bg-blue-50 text-blue-600 hover:bg-blue-100 px-3 py-1.5 rounded-lg transition font-medium"
                >
                  <Plus size={12} /> צור
                </Link>
              </div>

              {/* Images preview */}
              {c.images.length > 0 ? (
                <div className="p-3 grid grid-cols-3 gap-1.5">
                  {c.images.map((img) => (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      key={img.id}
                      src={img.imageUrl}
                      alt={img.headline}
                      className="w-full aspect-square object-cover rounded-lg"
                    />
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center py-8 text-slate-300">
                  <Megaphone size={24} className="mb-1.5" />
                  <p className="text-xs">אין תמונות עדיין</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
