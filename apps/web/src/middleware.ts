import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { LOCALE_COOKIE, LOCALE_HEADER, type Locale } from "@/i18n/config";
import { localeFromPathname, localizedPath, stripLocalePrefix } from "@/i18n/path";

const CRAWLER_UA =
  /facebookexternalhit|Facebot|Twitterbot|LinkedInBot|WhatsApp|Slackbot|Discordbot|TelegramBot|Googlebot|Google-Extended|bingbot|Applebot|GPTBot|ChatGPT-User|PerplexityBot|ClaudeBot|anthropic-ai|Bytespider|CCBot|Amazonbot|YouBot/i;

function isSkipped(pathname: string) {
  if (pathname.startsWith("/api")) return true;
  if (pathname.startsWith("/_next")) return true;
  if (pathname === "/r" || pathname.startsWith("/r/")) return true;
  if (pathname === "/sitemap.xml" || pathname === "/robots.txt") return true;
  if (pathname === "/llms.txt" || pathname === "/llms-full.txt") return true;
  if (/\.[a-zA-Z0-9]+$/.test(pathname)) return true;
  return false;
}

function withLocaleHeaders(req: NextRequest, locale: Locale, init?: { rewrite?: URL }) {
  const requestHeaders = new Headers(req.headers);
  requestHeaders.set(LOCALE_HEADER, locale);
  const res = init?.rewrite
    ? NextResponse.rewrite(init.rewrite, { request: { headers: requestHeaders } })
    : NextResponse.next({ request: { headers: requestHeaders } });
  res.headers.set(LOCALE_HEADER, locale);
  if (!CRAWLER_UA.test(req.headers.get("user-agent") ?? "")) {
    res.cookies.set(LOCALE_COOKIE, locale, { path: "/", maxAge: 60 * 60 * 24 * 365, sameSite: "lax" });
  }
  return res;
}

export function middleware(req: NextRequest) {
  const { pathname, search } = req.nextUrl;
  if (isSkipped(pathname)) return NextResponse.next();

  if (pathname === "/en" || pathname.startsWith("/en/")) {
    const inner = stripLocalePrefix(pathname);
    return NextResponse.redirect(new URL(`${inner === "/" ? "/" : inner}${search}`, req.url), 301);
  }

  const locale: Locale = localeFromPathname(pathname);
  const inner = stripLocalePrefix(pathname);

  const prefix = process.env.AUTH_COOKIE_PREFIX ?? "mamuy-qr";
  const token = req.cookies.get(`${prefix}.session-token`);
  if (inner.startsWith("/dashboard") && !token) {
    const login = new URL(localizedPath("/login", locale), req.url);
    login.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(login);
  }

  if (locale === "th") {
    return withLocaleHeaders(req, "th");
  }

  const rewriteUrl = req.nextUrl.clone();
  rewriteUrl.pathname = inner === "/" ? "/en" : `/en${inner}`;
  return withLocaleHeaders(req, "en", { rewrite: rewriteUrl });
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
