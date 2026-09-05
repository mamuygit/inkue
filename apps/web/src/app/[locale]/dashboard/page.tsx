"use client";

import Box from "@mui/material/Box";
import Container from "@mui/material/Container";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { COLORS } from "@mamuy/shared";
import { BarChart } from "@mui/x-charts/BarChart";
import { ScanAreaChart } from "@/components/ScanAreaChart";
import { ScanBreakdownCharts } from "@/components/ScanBreakdownCharts";
import { useQuery } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import { useMemo, useState } from "react";
import { DateRangeFilter } from "@/components/DateRangeFilter";
import { useI18n } from "@/i18n/LocaleProvider";
import { apiFetch } from "@/lib/api";
import { rangeFromPreset, statsQuery } from "@/lib/date-range";

type MineStats = {
  totalQr: number;
  createdInRange: number;
  usedInRange: number;
  scansInRange: number;
  from: string;
  to: string;
  days: { date: string; count: number }[];
  byQr: { id: string; title: string | null; destinationUrl: string; scanCount: number }[];
  byReferrer: { label: string; count: number }[];
  byDevice: { label: string; count: number }[];
};

function shortLabel(title: string | null, destinationUrl: string) {
  const raw = (title || destinationUrl).replace(/^https?:\/\//, "");
  return raw.length > 24 ? `${raw.slice(0, 23)}…` : raw;
}

export default function DashboardPage() {
  const { t } = useI18n();
  const { data: session } = useSession();
  const token = session?.accessToken;
  const initial = useMemo(() => rangeFromPreset(14), []);
  const [from, setFrom] = useState(initial.from);
  const [to, setTo] = useState(initial.to);

  const stats = useQuery({
    queryKey: ["stats-me", from, to],
    enabled: Boolean(token),
    queryFn: () => apiFetch<MineStats>(`/stats/me?${statsQuery(from, to)}`, { token }),
  });

  const barLabels = (stats.data?.byQr ?? []).map((row) => shortLabel(row.title, row.destinationUrl));
  const barValues = (stats.data?.byQr ?? []).map((row) => row.scanCount);

  return (
    <Container maxWidth="lg" sx={{ py: { xs: 2, md: 4 } }}>
      <Box sx={{ mb: 3 }}>
        <Typography component="h1" variant="h4" fontWeight={800}>
          {t("menu.dashboard")}
        </Typography>
        <Typography color="text.secondary">{session?.user?.email}</Typography>
      </Box>

      <Paper variant="outlined" sx={{ p: 2, mb: 3 }}>
        <DateRangeFilter
          from={from}
          to={to}
          onChange={(next) => {
            setFrom(next.from);
            setTo(next.to);
          }}
        />
      </Paper>

      <Stack direction={{ xs: "column", md: "row" }} spacing={2} sx={{ mb: 4 }}>
        <Paper variant="outlined" sx={{ p: 3, flex: 1 }}>
          <Typography color="text.secondary">{t("dashboard.yourQr")}</Typography>
          <Typography variant="h3" fontWeight={800}>
            {stats.data?.totalQr ?? 0}
          </Typography>
        </Paper>
        <Paper variant="outlined" sx={{ p: 3, flex: 1 }}>
          <Typography color="text.secondary">{t("dashboard.createdInRange")}</Typography>
          <Typography variant="h3" fontWeight={800}>
            {stats.data?.createdInRange ?? 0}
          </Typography>
        </Paper>
        <Paper variant="outlined" sx={{ p: 3, flex: 1 }}>
          <Typography color="text.secondary">{t("dashboard.usedInRange")}</Typography>
          <Typography variant="h3" fontWeight={800}>
            {stats.data?.usedInRange ?? 0}
          </Typography>
        </Paper>
        <Paper variant="outlined" sx={{ p: 3, flex: 1 }}>
          <Typography color="text.secondary">{t("dashboard.scansInRange")}</Typography>
          <Typography variant="h3" fontWeight={800}>
            {stats.data?.scansInRange ?? 0}
          </Typography>
        </Paper>
      </Stack>

      <Paper variant="outlined" sx={{ p: 2, mb: 3 }}>
        <Typography fontWeight={700} sx={{ px: 1, pt: 1 }}>
          {t("dashboard.rangeTitle", { from, to })}
        </Typography>
        <ScanAreaChart
          dates={(stats.data?.days ?? []).map((d) => d.date.slice(5))}
          counts={(stats.data?.days ?? []).map((d) => d.count)}
          label={t("dashboard.scans")}
        />
      </Paper>

      <Paper variant="outlined" sx={{ p: 2, mb: 2 }}>
        <Typography fontWeight={700} sx={{ px: 1, pt: 1 }}>
          {t("dashboard.byLink")}
        </Typography>
        {barValues.length ? (
          <BarChart
            layout="horizontal"
            height={Math.max(240, barValues.length * 40)}
            yAxis={[{ scaleType: "band", data: barLabels }]}
            series={[{ data: barValues, label: t("dashboard.scans"), color: COLORS.accent }]}
            margin={{ left: 120, right: 16 }}
          />
        ) : (
          <Typography color="text.secondary" sx={{ px: 1, py: 3 }}>
            {t("dashboard.noUsage")}
          </Typography>
        )}
      </Paper>

      <Paper variant="outlined" sx={{ p: 2 }}>
        <ScanBreakdownCharts byReferrer={stats.data?.byReferrer ?? []} byDevice={stats.data?.byDevice ?? []} />
      </Paper>
    </Container>
  );
}
