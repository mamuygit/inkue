import type { Metadata } from "next";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Container from "@mui/material/Container";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { BRAND, COLORS } from "@mamuy/shared";
import { FeatureFrames } from "@/components/FeatureFrames";
import { LocaleLink } from "@/components/LocaleLink";
import { Odometer, OdometerCaption } from "@/components/Odometer";
import { getApiUrl } from "@/lib/api";
import { publicPageMetadata } from "@/i18n/metadata";
import { getT, resolveLocale } from "@/i18n/server";

async function getTotalQr() {
  try {
    const res = await fetch(`${getApiUrl()}/stats/public`, { next: { revalidate: 30 } });
    if (!res.ok) return 0;
    const data = (await res.json()) as { totalQr: number };
    return data.totalQr ?? 0;
  } catch {
    return 0;
  }
}

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const locale = await resolveLocale(params);
  const { t } = await getT(locale);
  const title = `${BRAND.name} | ${t("brand.tagline")}`;
  return {
    ...publicPageMetadata("/", locale, {
      title: t("brand.ogTitle"),
      description: t("brand.ogDescription"),
    }),
    title: { absolute: title },
    description: t("brand.description", { name: BRAND.name }),
  };
}

export default async function HomePage({ params }: Props) {
  const locale = await resolveLocale(params);
  const totalQr = await getTotalQr();
  const { t } = await getT(locale);

  return (
    <>
      <Box
        sx={{
          background: `linear-gradient(180deg, ${COLORS.hero} 0%, ${COLORS.paper} 42%)`,
          py: { xs: 8, md: 12 },
        }}
      >
        <Container maxWidth="md">
          <Typography component="h1" variant="h2" textAlign="center" sx={{ fontSize: { xs: 36, md: 56 } }}>
            {t("home.headline")}
          </Typography>
          <Typography textAlign="center" sx={{ mt: 2, fontSize: { xs: 18, md: 20 }, fontWeight: 600, color: "text.primary" }}>
            {t("home.aioSummary")}
          </Typography>
          <Typography textAlign="center" color="text.secondary" sx={{ mt: 2, fontSize: 18 }}>
            {t("home.subtitle", { domain: BRAND.scanDomain })}
          </Typography>
          <Stack direction={{ xs: "column", sm: "row" }} spacing={2} justifyContent="center" sx={{ mt: 4 }}>
            <Button component={LocaleLink} href="/dashboard/qr/create" prefetch={false} variant="contained" size="large">
              {t("home.ctaCreate")}
            </Button>
            <Button
              component={LocaleLink}
              href="/faq"
              variant="outlined"
              size="large"
              sx={{ color: "primary.dark", borderColor: "currentColor" }}
            >
              {t("home.ctaHow")}
            </Button>
          </Stack>
        </Container>
      </Box>

      <Container maxWidth="md" sx={{ py: 6 }}>
        <Typography component="h2" variant="h5" textAlign="center" fontWeight={800} sx={{ mb: 2 }}>
          {t("home.odometerTitle", { name: BRAND.name })}
        </Typography>
        <Odometer value={totalQr} />
        <OdometerCaption>{t("home.odometerCaption")}</OdometerCaption>
      </Container>

      <FeatureFrames />

      <Container maxWidth="md" sx={{ pb: 10 }} component="section">
        <Typography component="h2" variant="h5" textAlign="center" fontWeight={800} sx={{ mb: 2 }}>
          {t("home.useCasesTitle")}
        </Typography>
        <Typography textAlign="center" color="text.secondary" sx={{ mb: 3, fontSize: 17, lineHeight: 1.6 }}>
          {t("home.useCasesBody")}
        </Typography>
        <Box
          component="ul"
          sx={{
            m: 0,
            px: 0,
            display: "grid",
            gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
            gap: 1.5,
            listStyle: "none",
          }}
        >
          {[
            t("home.useCaseMenu"),
            t("home.useCaseLine"),
            t("home.useCaseSocial"),
            t("home.useCaseCard"),
          ].map((label) => (
            <Box
              key={label}
              component="li"
              sx={{
                px: 2,
                py: 1.5,
                borderRadius: 2,
                bgcolor: "#fff",
                border: "1px solid",
                borderColor: "rgba(37, 99, 235, 0.14)",
                fontWeight: 700,
                textAlign: "center",
              }}
            >
              {label}
            </Box>
          ))}
        </Box>
      </Container>
    </>
  );
}
