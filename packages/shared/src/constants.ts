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
