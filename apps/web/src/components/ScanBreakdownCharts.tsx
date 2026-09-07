"use client";

import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { CHART } from "@mamuy/shared";
import { StatBars } from "@/components/StatBars";
import { useI18n } from "@/i18n/LocaleProvider";

export type BreakdownRow = { label: string; count: number };

const DEVICE_KEYS = new Set(["mobile", "tablet", "desktop", "unknown", "direct", "anonymous"]);

export function ScanBreakdownCharts({
  byReferrer,
  byDevice,
}: {
  byReferrer: BreakdownRow[];
  byDevice: BreakdownRow[];
}) {
  const { t } = useI18n();

  const labelOf = (label: string) => {
    if (DEVICE_KEYS.has(label)) return t(`stats.${label}` as "stats.direct");
    return label;
  };

  const renderChart = (title: string, rows: BreakdownRow[]) => (
    <Box sx={{ flex: 1, minWidth: 0 }}>
      <Typography fontWeight={700} sx={{ px: 1, pt: 1 }}>
        {title}
      </Typography>
      <StatBars
        rows={rows.map((row) => ({ label: labelOf(row.label), count: row.count }))}
        color={CHART.bar}
        emptyText={t("stats.empty")}
      />
    </Box>
  );

  return (
    <Stack direction={{ xs: "column", md: "row" }} spacing={{ xs: 2, md: 4 }}>
      {renderChart(t("stats.referrers"), byReferrer)}
      {renderChart(t("stats.devices"), byDevice)}
    </Stack>
  );
}
