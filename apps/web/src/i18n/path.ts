import { DEFAULT_LOCALE, type Locale } from "./config";

export function stripLocalePrefix(pathname: string): string {
  if (pathname === "/th" || pathname === "/en") return "/";
  if (pathname.startsWith("/th/")) return pathname.slice(3) || "/";
  if (pathname.startsWith("/en/")) return pathname.slice(3) || "/";
  return pathname || "/";
}

export function localeFromPathname(pathname: string): Locale {
  if (pathname === "/th" || pathname.startsWith("/th/")) return "th";
  return DEFAULT_LOCALE;
}

export function localizedPath(path: string, locale: Locale): string {
  const raw = path.startsWith("/") ? path : `/${path}`;
  const inner = stripLocalePrefix(raw);
  if (locale === DEFAULT_LOCALE) return inner;
  return inner === "/" ? "/th" : `/th${inner}`;
}

export function switchLocalePath(pathname: string, next: Locale): string {
  return localizedPath(stripLocalePrefix(pathname), next);
}

export function absoluteUrl(path: string, locale: Locale, appUrl: string): string {
  const p = localizedPath(path, locale);
  return `${appUrl.replace(/\/$/, "")}${p === "/" ? "" : p}`;
}
