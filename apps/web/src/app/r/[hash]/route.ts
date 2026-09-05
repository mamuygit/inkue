import { NextRequest, NextResponse } from "next/server";

function apiBase() {
  return (process.env.API_INTERNAL_URL ?? "http://localhost:3001").replace(/\/$/, "");
}

function forwardHeaders(req: NextRequest) {
  const headers = new Headers();
  for (const name of ["user-agent", "referer", "x-forwarded-for", "x-real-ip"]) {
    const value = req.headers.get(name);
    if (value) headers.set(name, value);
  }
  if (!headers.has("x-forwarded-for")) {
    const ip = req.headers.get("x-real-ip");
    if (ip) headers.set("x-forwarded-for", ip);
  }
  return headers;
}

async function proxyRedirect(req: NextRequest, hash: string) {
  const res = await fetch(`${apiBase()}/r/${encodeURIComponent(hash)}`, {
    method: "GET",
    headers: forwardHeaders(req),
    redirect: "manual",
    cache: "no-store",
  });

  const location = res.headers.get("location");
  if (location && res.status >= 300 && res.status < 400) {
    return NextResponse.redirect(new URL(location, req.url), res.status as 301 | 302 | 303 | 307 | 308);
  }

  return new NextResponse(await res.text(), {
    status: res.status,
    headers: { "content-type": res.headers.get("content-type") ?? "text/plain" },
  });
}

export async function GET(req: NextRequest, ctx: { params: Promise<{ hash: string }> }) {
  const { hash } = await ctx.params;
  return proxyRedirect(req, hash);
}

export async function HEAD(req: NextRequest, ctx: { params: Promise<{ hash: string }> }) {
  const { hash } = await ctx.params;
  return proxyRedirect(req, hash);
}
