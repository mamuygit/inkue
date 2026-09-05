import type { MetadataRoute } from "next";
import { absoluteUrl } from "@/i18n/path";

const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://qr.mamuy.dev";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  const paths = ["/", "/login", "/register", "/forgot-password", "/faq", "/privacy", "/terms"];
  return paths.flatMap((path) => {
    const en = absoluteUrl(path, "en", appUrl);
    const th = absoluteUrl(path, "th", appUrl);
    const languages = { en, th, "x-default": en };
    const isHome = path === "/";
    return [
      {
        url: en,
        lastModified: now,
        changeFrequency: isHome ? "daily" : "monthly",
        priority: isHome ? 1 : 0.6,
        alternates: { languages },
      },
      {
        url: th,
        lastModified: now,
        changeFrequency: isHome ? "daily" : "monthly",
        priority: isHome ? 0.9 : 0.5,
        alternates: { languages },
      },
    ];
  });
}
