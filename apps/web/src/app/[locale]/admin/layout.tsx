import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AdminShell } from "@/components/AdminShell";
import { getT, resolveLocale } from "@/i18n/server";
import { apiFetch } from "@/lib/api";
import { getOptionalSession } from "@/lib/auth";

type Props = { children: React.ReactNode; params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const locale = await resolveLocale(params);
  const { t } = await getT(locale);
  return {
    title: t("admin.title"),
    robots: { index: false, follow: false },
  };
}

export default async function AdminLayout({ children }: Props) {
  const session = await getOptionalSession();
  if (!session?.accessToken) notFound();
  try {
    const me = await apiFetch<{ isAdmin?: boolean }>("/auth/me", { token: session.accessToken });
    if (!me.isAdmin) notFound();
  } catch {
    notFound();
  }
  return <AdminShell>{children}</AdminShell>;
}
