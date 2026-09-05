import { createHash, timingSafeEqual } from "crypto";
import { Request } from "express";

export function bangkokDate(d = new Date()) {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Bangkok" }).format(d);
}

export function nextBangkokMidnight(from = new Date()) {
  const date = bangkokDate(from);
  const [y, m, day] = date.split("-").map(Number);
  // Bangkok midnight of the NEXT calendar day, as UTC
  const next = new Date(Date.UTC(y, m - 1, day + 1, 0, 0, 0) - 7 * 60 * 60 * 1000);
  if (next.getTime() <= from.getTime()) {
    return new Date(next.getTime() + 24 * 60 * 60 * 1000);
  }
  return next;
}

export function clientIp(req: Request) {
  const forwarded = req.headers["x-forwarded-for"];
  if (typeof forwarded === "string" && forwarded.length) {
    return forwarded.split(",")[0].trim();
  }
  return req.ip || req.socket?.remoteAddress || "0.0.0.0";
}

export function hashValue(value: string, pepper?: string) {
  return createHash("sha256")
    .update(`${pepper ?? ""}:${value}`)
    .digest("hex");
}

export function verifyHash(value: string, storedHash: string, pepper?: string) {
  const computed = hashValue(value, pepper);
  const left = Buffer.from(computed, "hex");
  const right = Buffer.from(storedHash, "hex");
  if (left.length === 0 || left.length !== right.length) return false;
  return timingSafeEqual(left, right);
}
