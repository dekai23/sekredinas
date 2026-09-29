import type { MetadataRoute } from "next";

const BERANDA = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

/** robots.txt: area publik terindeks, area internal dilarang (PRD 8.1). */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/dashboard", "/admin", "/masuk", "/api", "/berkas"],
      },
    ],
    sitemap: `${BERANDA}/sitemap.xml`,
  };
}
