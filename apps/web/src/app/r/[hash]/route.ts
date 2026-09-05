import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function apiBase() {
  const fromEnv = process.env.API_INTERNAL_URL?.replace(/\/$/, "");
  if (fromEnv) return fromEnv;
  const port = process.env.API_PORT ?? "4001";
  return `http://localhost:${port}`;
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
  const target = `${apiBase()}/r/${encodeURIComponent(hash)}`;
  let res: Response;
  try {
    res = await fetch(target, {
      method: "GET",
      headers: forwardHeaders(req),
      redirect: "manual",
      cache: "no-store",
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "API unreachable";
    console.error(`[redirect] failed to reach ${target}: ${message}`);
    return new NextResponse("Redirect service unavailable", { status: 502 });
  }

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
