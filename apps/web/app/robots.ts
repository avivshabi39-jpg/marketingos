import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "";
  return {
    rules: [{ userAgent: "*", allow: "/", disallow: ["/admin/", "/client/", "/api/"] }],
    sitemap: `${appUrl}/sitemap.xml`,
    host: appUrl,
  };
}
