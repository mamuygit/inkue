"use client";

import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Container from "@mui/material/Container";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { ScanAreaChart } from "@/components/ScanAreaChart";
import { ScanBreakdownCharts } from "@/components/ScanBreakdownCharts";
import { DateRangeFilter } from "@/components/DateRangeFilter";
import { LocaleLink } from "@/components/LocaleLink";
import { PageLoading } from "@/components/PageLoading";
import { useQuery } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import { useParams } from "next/navigation";
import { useMemo, useState } from "react";
import { useI18n } from "@/i18n/LocaleProvider";
import { formatWhen } from "@/lib/admin-format";
import { apiFetch } from "@/lib/api";
import { rangeFromPreset, statsQuery } from "@/lib/date-range";

type AdminQr = {
  id: string;
  title: string | null;
  destinationUrl: string;
  scanUrl: string;
  imageUrl: string;
  scanCount: number;
  createdAt: string;
  owner: { id: string; email: string };
};

type QrStats = {
  total: number;
  scansInRange: number;
  days: { date: string; count: number }[];
  byReferrer: { label: string; count: number }[];
  byDevice: { label: string; count: number }[];
};

export default function AdminQrDetailPage() {
  const { t, locale } = useI18n();
  const params = useParams<{ id: string }>();
  const { data: session } = useSession();
  const token = session?.accessToken;
  const initial = useMemo(() => rangeFromPreset(14), []);
  const [from, setFrom] = useState(initial.from);
  const [to, setTo] = useState(initial.to);

  const qr = useQuery({
    queryKey: ["admin-qr-one", params.id],
    enabled: Boolean(token && params.id),
    queryFn: () => apiFetch<AdminQr>(`/admin/qr/${params.id}`, { token }),
  });

  const stats = useQuery({
    queryKey: ["admin-qr-stats", params.id, from, to],
    enabled: Boolean(token && params.id),
    queryFn: () => apiFetch<QrStats>(`/admin/qr/${params.id}/stats?${statsQuery(from, to)}`, { token }),
  });

  if (qr.isLoading) {
    return <PageLoading />;
  }

  if (!qr.data) {
    return (
      <Container maxWidth="lg" sx={{ py: 5 }}>
        <Typography>{t("errors.qrNotFound")}</Typography>
      </Container>
    );
  }

  const row = qr.data;

  return (
    <Container maxWidth="lg" sx={{ py: { xs: 2, md: 4 } }}>
      <Button component={LocaleLink} href="/admin/qr" sx={{ mb: 2 }}>
        {t("admin.backToQr")}
      </Button>
      <Stack direction={{ xs: "column", sm: "row" }} spacing={2} sx={{ mb: 3 }}>
        <Box
          component="img"
          src={row.imageUrl}
          alt=""
          sx={{ width: 96, height: 96, borderRadius: 1, bgcolor: "#fff" }}
        />
        <Box sx={{ minWidth: 0 }}>
          <Typography component="h1" variant="h4" fontWeight={800} sx={{ wordBreak: "break-word" }}>
            {row.title || t("dashboard.untitled")}
          </Typography>
          <Typography sx={{ wordBreak: "break-all" }}>{row.destinationUrl}</Typography>
          <Typography color="text.secondary" sx={{ wordBreak: "break-all" }}>
            {row.scanUrl}
          </Typography>
          <Typography color="text.secondary">
            {t("admin.owner")}{" "}
            <Box
              component={LocaleLink}
              href={`/admin/users/${row.owner.id}`}
              sx={{ color: "primary.main", textDecoration: "none" }}
            >
              {row.owner.email}
            </Box>{" "}
            · {formatWhen(row.createdAt, locale, t("admin.never"))} · {t("dashboard.scanCount", { count: row.scanCount })}
          </Typography>
        </Box>
      </Stack>

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

      <Paper variant="outlined" sx={{ p: 2 }}>
        <ScanBreakdownCharts byReferrer={stats.data?.byReferrer ?? []} byDevice={stats.data?.byDevice ?? []} />
      </Paper>
    </Container>
  );
}
