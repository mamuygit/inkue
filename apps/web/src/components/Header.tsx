"use client";

import FavoriteBorderIcon from "@mui/icons-material/FavoriteBorder";
import MenuIcon from "@mui/icons-material/Menu";
import AppBar from "@mui/material/AppBar";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Container from "@mui/material/Container";
import IconButton from "@mui/material/IconButton";
import Skeleton from "@mui/material/Skeleton";
import Toolbar from "@mui/material/Toolbar";
import Typography from "@mui/material/Typography";
import { BRAND } from "@mamuy/shared";
import { useSession } from "next-auth/react";
import { usePathname } from "next/navigation";
import { BrandMark } from "./BrandMark";
import { useDashboardMenu } from "./DashboardMenuContext";
import { LangSwitch } from "./LangSwitch";
import { LocaleLink } from "./LocaleLink";
import { UserMenu } from "./UserMenu";
import { useI18n } from "@/i18n/LocaleProvider";
import { stripLocalePrefix } from "@/i18n/path";

function BrandLink({ size = 36 }: { size?: number }) {
  return (
    <Box
      component={LocaleLink}
      href="/"
      sx={{ display: "flex", alignItems: "center", gap: 1.25, textDecoration: "none", color: "inherit" }}
    >
      <BrandMark size={size} />
      <Typography fontWeight={800} color="text.primary">
        {BRAND.name}
      </Typography>
    </Box>
  );
}

export function Header() {
  const { data: session, status } = useSession();
  const { t } = useI18n();
  const menu = useDashboardMenu();
  const inApp = stripLocalePrefix(usePathname()).startsWith("/dashboard");
  const showHamburger = Boolean(inApp && menu);

  const toolbar = (
    <Toolbar disableGutters sx={{ position: "relative", minHeight: { xs: 64, sm: 72 } }}>
      <Box sx={{ display: "flex", alignItems: "center", zIndex: 1, minWidth: { xs: 40, sm: "auto" } }}>
        {showHamburger ? (
          <IconButton
            aria-label={t("menu.open")}
            onClick={() => menu?.setOpen(true)}
            sx={{ display: { xs: "inline-flex", md: "none" }, mr: { sm: 1 }, ml: inApp ? -0.5 : 0 }}
          >
            <MenuIcon />
          </IconButton>
        ) : null}
        <Box
          sx={{
            display: {
              xs: "none",
              sm: inApp ? "none" : "flex",
              md: "flex",
            },
          }}
        >
          <BrandLink />
        </Box>
      </Box>

      <Box
        sx={{
          display: inApp ? { xs: "flex", md: "none" } : { xs: "flex", sm: "none" },
          position: "absolute",
          left: "50%",
          transform: "translateX(-50%)",
        }}
      >
        <BrandLink size={32} />
      </Box>

      <Box sx={{ flex: 1 }} />

      <Box sx={{ display: "flex", alignItems: "center", gap: { xs: 0.5, sm: 1 }, zIndex: 1 }}>
        <Box
          sx={{
            display: { xs: "none", sm: "flex" },
            alignItems: "center",
            gap: { sm: 0.5, md: 1 },
          }}
        >
          <Button
            component="a"
            href={BRAND.donateUrl}
            target="_blank"
            rel="noopener noreferrer"
            color="inherit"
            startIcon={<FavoriteBorderIcon />}
          >
            {t("nav.donate")}
          </Button>
          <Box sx={{ mx: 0.5 }}>
            <LangSwitch />
          </Box>
        </Box>
        {status === "loading" ? (
          <Skeleton variant="circular" width={36} height={36} />
        ) : status === "authenticated" && session?.user?.email ? (
          <UserMenu email={session.user.email} />
        ) : (
          <Button component={LocaleLink} href="/login" variant="contained" size="small">
            {t("nav.signIn")}
          </Button>
        )}
      </Box>
    </Toolbar>
  );

  return (
    <AppBar
      position="sticky"
      color="inherit"
      elevation={0}
      sx={{ borderBottom: "1px solid", borderColor: "divider", bgcolor: "background.paper" }}
    >
      {inApp ? (
        <Box sx={{ px: { xs: 2, sm: 3 } }}>{toolbar}</Box>
      ) : (
        <Container maxWidth="lg">{toolbar}</Container>
      )}
    </AppBar>
  );
}
