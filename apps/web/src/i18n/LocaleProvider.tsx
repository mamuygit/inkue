"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { LOCALE_COOKIE, type Locale } from "./config";
import { switchLocalePath } from "./path";
import { createTranslator, getMessages, type Translator } from "./translate";

type I18nContextValue = {
  locale: Locale;
  t: Translator;
  setLocale: (next: Locale) => void;
};

const I18nContext = createContext<I18nContextValue | null>(null);

function persistLocale(locale: Locale) {
  document.cookie = `${LOCALE_COOKIE}=${locale}; path=/; max-age=31536000; samesite=lax`;
  document.documentElement.lang = locale;
  document.documentElement.dataset.locale = locale;
}

export function LocaleProvider({ locale, children }: { locale: Locale; children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [current, setCurrent] = useState<Locale>(locale);

  useEffect(() => {
    setCurrent(locale);
    document.documentElement.lang = locale;
    document.documentElement.dataset.locale = locale;
  }, [locale]);
  const messages = useMemo(() => getMessages(current), [current]);
  const t = useMemo(() => createTranslator(messages), [messages]);

  const setLocale = useCallback(
    (next: Locale) => {
      if (next === current) return;
      persistLocale(next);
      router.push(switchLocalePath(pathname, next));
    },
    [current, pathname, router],
  );

  const value = useMemo(() => ({ locale: current, t, setLocale }), [current, t, setLocale]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n must be used within LocaleProvider");
  return ctx;
}
