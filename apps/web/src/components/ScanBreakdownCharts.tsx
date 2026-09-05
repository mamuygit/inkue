"use client";

import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { COLORS } from "@mamuy/shared";
import { BarChart } from "@mui/x-charts/BarChart";
import { useI18n } from "@/i18n/LocaleProvider";

export type BreakdownRow = { label: string; count: number };

const DEVICE_KEYS = new Set(["mobile", "tablet", "desktop", "unknown", "direct"]);

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
      {rows.length ? (
        <BarChart
          layout="horizontal"
          height={Math.max(200, rows.length * 40)}
          yAxis={[{ scaleType: "band", data: rows.map((row) => labelOf(row.label)) }]}
          series={[{ data: rows.map((row) => row.count), label: t("dashboard.scans"), color: COLORS.accent }]}
          margin={{ left: 120, right: 16 }}
        />
      ) : (
        <Typography color="text.secondary" sx={{ px: 1, py: 3 }}>
          {t("stats.empty")}
        </Typography>
      )}
    </Box>
  );

  return (
    <Stack direction={{ xs: "column", md: "row" }} spacing={2} sx={{ mt: 2 }}>
      {renderChart(t("stats.referrers"), byReferrer)}
      {renderChart(t("stats.devices"), byDevice)}
    </Stack>
  );
}
