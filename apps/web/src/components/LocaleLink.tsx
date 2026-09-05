"use client";

import NextLink from "next/link";
import { forwardRef, type ComponentProps } from "react";
import { localizedPath } from "@/i18n/path";
import { useI18n } from "@/i18n/LocaleProvider";

type Props = Omit<ComponentProps<typeof NextLink>, "href"> & { href: string };

export const LocaleLink = forwardRef<HTMLAnchorElement, Props>(function LocaleLink({ href, ...props }, ref) {
  const { locale } = useI18n();
  return <NextLink ref={ref} href={localizedPath(href, locale)} {...props} />;
});
