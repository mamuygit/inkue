export const LOCALES = ["en", "th"] as const;
export type Locale = (typeof LOCALES)[number];

export const DEFAULT_LOCALE: Locale = "en";
export const LOCALE_COOKIE = "mamuy-qr.locale";
export const LOCALE_HEADER = "x-mamuy-locale";

export function isLocale(value: string | undefined | null): value is Locale {
  return value === "en" || value === "th";
}

export function detectLocale(acceptLanguage: string | null): Locale {
  const raw = (acceptLanguage ?? "").toLowerCase();
  if (raw.includes("th")) return "th";
  return DEFAULT_LOCALE;
}
