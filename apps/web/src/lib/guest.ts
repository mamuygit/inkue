import { GUEST_QR } from "@mamuy/shared";
import { apiFetch } from "./api";

export function getGuestToken() {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage.getItem(GUEST_QR.tokenStorageKey);
  } catch {
    return null;
  }
}

export function setGuestToken(token: string) {
  try {
    window.localStorage.setItem(GUEST_QR.tokenStorageKey, token);
  } catch {
    // Private mode without storage: the QR still works, it just can't be claimed later.
  }
}

function clearGuestToken() {
  try {
    window.localStorage.removeItem(GUEST_QR.tokenStorageKey);
  } catch {
    // ignore
  }
}

/** Moves QR codes made on the homepage before sign-in into the signed-in account. */
export async function claimGuestQrs(accessToken: string) {
  const guestToken = getGuestToken();
  if (!guestToken) return;
  try {
    await apiFetch("/qr/claim", {
      method: "POST",
      token: accessToken,
      body: JSON.stringify({ guestToken }),
    });
    clearGuestToken();
  } catch {
    // Keep the token so the next sign-in can retry.
  }
}
