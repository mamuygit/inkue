import type { Metadata } from "next";
import type { Locale } from "./config";
import { absoluteUrl } from "./path";

const appUrl = () => process.env.NEXT_PUBLIC_APP_URL ?? "https://qr.mamuy.dev";

export function localeAlternates(path: string, locale: Locale): Pick<Metadata, "alternates" | "openGraph"> {
  const base = appUrl();
  const en = absoluteUrl(path, "en", base);
  const th = absoluteUrl(path, "th", base);
  const canonical = locale === "th" ? th : en;
  return {
    alternates: {
      canonical,
      languages: {
        en,
        th,
        "x-default": en,
      },
    },
    openGraph: {
      locale: locale === "th" ? "th_TH" : "en_US",
      alternateLocale: locale === "th" ? ["en_US"] : ["th_TH"],
      url: canonical,
    },
  };
}

export function publicPageMetadata(
  path: string,
  locale: Locale,
  meta: { title: string; description: string },
): Metadata {
  const alt = localeAlternates(path, locale);
  return {
    title: meta.title,
    description: meta.description,
    ...alt,
  };
}
