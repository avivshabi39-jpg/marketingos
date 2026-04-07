import { redirect, notFound } from "next/navigation";
import { getClientSession } from "@/lib/clientAuth";
import { prisma } from "@/lib/prisma";
import { ClientSidebar } from "@/components/client/ClientSidebar";
import { getWhitelabelConfig } from "@/lib/whitelabel";
import { OnboardingWrapper } from "@/components/client/OnboardingWrapper";
import { SetupProgressBar } from "@/components/client/SetupProgressBar";
import { getSetupProgress } from "@/lib/setupProgress";
import { NotificationCenter } from "@/components/client/NotificationCenter";
import { PortalCommandPalette } from "@/components/client/PortalCommandPalette";
import { DarkModeToggle } from "@/components/ui/DarkModeToggle";
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
      ownerId: true,
      brandName: true,
      brandLogo: true,
      brandPrimaryColor: true,
      whitelabelEnabled: true,
      portalTitle: true,
      portalWelcome: true,
      portalFooter: true,
      onboardingDone: true,
      phone: true,
      logoUrl: true,
      greenApiInstanceId: true,
      greenApiToken: true,
      facebookPageId: true,
      pagePublished: true,
    },
  });

  if (!client || !client.isActive) notFound();

  // Owner-level white label (agency branding)
  const ownerBrand = await getWhitelabelConfig(client.ownerId);

  // Merge: client-level WL overrides owner-level, owner-level overrides defaults
  const displayName = client.whitelabelEnabled && client.brandName
    ? client.brandName
    : ownerBrand.enabled
      ? ownerBrand.name
      : client.name;
  const primaryColor = client.whitelabelEnabled && client.brandPrimaryColor
    ? client.brandPrimaryColor
    : ownerBrand.enabled
      ? ownerBrand.color
      : client.primaryColor;
  const brandLogo = client.whitelabelEnabled && client.brandLogo
    ? client.brandLogo
    : ownerBrand.enabled
      ? ownerBrand.logo
      : null;
  const hideFooter = ownerBrand.enabled && ownerBrand.hideFooter;

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
        brandLogo={brandLogo}
        industry={client.industry ?? null}
      />
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="lg:hidden bg-white border-b border-gray-100 px-4 h-14 flex items-center">
          <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
            <DarkModeToggle size="sm" />
            <NotificationCenter clientId={client.id} />
          </div>
          {/* Show brand logo in mobile header when white-label is active */}
          {brandLogo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={brandLogo}
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
        <SetupProgressBar progress={getSetupProgress({ ...client, slug: params.slug })} />
        <main className="flex-1 overflow-auto p-4 sm:p-6 lg:p-8">
          <OnboardingWrapper
            clientId={client.id}
            clientName={client.name}
            onboardingDone={client.onboardingDone}
          >
            {children}
          </OnboardingWrapper>
        </main>
        {/* Portal footer */}
        {client.whitelabelEnabled && client.portalFooter ? (
          <footer className="border-t border-gray-100 px-6 py-3 text-xs text-gray-400 text-center">
            {client.portalFooter}
          </footer>
        ) : !hideFooter ? (
          <footer className="border-t border-gray-100 px-6 py-3 text-xs text-gray-400 text-center">
            Powered by {ownerBrand.enabled ? ownerBrand.name : "MarketingOS"}
          </footer>
        ) : null}
      </div>
      <PortalCommandPalette slug={params.slug} />
    </div>
  );
}
