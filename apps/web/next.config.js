/** @type {import('next').NextConfig} */
const isProd = process.env.NODE_ENV === "production";

const nextConfig = {
  output: "standalone",
  poweredByHeader: false,
  compress: true,
  transpilePackages: ["@marketing/db"],
  experimental: {
    serverComponentsExternalPackages: ["@prisma/client", "bcryptjs", "@react-pdf/renderer"],
  },

  images: {
    remotePatterns: [
      { protocol: "https", hostname: "res.cloudinary.com" },
      { protocol: "https", hostname: "image.pollinations.ai" },
      { protocol: "https", hostname: "lh3.googleusercontent.com" },
    ],
    minimumCacheTTL: 31536000,
    formats: ["image/avif", "image/webp"],
  },

  async redirects() {
    return [
      {
        source: "/admin/email-sequences",
        destination: "/admin/email?tab=sequences",
        permanent: false,
      },
      {
        source: "/admin/email-templates",
        destination: "/admin/email?tab=templates",
        permanent: false,
      },
    ];
  },

  async headers() {
    // Global security headers
    const securityHeaders = [
      { key: "X-Content-Type-Options",           value: "nosniff" },
      { key: "X-Frame-Options",                   value: "DENY" },
      { key: "X-XSS-Protection",                  value: "1; mode=block" },
      { key: "X-DNS-Prefetch-Control",            value: "on" },
      { key: "X-Download-Options",                value: "noopen" },
      { key: "X-Permitted-Cross-Domain-Policies", value: "none" },
      { key: "Referrer-Policy",                   value: "strict-origin-when-cross-origin" },
      { key: "Permissions-Policy",                value: "camera=(), microphone=(), geolocation=()" },
      { key: "Cross-Origin-Opener-Policy",        value: "same-origin" },
      { key: "Cross-Origin-Resource-Policy",      value: "same-origin" },
      { key: "Access-Control-Allow-Origin",       value: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000" },
      { key: "Access-Control-Allow-Methods",      value: "GET, POST, PUT, PATCH, DELETE, OPTIONS" },
      { key: "Access-Control-Allow-Headers",      value: "Content-Type, Authorization, x-api-key" },
      {
        key: "Content-Security-Policy",
        value: [
          "default-src 'self'",
          "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.googletagmanager.com https://www.google-analytics.com",
          "style-src 'self' 'unsafe-inline'",
          "img-src 'self' data: blob: https://res.cloudinary.com https://image.pollinations.ai https://api.qrserver.com https://www.google-analytics.com",
          "font-src 'self'",
          "connect-src 'self' https://api.resend.com https://api.cloudinary.com https://api.green-api.com https://api.anthropic.com https://app.inngest.com https://www.google-analytics.com https://analytics.google.com",
          "frame-src 'none'",
          "object-src 'none'",
          "base-uri 'self'",
          "form-action 'self'",
          ...(isProd ? ["upgrade-insecure-requests"] : []),
        ].join("; "),
      },
    ];

    if (isProd) {
      securityHeaders.push({
        key: "Strict-Transport-Security",
        value: "max-age=63072000; includeSubDomains; preload",
      });
    }

    return [
      // Global security headers
      { source: "/(.*)", headers: securityHeaders },

      // ── Static assets — cache forever ──────────────────
      {
        source: "/icons/:path*",
        headers: [
          { key: "Cache-Control", value: "public, max-age=31536000, immutable" },
        ],
      },
      {
        source: "/manifest.json",
        headers: [
          { key: "Cache-Control", value: "public, max-age=86400" },
        ],
      },
      {
        source: "/sw.js",
        headers: [
          { key: "Cache-Control", value: "public, max-age=0, must-revalidate" },
          { key: "Service-Worker-Allowed", value: "/" },
        ],
      },

      // ── OG images — cache 1 day at CDN ─────────────────
      {
        source: "/api/og",
        headers: [
          { key: "Cache-Control", value: "public, s-maxage=86400, stale-while-revalidate=3600" },
        ],
      },

      // ── Sitemap + robots — cache 1 hour at CDN ─────────
      {
        source: "/sitemap.xml",
        headers: [
          { key: "Cache-Control", value: "public, s-maxage=3600, stale-while-revalidate=600" },
        ],
      },
      {
        source: "/robots.txt",
        headers: [
          { key: "Cache-Control", value: "public, max-age=86400" },
        ],
      },

      // ── API — no cache ─────────────────────────────────
      {
        source: "/api/:path*",
        headers: [
          { key: "Cache-Control", value: "no-store, no-cache" },
        ],
      },

      // ── Admin/portal — private, no cache ───────────────
      {
        source: "/admin/:path*",
        headers: [
          { key: "Cache-Control", value: "private, no-store" },
        ],
      },
      {
        source: "/client/:path*",
        headers: [
          { key: "Cache-Control", value: "private, no-store" },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
