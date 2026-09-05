import { BadRequestException } from "@nestjs/common";
import { bangkokDate } from "./util";

const MAX_DAYS = 366;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export function addCalendarDays(dateStr: string, days: number) {
  const [y, m, d] = dateStr.split("-").map(Number);
  const next = new Date(Date.UTC(y, m - 1, d + days));
  return `${next.getUTCFullYear()}-${String(next.getUTCMonth() + 1).padStart(2, "0")}-${String(next.getUTCDate()).padStart(2, "0")}`;
}

export function bangkokDayStartUtc(dateStr: string) {
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d, 0, 0, 0) - 7 * 60 * 60 * 1000);
}

export function eachCalendarDate(from: string, to: string) {
  const dates: string[] = [];
  for (let cur = from; cur <= to; cur = addCalendarDays(cur, 1)) dates.push(cur);
  return dates;
}

export function resolveDateRange(query: { from?: string; to?: string; days?: string | number }) {
  const today = bangkokDate();
  let from: string;
  let to: string;

  if (query.from || query.to) {
    from = query.from || query.to!;
    to = query.to || query.from!;
  } else {
    const days = Number(query.days ?? 14);
    if (!Number.isFinite(days) || days < 1) throw new BadRequestException("Invalid date range");
    const clamped = Math.min(Math.floor(days), MAX_DAYS);
    to = today;
    from = addCalendarDays(today, -(clamped - 1));
  }

  if (!DATE_RE.test(from) || !DATE_RE.test(to)) {
    throw new BadRequestException("Invalid date range");
  }
  if (from > to) throw new BadRequestException("Invalid date range");

  const span = (Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)) / 86400000 + 1;
  if (span > MAX_DAYS) from = addCalendarDays(to, -(MAX_DAYS - 1));

  return {
    from,
    to,
    start: bangkokDayStartUtc(from),
    endExclusive: bangkokDayStartUtc(addCalendarDays(to, 1)),
    dates: eachCalendarDate(from, to),
  };
}
