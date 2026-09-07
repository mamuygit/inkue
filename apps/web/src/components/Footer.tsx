"use client";

import Box from "@mui/material/Box";
import Container from "@mui/material/Container";
import Link from "@mui/material/Link";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { BRAND } from "@mamuy/shared";
import { BrandMark } from "./BrandMark";
import { DonateButton } from "./DonateButton";
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
            <DonateButton variant="footer" />
          </Stack>
        </Stack>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
          © {new Date().getFullYear()} {BRAND.name} · {t("footer.copy")} · {BRAND.domain}
        </Typography>
      </Container>
    </Box>
  );
}
