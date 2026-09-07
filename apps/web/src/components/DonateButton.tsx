"use client";

import FavoriteBorderIcon from "@mui/icons-material/FavoriteBorder";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import { BRAND } from "@mamuy/shared";
import { useSession } from "next-auth/react";
import { usePathname } from "next/navigation";
import { apiFetch } from "@/lib/api";
import { useI18n } from "@/i18n/LocaleProvider";
import { stripLocalePrefix } from "@/i18n/path";

export function DonateButton({ variant = "header" }: { variant?: "header" | "footer" }) {
  const { t } = useI18n();
  const { data: session } = useSession();
  const pathname = usePathname();

  async function onDonate() {
    try {
      await apiFetch("/donate/click", {
        method: "POST",
        token: session?.accessToken,
        body: JSON.stringify({ path: stripLocalePrefix(pathname) }),
      });
    } catch {
      /* still open PayPal */
    }
    window.open(BRAND.donateUrl, "_blank", "noopener,noreferrer");
  }

  if (variant === "footer") {
    return (
      <Chip
        clickable
        onClick={onDonate}
        icon={<FavoriteBorderIcon />}
        label={t("nav.donate")}
        sx={{
          height: 36,
          px: 0.5,
          fontWeight: 700,
          color: "#fff",
          bgcolor: "primary.main",
          "& .MuiChip-icon": { color: "#fff" },
          "&:hover": { bgcolor: "primary.dark" },
        }}
      />
    );
  }

  return (
    <Button color="inherit" startIcon={<FavoriteBorderIcon />} onClick={onDonate}>
      {t("nav.donate")}
    </Button>
  );
}
