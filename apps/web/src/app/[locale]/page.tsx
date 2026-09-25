import type { Metadata } from "next";
import Box from "@mui/material/Box";
import Container from "@mui/material/Container";
import Typography from "@mui/material/Typography";
import { BRAND, COLORS } from "@mamuy/shared";
import { FeatureFrames } from "@/components/FeatureFrames";
import { HomeGenerator } from "@/components/HomeGenerator";
import { Odometer, OdometerCaption } from "@/components/Odometer";
import { getApiUrl } from "@/lib/api";
import { publicPageMetadata } from "@/i18n/metadata";
import { getT, resolveLocale } from "@/i18n/server";

/** A tiny public count reads as "nobody uses this", so the counter stays hidden until then. */
const ODOMETER_MIN = 1000;

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
  const title = `${t("brand.tagline")} | ${BRAND.name}`;
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
          pt: { xs: 5, md: 7 },
          pb: { xs: 6, md: 8 },
        }}
      >
        <Container maxWidth="md">
          <Typography component="h1" variant="h2" textAlign="center" sx={{ fontSize: { xs: 34, md: 52 } }}>
            {t("home.headline")}
          </Typography>
          <Typography textAlign="center" color="text.secondary" sx={{ mt: 1.5, fontSize: { xs: 17, md: 19 } }}>
            {t("home.subtitle")}
          </Typography>
          <HomeGenerator />
          <Typography textAlign="center" color="text.secondary" sx={{ mt: 4, fontSize: 16, lineHeight: 1.7 }}>
            {t("home.aioSummary")}
          </Typography>
        </Container>
      </Box>

      {totalQr >= ODOMETER_MIN ? (
        <Container maxWidth="md" sx={{ py: 6 }}>
          <Typography component="h2" variant="h5" textAlign="center" fontWeight={800} sx={{ mb: 2 }}>
            {t("home.odometerTitle", { name: BRAND.name })}
          </Typography>
          <Odometer value={totalQr} />
          <OdometerCaption>{t("home.odometerCaption")}</OdometerCaption>
        </Container>
      ) : null}

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
