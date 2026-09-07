export function superadminEmail() {
  return (process.env.SUPERADMIN_EMAIL ?? "").trim().toLowerCase();
}

export function superadminPassword() {
  return (process.env.SUPERADMIN_PASSWORD ?? "").trim().replace(/^["']|["']$/g, "");
}

export function isSuperadminEmail(email?: string | null) {
  const admin = superadminEmail();
  if (!admin || !email) return false;
  return email.trim().toLowerCase() === admin;
}
