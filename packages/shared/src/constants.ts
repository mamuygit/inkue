export const BRAND = {
  name: "Inkue",
  tagline: "Free QR codes with logos — change the link anytime",
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
