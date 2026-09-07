"use client";

import Box from "@mui/material/Box";
import LinearProgress from "@mui/material/LinearProgress";
import { alpha } from "@mui/material/styles";
import { COLORS } from "@mamuy/shared";
import { useI18n } from "@/i18n/LocaleProvider";

export function PageLoading() {
  const { t } = useI18n();

  return (
    <Box
      role="status"
      aria-label={t("dashboard.loading")}
      sx={{
        flex: 1,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        width: "100%",
        minHeight: "100%",
        py: 10,
      }}
    >
      <LinearProgress
        sx={{
          width: { xs: 200, sm: 280 },
          height: 6,
          borderRadius: 999,
          bgcolor: alpha(COLORS.primary, 0.12),
          "& .MuiLinearProgress-bar": { borderRadius: 999 },
        }}
      />
    </Box>
  );
}
