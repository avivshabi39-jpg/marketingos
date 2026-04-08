import { redirect, notFound } from "next/navigation";
import { getClientSession } from "@/lib/clientAuth";
import { prisma } from "@/lib/prisma";
import { Megaphone } from "lucide-react";

export default async function ClientCampaignsPage({ params }: { params: { slug: string } }) {
  const session = await getClientSession();
  if (!session) redirect(`/client/${params.slug}/login`);
  if (session.slug !== params.slug) redirect(`/client/${session.slug}/campaigns`);

  const client = await prisma.client.findUnique({
    where: { slug: params.slug },
    select: { id: true, isActive: true },
  });
  if (!client || !client.isActive) notFound();

  const images = await prisma.campaignImage.findMany({
    where: { clientId: client.id },
    orderBy: { createdAt: "desc" },
    take: 20,
  });

  const TYPE_LABELS: Record<string, string> = {
    facebook_post: "פוסט פייסבוק",
    instagram_post: "פוסט אינסטגרם",
    instagram_story: "סטורי אינסטגרם",
    whatsapp: "וואצאפ",
  };

  return (
    <div className="space-y-6" dir="rtl">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
          <Megaphone size={22} className="text-blue-500" /> קמפיינים
        </h1>
        <p className="text-sm text-slate-500 mt-1">תמונות שנוצרו עבורך עד כה</p>
      </div>

      {images.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm flex flex-col items-center py-16">
          <Megaphone size={36} className="text-slate-200 mb-3" />
          <p className="text-sm text-slate-500">עדיין לא נוצרו תמונות קמפיין</p>
          <p className="text-xs text-slate-400 mt-1">הצוות שלנו ייצור תמונות בקרוב</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {images.map((img) => (
            <div key={img.id} className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={img.imageUrl}
                alt={img.headline}
                className="w-full aspect-square object-cover"
              />
              <div className="p-3">
                <p className="text-xs font-medium text-slate-800 line-clamp-1">{img.headline}</p>
                <p className="text-[10px] text-slate-400 mt-0.5">{TYPE_LABELS[img.imageType] ?? img.imageType}</p>
                <p className="text-[10px] text-slate-300 mt-0.5">
                  {new Date(img.createdAt).toLocaleDateString("he-IL")}
                </p>
                <a
                  href={img.imageUrl}
                  download={`campaign-${img.imageType}.svg`}
                  className="mt-2 block text-center text-xs bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg py-1.5 transition"
                >
                  הורד
                </a>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
