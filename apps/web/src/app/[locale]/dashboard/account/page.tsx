import type { Metadata } from "next";
import { AccountClient } from "./AccountClient";
import { getT, resolveLocale } from "@/i18n/server";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const locale = await resolveLocale(params);
  const { t } = await getT(locale);
  return {
    title: t("account.title"),
    robots: { index: false, follow: false },
  };
}

export default function AccountPage() {
  return <AccountClient />;
}
