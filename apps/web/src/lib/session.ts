import { signIn } from "next-auth/react";
import { claimGuestQrs } from "./guest";

export async function signInWithAccessToken(accessToken: string) {
  const result = await signIn("credentials", {
    accessToken,
    redirect: false,
  });
  if (!result?.ok) throw new Error("session");
  await claimGuestQrs(accessToken);
}

export function navigateAfterAuth(url: string) {
  window.location.assign(url);
}
