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
    const headers = [
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
          "img-src 'self' data: blob: https://res.cloudinary.com https://api.qrserver.com https://www.google-analytics.com",
          "font-src 'self'",
          "connect-src 'self' https://api.resend.com https://api.cloudinary.com https://api.green-api.com https://www.google-analytics.com https://analytics.google.com",
          "frame-src 'none'",
          "object-src 'none'",
          "base-uri 'self'",
          "form-action 'self'",
          // Only force HTTPS upgrade in production — never in dev (causes redirect loops)
          ...(isProd ? ["upgrade-insecure-requests"] : []),
        ].join("; "),
      },
    ];

    // HSTS must never be sent over HTTP — production only
    if (isProd) {
      headers.push({
        key: "Strict-Transport-Security",
        value: "max-age=63072000; includeSubDomains; preload",
      });
    }

    return [{ source: "/(.*)", headers }];
  },
};

module.exports = nextConfig;
