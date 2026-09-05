import type { ApiError } from "@/lib/api";
import type { MessageKey, Translator } from "./translate";

const MESSAGE_MAP: Record<string, MessageKey> = {
  "Please enter a valid email": "validation.email",
  "OTP must be 6 digits": "validation.otp",
  "Password must be at least 8 characters": "validation.password",
  "Password is too long": "validation.passwordLong",
  "Please enter your password": "validation.passwordRequired",
  "Please confirm your password": "validation.confirmPassword",
  "Passwords do not match": "validation.passwordMismatch",
  "Color must be a hex code like #2563EB": "validation.hex",
  "Please enter a destination URL": "validation.destinationRequired",
  "Invalid destination URL": "validation.destinationInvalid",
  "Title is too long": "validation.titleTooLong",
  "Folder name is required": "validation.folderNameRequired",
  "Folder name is too long": "validation.folderNameTooLong",
  "Folder not found": "errors.folderNotFound",
  "Folder name already exists": "errors.folderNameExists",
  "Invalid date range": "errors.invalidDateRange",
  "Invalid or expired reset link": "errors.resetInvalid",
  "Something went wrong": "errors.generic",
  "Disposable email addresses aren't supported. Please use a real email.": "errors.otpDisposable",
  "You've used all 5 codes for today. Try again tomorrow.": "errors.otpDailyLimit",
  "Too many code requests from this network. Try again tomorrow.": "errors.otpIpLimit",
  "Too many failed attempts today. Try again tomorrow.": "errors.otpVerifyLimit",
  "Invalid or expired OTP": "errors.otpInvalid",
  "An account with this email already exists": "errors.emailTaken",
  "Invalid email or password": "errors.invalidCredentials",
  "Please verify your email first": "errors.emailUnverified",
  "Please choose a logo file": "errors.logoRequired",
  "Only PNG, JPG, WEBP, and SVG are supported": "errors.logoType",
  "File must be 2MB or smaller": "errors.logoSize",
  "Couldn't create a QR code. Please try again.": "errors.qrCreateFailed",
  "Uploaded logo not found": "errors.logoMissing",
  "Couldn't read that logo. Try a PNG or JPG instead.": "errors.logoUnreadable",
  "QR not found": "errors.qrNotFound",
  "Link not found": "errors.linkNotFound",
  "Invalid data": "errors.invalidData",
};

const CODE_MAP: Record<string, MessageKey> = {
  OTP_DAILY_LIMIT: "errors.otpDailyLimit",
  OTP_IP_LIMIT: "errors.otpIpLimit",
  OTP_COOLDOWN: "errors.otpCooldown",
  OTP_VERIFY_LIMIT: "errors.otpVerifyLimit",
  EMAIL_TAKEN: "errors.emailTaken",
  INVALID_CREDENTIALS: "errors.invalidCredentials",
  EMAIL_UNVERIFIED: "errors.emailUnverified",
};

export function translateMessage(t: Translator, message?: string) {
  if (!message) return undefined;
  const key = MESSAGE_MAP[message];
  return key ? t(key) : message;
}

export function translateApiError(t: Translator, err: ApiError) {
  if (err.code === "OTP_COOLDOWN") {
    return t("errors.otpCooldown", { seconds: err.retryAfterSec ?? 0 });
  }
  if (err.code && CODE_MAP[err.code]) {
    return t(CODE_MAP[err.code]);
  }
  const wait = err.message.match(/^Wait (\d+) seconds/);
  if (wait) return t("errors.otpCooldown", { seconds: wait[1] });
  return translateMessage(t, err.message);
}
