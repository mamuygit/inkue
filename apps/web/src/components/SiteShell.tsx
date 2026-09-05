"use client";

import Box from "@mui/material/Box";
import { usePathname } from "next/navigation";
import { DashboardMenuProvider } from "./DashboardMenuContext";
import { Footer } from "./Footer";
import { Header } from "./Header";
import { stripLocalePrefix } from "@/i18n/path";

export function SiteShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isApp = stripLocalePrefix(pathname).startsWith("/dashboard");

  return (
    <DashboardMenuProvider>
      <Box sx={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
        <Header />
        <Box component="main" sx={{ flex: 1 }}>
          {children}
        </Box>
        {isApp ? null : <Footer />}
      </Box>
    </DashboardMenuProvider>
  );
}
