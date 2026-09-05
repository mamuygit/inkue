import type { Metadata } from "next";
import { BRAND } from "@mamuy/shared";
import { ForgotPasswordClient } from "./ForgotPasswordClient";
import { publicPageMetadata } from "@/i18n/metadata";
import { getT, resolveLocale } from "@/i18n/server";

type Props = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ email?: string; token?: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const locale = await resolveLocale(params);
  const { t } = await getT(locale);
  return publicPageMetadata("/forgot-password", locale, {
    title: t("forgot.title"),
    description: t("forgot.description", { name: BRAND.name }),
  });
}

export default async function ForgotPasswordPage({ searchParams }: Props) {
  const { email, token } = await searchParams;
  return <ForgotPasswordClient email={email} token={token} />;
}
