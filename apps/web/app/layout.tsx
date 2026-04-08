import type { Metadata, Viewport } from "next";
import { Rubik, Inter } from "next/font/google";
import "./globals.css";
import { ToastProvider } from "@/components/ToastProvider";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";

const rubik = Rubik({
  subsets: ["latin", "hebrew"],
  variable: "--font-rubik",
  display: "swap",
  weight: ["400", "500", "600", "700", "800"],
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "MarketingOS",
    template: "%s | MarketingOS",
  },
  description: "פלטפורמת שיווק רב-לקוחית",
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? "https://marketingos.co.il"),
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "MarketingOS",
  },
  formatDetection: {
    telephone: false,
  },
  openGraph: {
    type: "website",
    locale: "he_IL",
  },
};

export const viewport: Viewport = {
  themeColor: "#6366f1",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="he" dir="rtl" className={`${rubik.variable} ${inter.variable}`}>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `try{var s=localStorage.getItem('marketingos-dark-mode');if(s==='true'||(!s&&matchMedia('(prefers-color-scheme:dark)').matches))document.documentElement.classList.add('dark')}catch(e){}`,
          }}
        />
        <link rel="preconnect" href="https://res.cloudinary.com" />
        <link rel="preconnect" href="https://va.vercel-scripts.com" />
        <link rel="dns-prefetch" href="https://api.green-api.com" />
        <link rel="dns-prefetch" href="https://graph.facebook.com" />
        <link rel="dns-prefetch" href="https://api.anthropic.com" />
        <link rel="apple-touch-icon" href="/icons/icon-192.png" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
      </head>
      <body className="bg-slate-50 text-slate-900 antialiased" style={{ fontFamily: "var(--font-rubik), var(--font-inter), system-ui, sans-serif" }}>
        {children}
        <ToastProvider />
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
