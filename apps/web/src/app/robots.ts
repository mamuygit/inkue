import type { MetadataRoute } from "next";

const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://qr.mamuy.dev";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/dashboard", "/th/dashboard", "/api", "/r/"],
      },
    ],
    sitemap: `${appUrl}/sitemap.xml`,
  };
}
