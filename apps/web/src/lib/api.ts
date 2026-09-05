export function getApiUrl() {
  const configured = process.env.NEXT_PUBLIC_API_URL ?? "/api/v1";
  const trimmed = configured.replace(/\/$/, "");
  if (trimmed.startsWith("http")) return trimmed;
  if (typeof window === "undefined") {
    const origin = (process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000").replace(/\/$/, "");
    return `${origin}${trimmed.startsWith("/") ? trimmed : `/${trimmed}`}`;
  }
  return trimmed;
}

export class ApiError extends Error {
  status: number;
  code?: string;
  unlockAt?: string;
  retryAfterSec?: number;

  constructor(body: { message?: string; code?: string; unlockAt?: string; retryAfterSec?: number }, status: number) {
    super(body.message ?? "Something went wrong");
    this.status = status;
    this.code = body.code;
    this.unlockAt = body.unlockAt;
    this.retryAfterSec = body.retryAfterSec;
  }
}

export async function apiFetch<T>(
  path: string,
  options: RequestInit & { token?: string } = {},
): Promise<T> {
  const { token, headers, ...init } = options;
  const isForm = typeof FormData !== "undefined" && init.body instanceof FormData;
  const res = await fetch(`${getApiUrl()}${path}`, {
    ...init,
    headers: {
      ...(isForm ? {} : { "Content-Type": "application/json" }),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers,
    },
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({ message: res.statusText }));
    throw new ApiError(body, res.status);
  }
  const contentType = res.headers.get("content-type") ?? "";
  if (contentType.includes("image/") || contentType.includes("octet-stream")) {
    return (await res.blob()) as T;
  }
  return res.json();
}
