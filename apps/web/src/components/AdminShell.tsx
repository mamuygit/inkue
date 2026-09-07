"use client";

import AdminPanelSettingsOutlinedIcon from "@mui/icons-material/AdminPanelSettingsOutlined";
import FavoriteBorderIcon from "@mui/icons-material/FavoriteBorder";
import GroupOutlinedIcon from "@mui/icons-material/GroupOutlined";
import QrCode2Icon from "@mui/icons-material/QrCode2";
import Box from "@mui/material/Box";
import Drawer from "@mui/material/Drawer";
import List from "@mui/material/List";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import Toolbar from "@mui/material/Toolbar";
import Typography from "@mui/material/Typography";
import { usePathname } from "next/navigation";
import { useDashboardMenu } from "./DashboardMenuContext";
import { LangSwitch } from "./LangSwitch";
import { LocaleLink } from "./LocaleLink";
import { useI18n } from "@/i18n/LocaleProvider";
import { stripLocalePrefix } from "@/i18n/path";

const DRAWER_WIDTH = 240;

export function AdminShell({ children }: { children: React.ReactNode }) {
  const { t } = useI18n();
  const pathname = usePathname();
  const inner = stripLocalePrefix(pathname);
  const menu = useDashboardMenu();
  const open = menu?.open ?? false;
  const setOpen = menu?.setOpen ?? (() => undefined);
  const versionLabel = t("menu.version", { version: process.env.NEXT_PUBLIC_APP_VERSION ?? "0.0.1" });

  const overviewActive = inner === "/admin";
  const usersActive = inner.startsWith("/admin/users");
  const qrActive = inner.startsWith("/admin/qr");
  const donateActive = inner.startsWith("/admin/donates");

  const version = (
    <Typography variant="caption" color="text.secondary" sx={{ display: "block", px: 2, py: 1.5 }}>
      {versionLabel}
    </Typography>
  );

  const nav = (
    <Box sx={{ width: DRAWER_WIDTH }} onClick={() => setOpen(false)}>
      <List disablePadding>
        <ListItemButton component={LocaleLink} href="/admin" selected={overviewActive} sx={{ mx: 1, mt: 1, borderRadius: 1 }}>
          <ListItemIcon sx={{ minWidth: 40 }}>
            <AdminPanelSettingsOutlinedIcon />
          </ListItemIcon>
          <ListItemText primary={t("admin.overview")} />
        </ListItemButton>
        <ListItemButton component={LocaleLink} href="/admin/users" selected={usersActive} sx={{ mx: 1, borderRadius: 1 }}>
          <ListItemIcon sx={{ minWidth: 40 }}>
            <GroupOutlinedIcon />
          </ListItemIcon>
          <ListItemText primary={t("admin.users")} />
        </ListItemButton>
        <ListItemButton component={LocaleLink} href="/admin/qr" selected={qrActive} sx={{ mx: 1, borderRadius: 1 }}>
          <ListItemIcon sx={{ minWidth: 40 }}>
            <QrCode2Icon />
          </ListItemIcon>
          <ListItemText primary={t("admin.allQr")} />
        </ListItemButton>
        <ListItemButton
          component={LocaleLink}
          href="/admin/donates"
          selected={donateActive}
          sx={{ mx: 1, mb: 1, borderRadius: 1 }}
        >
          <ListItemIcon sx={{ minWidth: 40 }}>
            <FavoriteBorderIcon />
          </ListItemIcon>
          <ListItemText primary={t("admin.donates")} />
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
          <AdminPanelSettingsOutlinedIcon color="primary" sx={{ mr: 1 }} />
          {t("admin.title")}
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
          "& .MuiDrawer-paper": {
            width: DRAWER_WIDTH,
            boxSizing: "border-box",
            position: "relative",
            height: "100%",
            borderRight: "1px solid",
            borderColor: "divider",
            display: "flex",
            flexDirection: "column",
          },
        }}
        open
      >
        {nav}
        <Box sx={{ mt: "auto" }}>{version}</Box>
      </Drawer>
      <Box sx={{ flex: 1, minWidth: 0 }}>{children}</Box>
    </Box>
  );
}
