import { signIn } from "next-auth/react";

export async function signInWithAccessToken(accessToken: string) {
  const result = await signIn("credentials", {
    accessToken,
    redirect: false,
  });
  if (!result?.ok) throw new Error("session");
}
