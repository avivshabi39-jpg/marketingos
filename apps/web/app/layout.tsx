import type { Metadata, Viewport } from "next";
import "./globals.css";
import { ToastProvider } from "@/components/ToastProvider";

export const metadata: Metadata = {
  title: "MarketingOS",
  description: "פלטפורמת שיווק רב-לקוחית",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "MarketingOS",
  },
  formatDetection: {
    telephone: false,
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
    <html lang="he" dir="rtl">
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `try{var s=localStorage.getItem('marketingos-dark-mode');if(s==='true'||(!s&&matchMedia('(prefers-color-scheme:dark)').matches))document.documentElement.classList.add('dark')}catch(e){}`,
          }}
        />
        <link rel="apple-touch-icon" href="/icons/icon-192.png" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
      </head>
      <body className="bg-gray-50 text-gray-900 antialiased">
        {children}
        <ToastProvider />
      </body>
    </html>
  );
}
