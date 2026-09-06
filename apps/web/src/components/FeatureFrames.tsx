"use client";

import Box from "@mui/material/Box";
import Container from "@mui/material/Container";
import Typography from "@mui/material/Typography";

import { useI18n } from "@/i18n/LocaleProvider";

const FEATURES = [
  { key: "home.featureLogo", body: "home.featureLogoBody", src: "/features/logo.jpg" },
  { key: "home.featureLink", body: "home.featureLinkBody", src: "/features/link.jpg" },
  { key: "home.featureScans", body: "home.featureScansBody", src: "/features/scans.jpg" },
] as const;

export function FeatureFrames() {
  const { t } = useI18n();
  return (
    <Container maxWidth="lg" sx={{ pb: 10 }} component="section">
      <Typography component="h2" variant="h5" textAlign="center" fontWeight={800} sx={{ mb: 4 }}>
        {t("home.howTitle")}
      </Typography>
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", md: "repeat(3, 1fr)" },
          gap: { xs: 2.5, md: 3 },
        }}
      >
        {FEATURES.map((item) => (
          <Box
            key={item.src}
            component="article"
            sx={{
              overflow: "hidden",
              borderRadius: 5,
              bgcolor: "#fff",
              border: "1px solid",
              borderColor: "rgba(37, 99, 235, 0.14)",
              boxShadow: "0 22px 48px rgba(11, 31, 58, 0.08)",
              transition: "transform 200ms ease, box-shadow 200ms ease",
              "&:hover": {
                transform: "translateY(-4px)",
                boxShadow: "0 28px 56px rgba(37, 99, 235, 0.16)",
              },
            }}
          >
            <Box
              component="img"
              src={item.src}
              alt={t(item.key)}
              sx={{
                width: "100%",
                aspectRatio: "1 / 1",
                objectFit: "cover",
                display: "block",
              }}
            />
            <Box sx={{ px: 2.5, py: 2.5 }}>
              <Typography component="h3" variant="subtitle1" fontWeight={800} sx={{ lineHeight: 1.35 }}>
                {t(item.key)}
              </Typography>
              <Typography color="text.secondary" sx={{ mt: 1, fontSize: 15, lineHeight: 1.5 }}>
                {t(item.body)}
              </Typography>
            </Box>
          </Box>
        ))}
      </Box>
    </Container>
  );
}
