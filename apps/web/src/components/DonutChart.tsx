"use client";

import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { PieChart } from "@mui/x-charts/PieChart";

export type DonutSlice = { id: number; value: number; label: string; color: string };

export function DonutChart({
  slices,
  emptyText,
}: {
  slices: DonutSlice[];
  emptyText: string;
}) {
  const total = slices.reduce((sum, slice) => sum + slice.value, 0);

  if (!total) {
    return (
      <Typography color="text.secondary" sx={{ px: 1, py: 3 }}>
        {emptyText}
      </Typography>
    );
  }

  return (
    <Stack
      direction={{ xs: "column", sm: "row" }}
      alignItems="center"
      spacing={{ xs: 1.5, sm: 3 }}
      sx={{ px: 1, py: 1.5 }}
    >
      <Box sx={{ position: "relative", width: 176, height: 176, flexShrink: 0 }}>
        <PieChart
          width={176}
          height={176}
          series={[
            {
              data: slices.filter((slice) => slice.value > 0),
              innerRadius: 62,
              outerRadius: 80,
              paddingAngle: 3.5,
              cornerRadius: 5,
              cx: 88,
              cy: 88,
              highlightScope: { fade: "global", highlight: "item" },
              faded: { additionalRadius: -6, color: "#CBD5E1" },
            },
          ]}
          margin={{ top: 4, right: 4, bottom: 4, left: 4 }}
          slotProps={{ legend: { hidden: true } }}
          sx={{ "& .MuiPieArc-root": { strokeWidth: 0 } }}
        />
        <Box
          sx={{
            position: "absolute",
            inset: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            pointerEvents: "none",
          }}
        >
          <Typography variant="h5" fontWeight={800} sx={{ letterSpacing: "-0.04em", lineHeight: 1 }}>
            {total}
          </Typography>
        </Box>
      </Box>
      <Stack spacing={1.5} sx={{ width: "100%", minWidth: 0 }}>
        {slices.map((slice) => {
          const pct = Math.round((slice.value / total) * 100);
          return (
            <Stack key={slice.id} direction="row" spacing={1.25} alignItems="baseline">
              <Box
                sx={{
                  width: 8,
                  height: 8,
                  borderRadius: "50%",
                  bgcolor: slice.color,
                  flexShrink: 0,
                  alignSelf: "center",
                }}
              />
              <Typography variant="body2" color="text.secondary" sx={{ flex: 1, minWidth: 0 }} noWrap>
                {slice.label}
              </Typography>
              <Typography variant="body2" fontWeight={700}>
                {slice.value}
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ width: 36, textAlign: "right" }}>
                {pct}%
              </Typography>
            </Stack>
          );
        })}
      </Stack>
    </Stack>
  );
}
