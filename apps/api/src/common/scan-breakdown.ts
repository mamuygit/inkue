export type BreakdownRow = { label: string; count: number };

export function normalizeReferrer(referer?: string | null) {
  if (!referer?.trim()) return "direct";
  try {
    const host = new URL(referer).hostname.replace(/^www\./, "");
    return host || "direct";
  } catch {
    return "direct";
  }
}

export function classifyDevice(userAgent?: string | null) {
  const ua = (userAgent ?? "").toLowerCase();
  if (!ua) return "unknown";
  if (/ipad|tablet|playbook|silk/.test(ua)) return "tablet";
  if (/mobile|iphone|ipod|android.*mobile|windows phone|blackberry/.test(ua)) return "mobile";
  if (/android/.test(ua)) return "tablet";
  return "desktop";
}

export function topCounts(values: string[], limit = 8): BreakdownRow[] {
  const map = new Map<string, number>();
  for (const value of values) map.set(value, (map.get(value) ?? 0) + 1);
  return [...map.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([label, count]) => ({ label, count }));
}

export function scanBreakdown(scans: { userAgent?: string | null; referer?: string | null }[]) {
  return {
    byReferrer: topCounts(scans.map((scan) => normalizeReferrer(scan.referer))),
    byDevice: topCounts(scans.map((scan) => classifyDevice(scan.userAgent))),
  };
}
