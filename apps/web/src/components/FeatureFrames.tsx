"use client";

import Box from "@mui/material/Box";
import Chip from "@mui/material/Chip";
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
    <Container maxWidth="lg" sx={{ pb: 10 }}>
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
            <Box sx={{ position: "relative" }}>
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
              <Chip
                label={t(item.key)}
                sx={{
                  position: "absolute",
                  left: "50%",
                  bottom: 16,
                  transform: "translateX(-50%)",
                  height: 36,
                  px: 1,
                  fontWeight: 700,
                  bgcolor: "#fff",
                  color: "text.primary",
                  backdropFilter: "blur(8px)",
                  boxShadow: "0 10px 24px rgba(15, 23, 42, 0.12)",
                  "& .MuiChip-label": { px: 1.5 },
                }}
              />
            </Box>
            <Typography color="text.secondary" sx={{ px: 2.5, py: 2, fontSize: 15, lineHeight: 1.5 }}>
              {t(item.body)}
            </Typography>
          </Box>
        ))}
      </Box>
    </Container>
  );
}
