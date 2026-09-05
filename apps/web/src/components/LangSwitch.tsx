"use client";

import Box from "@mui/material/Box";
import NextLink from "next/link";
import { usePathname } from "next/navigation";
import { LOCALES, LOCALE_COOKIE, type Locale } from "@/i18n/config";
import { useI18n } from "@/i18n/LocaleProvider";
import { switchLocalePath } from "@/i18n/path";

function persistLocale(locale: Locale) {
  document.cookie = `${LOCALE_COOKIE}=${locale}; path=/; max-age=31536000; samesite=lax`;
}

export function LangSwitch() {
  const { locale, t } = useI18n();
  const pathname = usePathname() ?? "/";

  return (
    <Box
      role="group"
      aria-label={t("lang.label")}
      sx={{
        display: "inline-flex",
        alignItems: "center",
        p: "3px",
        borderRadius: 999,
        bgcolor: "#E2E8F0",
      }}
    >
      {LOCALES.map((item) => {
        const active = item === locale;
        return (
          <Box
            key={item}
            component={NextLink}
            href={switchLocalePath(pathname, item)}
            aria-current={active ? "true" : undefined}
            hrefLang={item}
            onClick={() => persistLocale(item)}
            sx={{
              appearance: "none",
              border: 0,
              cursor: "pointer",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              textDecoration: "none",
              minWidth: 40,
              height: 26,
              px: 1.25,
              borderRadius: 999,
              fontWeight: 800,
              fontSize: 12,
              letterSpacing: "0.04em",
              lineHeight: 1,
              bgcolor: active ? "primary.main" : "transparent",
              color: active ? "#fff" : "#334155",
              transition: "background-color 160ms ease, color 160ms ease",
              "&:hover": {
                bgcolor: active ? "primary.dark" : "rgba(255,255,255,0.7)",
              },
            }}
          >
            {item.toUpperCase()}
          </Box>
        );
      })}
    </Box>
  );
}
