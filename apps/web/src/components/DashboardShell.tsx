"use client";

import DashboardOutlinedIcon from "@mui/icons-material/DashboardOutlined";
import FolderOutlinedIcon from "@mui/icons-material/FolderOutlined";
import LinkOutlinedIcon from "@mui/icons-material/LinkOutlined";
import QrCode2Icon from "@mui/icons-material/QrCode2";
import Box from "@mui/material/Box";
import Drawer from "@mui/material/Drawer";
import List from "@mui/material/List";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import ListSubheader from "@mui/material/ListSubheader";
import Toolbar from "@mui/material/Toolbar";
import Typography from "@mui/material/Typography";
import { usePathname } from "next/navigation";
import { useDashboardMenu } from "./DashboardMenuContext";
import { LangSwitch } from "./LangSwitch";
import { LocaleLink } from "./LocaleLink";
import { useI18n } from "@/i18n/LocaleProvider";
import { stripLocalePrefix } from "@/i18n/path";
import { alpha } from "@mui/material/styles";
import { COLORS } from "@mamuy/shared";

const DRAWER_WIDTH = 240;

const navItemSx = {
  mx: 1,
  mb: 0.75,
  borderRadius: 1.5,
  "&:hover": { bgcolor: "grey.50" },
  "&.Mui-selected": {
    bgcolor: alpha(COLORS.primary, 0.12),
    "&:hover": { bgcolor: alpha(COLORS.primary, 0.18) },
  },
};

function isDashboardHome(inner: string) {
  return inner === "/dashboard";
}

function isFoldersPage(inner: string) {
  return inner === "/dashboard/qr";
}

function isCreateQrPage(inner: string) {
  if (inner === "/dashboard/qr/create" || inner === "/dashboard/new") return true;
  if (inner === "/dashboard/qr" || inner === "/dashboard/account") return false;
  return /^\/dashboard\/[^/]+$/.test(inner);
}

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const { t } = useI18n();
  const pathname = usePathname();
  const inner = stripLocalePrefix(pathname);
  const menu = useDashboardMenu();
  const open = menu?.open ?? false;
  const setOpen = menu?.setOpen ?? (() => undefined);
  const dashboardActive = isDashboardHome(inner);
  const foldersActive = isFoldersPage(inner);
  const createActive = isCreateQrPage(inner);
  const versionLabel = t("menu.version", { version: process.env.NEXT_PUBLIC_APP_VERSION ?? "0.0.1" });

  const version = (
    <Typography variant="caption" color="text.secondary" sx={{ display: "block", px: 2, py: 1.5 }}>
      {versionLabel}
    </Typography>
  );

  const nav = (
    <Box sx={{ width: "100%" }} onClick={() => setOpen(false)}>
      <List disablePadding>
        <ListItemButton component={LocaleLink} href="/dashboard" selected={dashboardActive} sx={{ ...navItemSx, mt: 1 }}>
          <ListItemIcon sx={{ minWidth: 40 }}>
            <DashboardOutlinedIcon />
          </ListItemIcon>
          <ListItemText primary={t("menu.dashboard")} />
        </ListItemButton>
        <ListSubheader disableSticky sx={{ bgcolor: "transparent", lineHeight: 2.4, mt: 0.5 }}>
          {t("menu.qr")}
        </ListSubheader>
        <ListItemButton
          component={LocaleLink}
          href="/dashboard/qr"
          selected={foldersActive}
          sx={navItemSx}
        >
          <ListItemIcon sx={{ minWidth: 40 }}>
            <FolderOutlinedIcon />
          </ListItemIcon>
          <ListItemText primary={t("menu.folders")} secondary={t("menu.foldersHint")} />
        </ListItemButton>
        <ListItemButton
          component={LocaleLink}
          href="/dashboard/qr/create"
          selected={createActive}
          sx={navItemSx}
        >
          <ListItemIcon sx={{ minWidth: 40 }}>
            <LinkOutlinedIcon />
          </ListItemIcon>
          <ListItemText primary={t("menu.links")} secondary={t("menu.linksHint")} />
        </ListItemButton>
      </List>
    </Box>
  );

  return (
    <Box sx={{ display: "flex", alignItems: "stretch", flex: 1, minHeight: 0, width: "100%" }}>
      <Drawer
        variant="temporary"
        open={open}
        onClose={() => setOpen(false)}
        ModalProps={{ keepMounted: true }}
        sx={{
          display: { xs: "block", md: "none" },
          "& .MuiDrawer-paper": {
            width: DRAWER_WIDTH,
            boxSizing: "border-box",
            display: "flex",
            flexDirection: "column",
          },
        }}
      >
        <Toolbar>
          <QrCode2Icon color="primary" sx={{ mr: 1 }} />
          {t("menu.qr")}
        </Toolbar>
        {nav}
        <Box sx={{ px: 2, pb: 2, mt: "auto" }}>
          <LangSwitch />
          <Typography variant="caption" color="text.secondary" sx={{ display: "block", pt: 1.5 }}>
            {versionLabel}
          </Typography>
        </Box>
      </Drawer>
      <Drawer
        variant="permanent"
        sx={{
          display: { xs: "none", md: "block" },
          width: DRAWER_WIDTH,
          flexShrink: 0,
          height: "100%",
          "& .MuiDrawer-paper": {
            width: DRAWER_WIDTH,
            boxSizing: "border-box",
            position: "relative",
            height: "100%",
            overflowX: "hidden",
            overflowY: "auto",
            bgcolor: "background.paper",
            borderRight: "1px solid",
            borderColor: "divider",
            display: "flex",
            flexDirection: "column",
            zIndex: 0,
          },
        }}
        open
      >
        {nav}
        <Box sx={{ mt: "auto" }}>{version}</Box>
      </Drawer>
      <Box
        sx={{
          flex: 1,
          minWidth: 0,
          minHeight: 0,
          overflow: "auto",
          overscrollBehavior: "contain",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {children}
      </Box>
    </Box>
  );
}
