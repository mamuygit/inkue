export const BRAND = {
  name: "Inkue",
  tagline: "Free QR Code Generator with Logo",
  domain: "qr.mamuy.dev",
  scanDomain: "q.mamuy.dev",
  donateUrl: "https://www.paypal.com/paypalme/mamuydev",
} as const;

export const COLORS = {
  primary: "#2563EB",
  primaryDark: "#1E3A8A",
  accent: "#38BDF8",
  ink: "#0B1F3A",
  paper: "#F4F8FF",
  hero: "#DBEAFE",
  success: "#059669",
  qrDefault: "#0B1F3A",
  qrBgDefault: "#FFFFFF",
  frameDefault: "#000000",
} as const;

/** Categorical palette for MUI X charts — stays in the Inkue family without neon cyan/pink. */
export const CHART = {
  scans: "#3B82F6",
  qr: "#0D9488",
  users: "#7C3AED",
  donate: "#EA580C",
  used: "#3B82F6",
  unused: "#94A3B8",
  signedIn: "#4F46E5",
  anonymous: "#A78BFA",
  bar: "#4F46E5",
} as const;

export const OTP = {
  length: 6,
  ttlMinutes: 10,
  maxSendPerDay: 5,
  maxVerifyFailPerDay: 5,
  resendCooldownSec: 60,
  maxEmailsPerIpPerDay: 10,
} as const;

export const PASSWORD_RESET = {
  ttlMinutes: 30,
  tokenBytes: 32,
} as const;

export const QR_HASH_LENGTH = 8;

export const LOGO_POSITIONS = [
  "center",
  "top_left",
  "top_right",
  "bottom_left",
  "bottom_right",
] as const;

export const FRAME_SHAPES = ["none", "circle", "rounded_square"] as const;

export const AVATAR_FRAMES = ["none", "tier2", "tier3", "tier4", "tier5"] as const;
export type AvatarFrame = (typeof AVATAR_FRAMES)[number];

export const AVATAR_FRAME_MIN_MONTHS: Record<AvatarFrame, number> = {
  none: 0,
  tier2: 3,
  tier3: 10,
  tier4: 12,
  tier5: 24,
};

/** Inner photo diameter as a fraction of the square overlay, matching punched PNG holes. */
export const AVATAR_FRAME_INNER_SCALE: Record<Exclude<AvatarFrame, "none">, number> = {
  tier2: 0.81,
  tier3: 0.8,
  tier4: 0.76,
  tier5: 0.72,
};

export function isAvatarFrame(value: unknown): value is AvatarFrame {
  return typeof value === "string" && (AVATAR_FRAMES as readonly string[]).includes(value);
}

export function parseAvatarFrame(value: unknown): AvatarFrame {
  return isAvatarFrame(value) ? value : "none";
}

export function accountAgeMonths(createdAt: Date | string, now = new Date()) {
  const start = createdAt instanceof Date ? createdAt : new Date(createdAt);
  if (Number.isNaN(start.getTime())) return 0;
  let months = (now.getFullYear() - start.getFullYear()) * 12 + (now.getMonth() - start.getMonth());
  if (now.getDate() < start.getDate()) months -= 1;
  return Math.max(0, months);
}

/** Internal accounts that can wear every frame regardless of age. */
export const AVATAR_FRAME_UNLOCK_ALL = new Set(["mamuy7@gmail.com"]);

export function unlocksAllAvatarFrames(email?: string | null) {
  return Boolean(email && AVATAR_FRAME_UNLOCK_ALL.has(email.trim().toLowerCase()));
}

export function isAvatarFrameUnlocked(
  frame: AvatarFrame,
  createdAt: Date | string,
  email?: string | null,
  now = new Date(),
) {
  if (unlocksAllAvatarFrames(email)) return true;
  return accountAgeMonths(createdAt, now) >= AVATAR_FRAME_MIN_MONTHS[frame];
}

export function effectiveAvatarFrame(
  frame: unknown,
  createdAt: Date | string,
  email?: string | null,
  now = new Date(),
): AvatarFrame {
  const parsed = parseAvatarFrame(frame);
  return isAvatarFrameUnlocked(parsed, createdAt, email, now) ? parsed : "none";
}

export function avatarFrameSrc(frame: AvatarFrame) {
  return frame === "none" ? null : `/frames/${frame}.svg?v=5`;
}

export const DISPOSABLE_EMAIL_DOMAINS = new Set([
  "mailinator.com",
  "guerrillamail.com",
  "guerrillamailblock.com",
  "sharklasers.com",
  "grr.la",
  "10minutemail.com",
  "10minutemail.net",
  "tempmail.com",
  "temp-mail.org",
  "throwawaymail.com",
  "yopmail.com",
  "trashmail.com",
  "getnada.com",
  "fakeinbox.com",
  "dispostable.com",
  "maildrop.cc",
  "moakt.com",
  "emailondeck.com",
]);
