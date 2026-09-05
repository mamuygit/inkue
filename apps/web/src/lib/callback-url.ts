import { stripLocalePrefix } from "@/i18n/path";

const AUTH_PAGES = new Set(["/login", "/register", "/forgot-password"]);

export function safeCallbackUrl(callbackUrl: string | undefined, fallback: string) {
  if (!callbackUrl) return fallback;
  if (!callbackUrl.startsWith("/") || callbackUrl.startsWith("//") || callbackUrl.includes("\\")) {
    return fallback;
  }
  const path = callbackUrl.split("?")[0] ?? "";
  const inner = stripLocalePrefix(path);
  if (AUTH_PAGES.has(inner) || [...AUTH_PAGES].some((page) => inner.startsWith(`${page}/`))) {
    return fallback;
  }
  return callbackUrl;
}
