import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "פורטל לקוחות | MarketingOS",
};

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
