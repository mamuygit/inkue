"use client";

import { CHART } from "@mamuy/shared";
import { LineChart } from "@mui/x-charts/LineChart";
import { useMemo, useState } from "react";

type SeriesId = "scans" | "qr" | "users" | "donates";

type Props = {
  dates: string[];
  scans: number[];
  qr: number[];
  users: number[];
  donates: number[];
  labels: { scans: string; qr: string; users: string; donates: string };
};

const SERIES_ORDER: SeriesId[] = ["scans", "qr", "users", "donates"];

export function AdminTrendChart({ dates, scans, qr, users, donates, labels }: Props) {
  const [hidden, setHidden] = useState<Record<SeriesId, boolean>>({
    scans: false,
    qr: false,
    users: false,
    donates: false,
  });

  const values: Record<SeriesId, number[]> = { scans, qr, users, donates };
  const colors: Record<SeriesId, string> = {
    scans: CHART.scans,
    qr: CHART.qr,
    users: CHART.users,
    donates: CHART.donate,
  };

  const visibleValues = SERIES_ORDER.flatMap((id) => (hidden[id] ? [] : values[id]));
  const peak = Math.max(1, ...visibleValues);
  const empty = dates.map(() => null);

  const series = useMemo(
    () =>
      SERIES_ORDER.map((id) => ({
        id,
        data: hidden[id] ? empty : values[id],
        label: labels[id],
        color: colors[id],
        area: id === "scans",
        showMark: false as const,
        curve: "linear" as const,
      })),
    [dates.length, hidden, labels, scans, qr, users, donates],
  );

  const hiddenLegendSx = Object.fromEntries(
    SERIES_ORDER.filter((id) => hidden[id]).map((id) => [
      `& .MuiChartsLegend-series-${id}`,
      { opacity: 0.38 },
    ]),
  );

  return (
    <LineChart
      height={320}
      xAxis={[{ scaleType: "point", data: dates, disableLine: true, disableTicks: true }]}
      yAxis={[{ min: 0, max: peak, valueFormatter: (value) => String(Math.round(Number(value))), disableLine: true, disableTicks: true }]}
      series={series}
      grid={{ horizontal: false, vertical: false }}
      slotProps={{
        legend: {
          onItemClick: (_event, item) => {
            const id = item.seriesId as SeriesId;
            if (!SERIES_ORDER.includes(id)) return;
            setHidden((prev) => ({ ...prev, [id]: !prev[id] }));
          },
        },
      }}
      sx={{
        "& .MuiAreaElement-root": { fillOpacity: 0.16 },
        "& .MuiLineElement-root": { strokeWidth: 2.25 },
        "& .MuiChartsAxis-tickLabel": { fill: "#64748B" },
        "& .MuiChartsLegend-series": { cursor: "pointer" },
        ...hiddenLegendSx,
      }}
    />
  );
}
