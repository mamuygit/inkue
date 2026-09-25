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

const AI_CRAWLERS = [
  "GPTBot",
  "ChatGPT-User",
  "Google-Extended",
  "Googlebot",
  "PerplexityBot",
  "ClaudeBot",
  "anthropic-ai",
  "Applebot",
  "Bytespider",
  "CCBot",
  "cohere-ai",
  "YouBot",
  "Amazonbot",
];

const DISALLOW = ["/dashboard", "/th/dashboard", "/admin", "/th/admin", "/api", "/r/"];

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      // A crawler obeys only its most specific group, so each group must repeat the disallow list.
      ...[...SOCIAL_CRAWLERS, ...AI_CRAWLERS].map((userAgent) => ({
        userAgent,
        allow: "/",
        disallow: DISALLOW,
      })),
      {
        userAgent: "*",
        allow: "/",
        disallow: DISALLOW,
      },
    ],
    sitemap: `${appUrl}/sitemap.xml`,
  };
}
