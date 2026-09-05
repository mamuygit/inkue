import type { Metadata } from "next";
import { DashboardShell } from "@/components/DashboardShell";
import { getT, resolveLocale } from "@/i18n/server";

type Props = { children: React.ReactNode; params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const locale = await resolveLocale(params);
  const { t } = await getT(locale);
  return {
    title: t("dashboard.title"),
    robots: { index: false, follow: false },
  };
}

export default function DashboardLayout({ children }: Props) {
  return <DashboardShell>{children}</DashboardShell>;
}
