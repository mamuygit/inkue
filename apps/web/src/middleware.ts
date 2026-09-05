import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { LOCALE_COOKIE, LOCALE_HEADER, type Locale } from "@/i18n/config";
import { localeFromPathname, localizedPath, stripLocalePrefix } from "@/i18n/path";

const CRAWLER_UA =
  /facebookexternalhit|Facebot|Twitterbot|LinkedInBot|WhatsApp|Slackbot|Discordbot|TelegramBot|Googlebot|Google-Extended|bingbot|Applebot|GPTBot|ChatGPT-User|PerplexityBot|ClaudeBot|anthropic-ai|Bytespider|CCBot|Amazonbot|YouBot/i;

function hasSessionToken(req: NextRequest) {
  const prefix = process.env.AUTH_COOKIE_PREFIX ?? "mamuy-qr";
  const base = `${prefix}.session-token`;
  const secure = `__Secure-${base}`;
  return Boolean(
    req.cookies.get(base)?.value ||
      req.cookies.get(`${base}.0`)?.value ||
      req.cookies.get(secure)?.value ||
      req.cookies.get(`${secure}.0`)?.value,
  );
}

function isPrefetch(req: NextRequest) {
  return (
    req.headers.get("x-middleware-prefetch") === "1" ||
    req.headers.get("next-router-prefetch") === "1" ||
    req.headers.get("purpose") === "prefetch"
  );
}

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

  if (inner.startsWith("/dashboard") && !hasSessionToken(req)) {
    // Prefetching a protected route while logged out must not cache a login
    // redirect — Next.js would reuse it after sign-in (e.g. "+ Create QR").
    if (isPrefetch(req)) {
      return new NextResponse(null, { status: 204 });
    }
    const login = new URL(localizedPath("/login", locale), req.url);
    login.searchParams.set("callbackUrl", pathname);
    const res = NextResponse.redirect(login);
    res.headers.set("x-middleware-cache", "no-cache");
    res.headers.set("Cache-Control", "no-store");
    return res;
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
