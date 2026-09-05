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
import { usePathname } from "next/navigation";
import { useDashboardMenu } from "./DashboardMenuContext";
import { LangSwitch } from "./LangSwitch";
import { LocaleLink } from "./LocaleLink";
import { useI18n } from "@/i18n/LocaleProvider";
import { stripLocalePrefix } from "@/i18n/path";

const DRAWER_WIDTH = 240;

function isDashboardHome(inner: string) {
  return inner === "/dashboard";
}

function isFoldersPage(inner: string) {
  return inner === "/dashboard/qr";
}

function isCreateQrPage(inner: string) {
  if (inner === "/dashboard/qr/create" || inner === "/dashboard/new") return true;
  return /^\/dashboard\/[^/]+$/.test(inner) && inner !== "/dashboard/qr";
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

  const nav = (
    <Box sx={{ width: DRAWER_WIDTH }} onClick={() => setOpen(false)}>
      <List disablePadding>
        <ListItemButton component={LocaleLink} href="/dashboard" selected={dashboardActive} sx={{ mx: 1, mt: 1, borderRadius: 1 }}>
          <ListItemIcon sx={{ minWidth: 40 }}>
            <DashboardOutlinedIcon />
          </ListItemIcon>
          <ListItemText primary={t("menu.dashboard")} />
        </ListItemButton>
        <ListSubheader disableSticky sx={{ bgcolor: "transparent", lineHeight: 2.4, mt: 1 }}>
          {t("menu.qr")}
        </ListSubheader>
        <ListItemButton
          component={LocaleLink}
          href="/dashboard/qr"
          selected={foldersActive}
          sx={{ mx: 1, borderRadius: 1 }}
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
          sx={{ mx: 1, mb: 1, borderRadius: 1 }}
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
    <Box sx={{ display: "flex", alignItems: "stretch", minHeight: { md: "calc(100vh - 73px)" } }}>
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
        </Box>
      </Drawer>
      <Drawer
        variant="permanent"
        sx={{
          display: { xs: "none", md: "block" },
          width: DRAWER_WIDTH,
          flexShrink: 0,
          "& .MuiDrawer-paper": {
            width: DRAWER_WIDTH,
            boxSizing: "border-box",
            position: "relative",
            borderRight: "1px solid",
            borderColor: "divider",
          },
        }}
        open
      >
        {nav}
      </Drawer>
      <Box sx={{ flex: 1, minWidth: 0 }}>{children}</Box>
    </Box>
  );
}
