import type { Metadata } from "next";
import { BRAND } from "@mamuy/shared";
import type { Locale } from "./config";
import { absoluteUrl } from "./path";

const appUrl = () => process.env.NEXT_PUBLIC_APP_URL ?? "https://qr.mamuy.dev";
const OG_VERSION = "3";

function assetUrl(path: string) {
  return `${appUrl().replace(/\/$/, "")}${path}`;
}

export const OG_IMAGE = {
  url: `${assetUrl("/og.png")}?v=${OG_VERSION}`,
  secureUrl: `${assetUrl("/og.png")}?v=${OG_VERSION}`,
  width: 1200,
  height: 630,
  alt: `${BRAND.name} — Free QR Code Generator with Logo`,
  type: "image/png",
} as const;

export function localeUrls(path: string, locale: Locale) {
  const base = appUrl();
  const en = absoluteUrl(path, "en", base);
  const th = absoluteUrl(path, "th", base);
  const canonical = locale === "th" ? th : en;
  return { en, th, canonical };
}

export function localeAlternates(path: string, locale: Locale): Pick<Metadata, "alternates"> {
  const { en, th, canonical } = localeUrls(path, locale);
  return {
    alternates: {
      canonical,
      languages: {
        en,
        th,
        "x-default": en,
      },
    },
  };
}

export function socialMetadata(
  path: string,
  locale: Locale,
  meta: { title: string; description: string },
): Pick<Metadata, "openGraph" | "twitter"> {
  const { canonical } = localeUrls(path, locale);
  const image = { ...OG_IMAGE, alt: meta.title };
  return {
    openGraph: {
      type: "website",
      siteName: BRAND.name,
      title: meta.title,
      description: meta.description,
      url: canonical,
      locale: locale === "th" ? "th_TH" : "en_US",
      alternateLocale: locale === "th" ? ["en_US"] : ["th_TH"],
      images: [image],
    },
    twitter: {
      card: "summary_large_image",
      title: meta.title,
      description: meta.description,
      images: [image.url],
    },
  };
}

export function publicPageMetadata(
  path: string,
  locale: Locale,
  meta: { title: string; description: string },
): Metadata {
  return {
    title: meta.title,
    description: meta.description,
    ...localeAlternates(path, locale),
    ...socialMetadata(path, locale, meta),
  };
}
