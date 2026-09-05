import type { Metadata } from "next";
import { BRAND } from "@mamuy/shared";
import { LoginClient } from "./LoginClient";
import { publicPageMetadata } from "@/i18n/metadata";
import { getT, resolveLocale } from "@/i18n/server";

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

export default async function LoginPage({ searchParams }: Props) {
  const { callbackUrl } = await searchParams;
  return <LoginClient callbackUrl={callbackUrl} />;
}
