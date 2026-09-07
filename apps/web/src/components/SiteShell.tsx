"use client";

import Box from "@mui/material/Box";
import { usePathname } from "next/navigation";
import { DashboardMenuProvider } from "./DashboardMenuContext";
import { Footer } from "./Footer";
import { Header } from "./Header";
import { stripLocalePrefix } from "@/i18n/path";

export function SiteShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const inner = stripLocalePrefix(pathname);
  const isApp = inner.startsWith("/dashboard") || inner.startsWith("/admin");

  return (
    <DashboardMenuProvider>
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          ...(isApp
            ? { height: "100dvh", maxHeight: "100dvh", overflow: "hidden" }
            : { minHeight: "100vh" }),
        }}
      >
        <Header />
        <Box
          component="main"
          sx={{
            flex: 1,
            ...(isApp ? { minHeight: 0, display: "flex", flexDirection: "column", overflow: "hidden" } : {}),
          }}
        >
          {children}
        </Box>
        {isApp ? null : <Footer />}
      </Box>
    </DashboardMenuProvider>
  );
}
