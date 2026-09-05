import type { MetadataRoute } from "next";
import { absoluteUrl } from "@/i18n/path";

const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://qr.mamuy.dev";

type PublicPage = {
  path: string;
  changeFrequency: NonNullable<MetadataRoute.Sitemap[number]["changeFrequency"]>;
  priority: number;
};

const PUBLIC_PAGES: PublicPage[] = [
  { path: "/", changeFrequency: "weekly", priority: 1 },
  { path: "/faq", changeFrequency: "monthly", priority: 0.8 },
  { path: "/privacy", changeFrequency: "yearly", priority: 0.3 },
  { path: "/terms", changeFrequency: "yearly", priority: 0.3 },
];

export default function sitemap(): MetadataRoute.Sitemap {
  return PUBLIC_PAGES.flatMap(({ path, changeFrequency, priority }) => {
    const en = absoluteUrl(path, "en", appUrl);
    const th = absoluteUrl(path, "th", appUrl);
    const languages = { en, th, "x-default": en };
    return [
      {
        url: en,
        changeFrequency,
        priority,
        alternates: { languages },
      },
      {
        url: th,
        changeFrequency,
        priority: path === "/" ? 0.9 : Number((priority - 0.1).toFixed(1)),
        alternates: { languages },
      },
    ];
  });
}
