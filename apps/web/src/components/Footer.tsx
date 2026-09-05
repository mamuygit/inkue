"use client";

import FavoriteBorderIcon from "@mui/icons-material/FavoriteBorder";
import Box from "@mui/material/Box";
import Chip from "@mui/material/Chip";
import Container from "@mui/material/Container";
import Link from "@mui/material/Link";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { BRAND } from "@mamuy/shared";
import { BrandMark } from "./BrandMark";
import { LangSwitch } from "./LangSwitch";
import { LocaleLink } from "./LocaleLink";
import { useI18n } from "@/i18n/LocaleProvider";

export function Footer() {
  const { t } = useI18n();

  return (
    <Box component="footer" sx={{ borderTop: "1px solid", borderColor: "divider", py: 5, mt: 8 }}>
      <Container maxWidth="lg">
        <Stack direction={{ xs: "column", sm: "row" }} spacing={2} justifyContent="space-between" alignItems="center">
          <Stack direction="row" spacing={1.25} alignItems="center">
            <BrandMark size={28} />
            <Typography fontWeight={700}>{BRAND.name}</Typography>
          </Stack>
          <Stack direction="row" spacing={3} alignItems="center" flexWrap="wrap" useFlexGap>
            <LangSwitch />
            <Link component={LocaleLink} href="/privacy" underline="hover" color="text.secondary">
              {t("nav.privacy")}
            </Link>
            <Link component={LocaleLink} href="/terms" underline="hover" color="text.secondary">
              {t("nav.terms")}
            </Link>
            <Chip
              component="a"
              href={BRAND.donateUrl}
              target="_blank"
              rel="noopener noreferrer"
              clickable
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
          </Stack>
        </Stack>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
          © {new Date().getFullYear()} {BRAND.name} · {t("footer.copy")} · {BRAND.domain}
        </Typography>
      </Container>
    </Box>
  );
}
