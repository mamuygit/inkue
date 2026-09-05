import { redirect } from "next/navigation";
import { resolveLocale } from "@/i18n/server";
import { localizedPath } from "@/i18n/path";

type Props = { params: Promise<{ locale: string }> };

export default async function NewQrRedirect({ params }: Props) {
  const locale = await resolveLocale(params);
  redirect(localizedPath("/dashboard/qr/create", locale));
}
