"use client";

import { AppRouterCacheProvider } from "@mui/material-nextjs/v15-appRouter";
import CssBaseline from "@mui/material/CssBaseline";
import { ThemeProvider } from "@mui/material/styles";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { Session } from "next-auth";
import { SessionProvider } from "next-auth/react";
import { useMemo, useState } from "react";
import type { Locale } from "@/i18n/config";
import { LocaleProvider, useI18n } from "@/i18n/LocaleProvider";
import { createAppTheme } from "@/theme/theme";

function ThemedApp({ children }: { children: React.ReactNode }) {
  const { locale } = useI18n();
  const theme = useMemo(() => createAppTheme(locale), [locale]);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      {children}
    </ThemeProvider>
  );
}

export function Providers({
  locale,
  session,
  children,
}: {
  locale: Locale;
  session: Session | null;
  children: React.ReactNode;
}) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: { queries: { refetchOnWindowFocus: false, retry: 1 } },
      }),
  );

  return (
    <SessionProvider session={session} refetchOnWindowFocus={false} refetchWhenOffline={false}>
      <LocaleProvider locale={locale}>
        <AppRouterCacheProvider>
          <ThemedApp>
            <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
          </ThemedApp>
        </AppRouterCacheProvider>
      </LocaleProvider>
    </SessionProvider>
  );
}
