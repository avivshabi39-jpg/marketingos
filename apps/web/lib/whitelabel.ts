import { prisma } from "@/lib/prisma";
import { cache } from "react";

export interface WhitelabelConfig {
  enabled: boolean;
  name: string;
  logo: string | null;
  color: string;
  domain: string | null;
  fromEmail: string | null;
  hideFooter: boolean;
}

export const DEFAULT_BRAND: WhitelabelConfig = {
  enabled: false,
  name: "MarketingOS",
  logo: null,
  color: "#6366f1",
  domain: null,
  fromEmail: null,
  hideFooter: false,
};

export const getWhitelabelConfig = cache(
  async (ownerId: string | null): Promise<WhitelabelConfig> => {
    if (!ownerId) return DEFAULT_BRAND;
    try {
      const user = await prisma.user.findUnique({
        where: { id: ownerId },
        select: {
          wlEnabled: true,
          wlName: true,
          wlLogo: true,
          wlColor: true,
          wlDomain: true,
          wlFromEmail: true,
          wlHideFooter: true,
        },
      });

      if (!user?.wlEnabled) return DEFAULT_BRAND;

      return {
        enabled: true,
        name: user.wlName || DEFAULT_BRAND.name,
        logo: user.wlLogo,
        color: user.wlColor || DEFAULT_BRAND.color,
        domain: user.wlDomain,
        fromEmail: user.wlFromEmail,
        hideFooter: user.wlHideFooter,
      };
    } catch {
      return DEFAULT_BRAND;
    }
  }
);
