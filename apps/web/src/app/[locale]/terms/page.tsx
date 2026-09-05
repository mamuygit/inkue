import Container from "@mui/material/Container";
import Typography from "@mui/material/Typography";
import type { Metadata } from "next";
import { BRAND } from "@mamuy/shared";
import { publicPageMetadata } from "@/i18n/metadata";
import { getT, resolveLocale } from "@/i18n/server";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const locale = await resolveLocale(params);
  const { t } = await getT(locale);
  return publicPageMetadata("/terms", locale, {
    title: t("terms.title"),
    description: t("terms.description", { name: BRAND.name }),
  });
}

export default async function TermsPage({ params }: Props) {
  const locale = await resolveLocale(params);
  const { t } = await getT(locale);
  return (
    <Container maxWidth="md" sx={{ py: 8 }}>
      <Typography component="h1" variant="h3" fontWeight={800} sx={{ mb: 3 }}>
        {t("terms.title")}
      </Typography>
      <Typography paragraph>{t("terms.p1", { name: BRAND.name })}</Typography>
      <Typography paragraph>{t("terms.p2")}</Typography>
      <Typography paragraph>{t("terms.p3")}</Typography>
    </Container>
  );
}
