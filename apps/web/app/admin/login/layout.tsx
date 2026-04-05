import type { Metadata } from "next";

export const metadata: Metadata = {
  robots: "noindex, nofollow",
  title: "כניסה — MarketingOS",
};

export default function LoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
