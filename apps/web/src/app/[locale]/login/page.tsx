import type { Metadata } from "next";
import { BRAND } from "@mamuy/shared";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { LoginClient } from "./LoginClient";
import { publicPageMetadata } from "@/i18n/metadata";
import { localizedPath } from "@/i18n/path";
import { getT, resolveLocale } from "@/i18n/server";
import { authOptions } from "@/lib/auth";
import { safeCallbackUrl } from "@/lib/callback-url";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ callbackUrl?: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const locale = await resolveLocale(params);
  const { t } = await getT(locale);
  return {
    ...publicPageMetadata("/login", locale, {
      title: t("login.title"),
      description: t("login.description", { name: BRAND.name }),
    }),
    robots: { index: false, follow: true },
  };
}

export default async function LoginPage({ params, searchParams }: Props) {
  const locale = await resolveLocale(params);
  const { callbackUrl } = await searchParams;
  const session = await getServerSession(authOptions);
  if (session) {
    redirect(safeCallbackUrl(callbackUrl, localizedPath("/dashboard", locale)));
  }
  return <LoginClient callbackUrl={callbackUrl} />;
}
