"use client";

import { COLORS } from "@mamuy/shared";
import { LineChart } from "@mui/x-charts/LineChart";

type Props = {
  dates: string[];
  counts: number[];
  label: string;
  height?: number;
  color?: string;
};

export function ScanAreaChart({ dates, counts, label, height = 280, color = COLORS.primary }: Props) {
  const peak = Math.max(1, ...counts);
  return (
    <LineChart
      height={height}
      xAxis={[{ scaleType: "point", data: dates, disableLine: true, disableTicks: true }]}
      yAxis={[{ min: 0, max: peak, valueFormatter: (value) => String(Math.round(Number(value))), disableLine: true, disableTicks: true }]}
      series={[
        {
          data: counts,
          label,
          color,
          area: true,
          showMark: false,
          curve: "linear",
        },
      ]}
      grid={{ horizontal: false, vertical: false }}
      slotProps={{ legend: { hidden: true } }}
      sx={{
        "& .MuiAreaElement-root": { fillOpacity: 0.18 },
        "& .MuiLineElement-root": { strokeWidth: 2.25 },
        "& .MuiChartsAxis-tickLabel": { fill: "#64748B" },
      }}
    />
  );
}
