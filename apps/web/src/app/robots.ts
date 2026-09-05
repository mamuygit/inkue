import type { MetadataRoute } from "next";

const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://qr.mamuy.dev";

const SOCIAL_CRAWLERS = [
  "facebookexternalhit",
  "Facebot",
  "Twitterbot",
  "LinkedInBot",
  "WhatsApp",
  "Slackbot",
  "Discordbot",
  "TelegramBot",
];

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      ...SOCIAL_CRAWLERS.map((userAgent) => ({
        userAgent,
        allow: "/",
      })),
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/dashboard", "/th/dashboard", "/api", "/r/"],
      },
    ],
    sitemap: `${appUrl}/sitemap.xml`,
  };
}
