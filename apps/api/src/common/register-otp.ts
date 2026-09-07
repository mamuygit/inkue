export function isRegisterOtpEnabled() {
  const raw = (process.env.REGISTER_OTP_ENABLED ?? "").trim().toLowerCase();
  return raw === "true" || raw === "1" || raw === "yes";
}
