"use client";

import AdminPanelSettingsOutlinedIcon from "@mui/icons-material/AdminPanelSettingsOutlined";
import DashboardOutlinedIcon from "@mui/icons-material/DashboardOutlined";
import LogoutOutlinedIcon from "@mui/icons-material/LogoutOutlined";
import QrCode2Icon from "@mui/icons-material/QrCode2";
import Avatar from "@mui/material/Avatar";
import Box from "@mui/material/Box";
import Divider from "@mui/material/Divider";
import IconButton from "@mui/material/IconButton";
import ListItemIcon from "@mui/material/ListItemIcon";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import Typography from "@mui/material/Typography";
import { useQuery } from "@tanstack/react-query";
import { signOut, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useI18n } from "@/i18n/LocaleProvider";
import { localizedPath } from "@/i18n/path";
import { apiFetch } from "@/lib/api";

function initialFromEmail(email: string) {
  const letter = email.trim().charAt(0);
  return letter ? letter.toUpperCase() : "?";
}

export function UserMenu({ email }: { email: string }) {
  const { t, locale } = useI18n();
  const router = useRouter();
  const { data: session } = useSession();
  const [anchor, setAnchor] = useState<HTMLElement | null>(null);
  const open = Boolean(anchor);
  const me = useQuery({
    queryKey: ["auth-me"],
    enabled: Boolean(session?.accessToken),
    queryFn: () => apiFetch<{ isAdmin: boolean }>("/auth/me", { token: session?.accessToken }),
    staleTime: 60_000,
  });

  function go(path: string) {
    setAnchor(null);
    router.push(localizedPath(path, locale));
  }

  return (
    <>
      <IconButton
        onClick={(event) => setAnchor(event.currentTarget)}
        aria-label={t("nav.account")}
        aria-haspopup="menu"
        aria-expanded={open ? "true" : undefined}
        size="small"
        sx={{ ml: 0.5 }}
      >
        <Avatar
          sx={{
            width: 36,
            height: 36,
            bgcolor: "primary.main",
            fontSize: 15,
            fontWeight: 800,
          }}
        >
          {initialFromEmail(email)}
        </Avatar>
      </IconButton>
      <Menu
        anchorEl={anchor}
        open={open}
        onClose={() => setAnchor(null)}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        transformOrigin={{ vertical: "top", horizontal: "right" }}
        slotProps={{
          paper: {
            elevation: 0,
            variant: "outlined",
            sx: { mt: 1, minWidth: 220, borderRadius: 2 },
          },
        }}
      >
        <Box sx={{ px: 2, py: 1.25, maxWidth: 260 }}>
          <Typography variant="caption" color="text.secondary">
            {t("nav.account")}
          </Typography>
          <Typography variant="body2" fontWeight={700} noWrap>
            {email}
          </Typography>
        </Box>
        <Divider />
        <MenuItem onClick={() => go("/dashboard")}>
          <ListItemIcon>
            <DashboardOutlinedIcon fontSize="small" />
          </ListItemIcon>
          {t("nav.dashboard")}
        </MenuItem>
        <MenuItem onClick={() => go("/dashboard/qr")}>
          <ListItemIcon>
            <QrCode2Icon fontSize="small" />
          </ListItemIcon>
          {t("menu.manageQr")}
        </MenuItem>
        {me.data?.isAdmin ? (
          <MenuItem onClick={() => go("/admin")}>
            <ListItemIcon>
              <AdminPanelSettingsOutlinedIcon fontSize="small" />
            </ListItemIcon>
            {t("nav.adminPanel")}
          </MenuItem>
        ) : null}
        <Divider />
        <MenuItem onClick={() => signOut({ callbackUrl: localizedPath("/", locale) })}>
          <ListItemIcon>
            <LogoutOutlinedIcon fontSize="small" />
          </ListItemIcon>
          {t("nav.signOut")}
        </MenuItem>
      </Menu>
    </>
  );
}
