export const RANGE_PRESETS = [7, 14, 30, 90] as const;
export type RangePreset = (typeof RANGE_PRESETS)[number] | "custom";

export function bangkokToday() {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Bangkok" }).format(new Date());
}

export function addCalendarDays(dateStr: string, days: number) {
  const [y, m, d] = dateStr.split("-").map(Number);
  const next = new Date(Date.UTC(y, m - 1, d + days));
  return `${next.getUTCFullYear()}-${String(next.getUTCMonth() + 1).padStart(2, "0")}-${String(next.getUTCDate()).padStart(2, "0")}`;
}

export function rangeFromPreset(days: number) {
  const to = bangkokToday();
  return { from: addCalendarDays(to, -(days - 1)), to };
}

export function statsQuery(from: string, to: string) {
  return `from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`;
}

export function matchingPreset(from: string, to: string): RangePreset {
  const today = bangkokToday();
  if (to !== today) return "custom";
  for (const days of RANGE_PRESETS) {
    if (from === addCalendarDays(today, -(days - 1))) return days;
  }
  return "custom";
}
