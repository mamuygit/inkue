import { cookies, headers } from "next/headers";
import { notFound } from "next/navigation";
import { DEFAULT_LOCALE, isLocale, LOCALE_COOKIE, LOCALE_HEADER, type Locale } from "./config";
import { createTranslator, getMessages, type Translator } from "./translate";

export async function getRequestLocale(): Promise<Locale> {
  const headerLocale = (await headers()).get(LOCALE_HEADER);
  if (isLocale(headerLocale)) return headerLocale;
  const cookieLocale = (await cookies()).get(LOCALE_COOKIE)?.value;
  if (isLocale(cookieLocale)) return cookieLocale;
  return DEFAULT_LOCALE;
}

export async function resolveLocale(params: Promise<{ locale: string }>): Promise<Locale> {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  return locale;
}

export async function getT(localeOverride?: Locale): Promise<{ locale: Locale; t: Translator }> {
  const locale = localeOverride ?? (await getRequestLocale());
  return { locale, t: createTranslator(getMessages(locale)) };
}
