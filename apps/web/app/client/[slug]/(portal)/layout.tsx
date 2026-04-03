import { redirect, notFound } from "next/navigation";
import { getClientSession } from "@/lib/clientAuth";
import { prisma } from "@/lib/prisma";
import { ClientSidebar } from "@/components/client/ClientSidebar";
import type { Metadata } from "next";

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  const client = await prisma.client.findUnique({
    where: { slug: params.slug },
    select: { name: true, brandName: true, whitelabelEnabled: true },
  });
  const name =
    client?.whitelabelEnabled && client?.brandName
      ? client.brandName
      : client?.name ?? "MarketingOS";
  return { title: `${name} — לוח בקרה` };
}

export default async function ClientPortalLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { slug: string };
}) {
  const session = await getClientSession();

  if (!session) {
    redirect(`/client/${params.slug}/login`);
  }

  if (session.slug !== params.slug) {
    redirect(`/client/${session.slug}`);
  }

  const client = await prisma.client.findUnique({
    where: { slug: params.slug },
    select: {
      id: true,
      name: true,
      primaryColor: true,
      isActive: true,
      industry: true,
      brandName: true,
      brandLogo: true,
      brandPrimaryColor: true,
      whitelabelEnabled: true,
      portalTitle: true,
      portalWelcome: true,
      portalFooter: true,
    },
  });

  if (!client || !client.isActive) notFound();

  // White-label: override display name and color when enabled
  const displayName  = client.whitelabelEnabled && client.brandName
    ? client.brandName
    : client.name;
  const primaryColor = client.whitelabelEnabled && client.brandPrimaryColor
    ? client.brandPrimaryColor
    : client.primaryColor;

  return (
    <div className="flex min-h-screen bg-gray-50" dir="rtl">
      {/* CSS variables + helper classes for brand color */}
      <style>{`
        :root {
          --brand-primary: ${primaryColor};
        }
        .brand-primary-bg { background-color: ${primaryColor} !important; }
        .brand-primary-text { color: ${primaryColor} !important; }
        .brand-primary-border { border-color: ${primaryColor} !important; }
      `}</style>

      <ClientSidebar
        slug={params.slug}
        clientName={displayName}
        primaryColor={primaryColor}
        brandLogo={client.whitelabelEnabled ? (client.brandLogo ?? null) : null}
        industry={client.industry ?? null}
      />
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="lg:hidden bg-white border-b border-gray-100 px-4 h-14 flex items-center">
          <div className="w-10" />
          {/* Show brand logo in mobile header when white-label is active */}
          {client.whitelabelEnabled && client.brandLogo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={client.brandLogo}
              alt={displayName}
              className="h-7 object-contain mx-auto"
            />
          ) : (
            <p className="font-semibold text-gray-900 text-sm mx-auto">{displayName}</p>
          )}
        </header>
        {/* Portal welcome banner */}
        {client.whitelabelEnabled && client.portalWelcome && (
          <div className="bg-indigo-50 border-b border-indigo-100 px-6 py-2.5 text-sm text-indigo-800 text-right">
            {client.portalWelcome}
          </div>
        )}
        <main className="flex-1 overflow-auto p-4 sm:p-6 lg:p-8">{children}</main>
        {/* Portal footer */}
        {client.whitelabelEnabled && client.portalFooter && (
          <footer className="border-t border-gray-100 px-6 py-3 text-xs text-gray-400 text-center">
            {client.portalFooter}
          </footer>
        )}
      </div>
    </div>
  );
}
