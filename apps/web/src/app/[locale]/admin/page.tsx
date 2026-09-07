"use client";

import Box from "@mui/material/Box";
import Container from "@mui/material/Container";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { CHART } from "@mamuy/shared";
import { useQuery } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import { useMemo, useState } from "react";
import { AdminTrendChart } from "@/components/AdminTrendChart";
import { DateRangeFilter } from "@/components/DateRangeFilter";
import { DonutChart } from "@/components/DonutChart";
import { LocaleLink } from "@/components/LocaleLink";
import { ScanBreakdownCharts } from "@/components/ScanBreakdownCharts";
import { useI18n } from "@/i18n/LocaleProvider";
import { shortLabel } from "@/lib/admin-format";
import { apiFetch } from "@/lib/api";
import { rangeFromPreset, statsQuery } from "@/lib/date-range";

type Overview = {
  from: string;
  to: string;
  totalUsers: number;
  verifiedUsers: number;
  usersInRange: number;
  totalQr: number;
  createdInRange: number;
  usedInRange: number;
  unusedInRange: number;
  scansInRange: number;
  donateInRange: number;
  donateSignedIn: number;
  donateAnonymous: number;
  days: {
    scans: { date: string; count: number }[];
    qr: { date: string; count: number }[];
    users: { date: string; count: number }[];
    donates: { date: string; count: number }[];
  };
  byReferrer: { label: string; count: number }[];
  byDevice: { label: string; count: number }[];
  topQr: {
    id: string;
    title: string | null;
    destinationUrl: string;
    scanCount: number;
    owner: { id: string; email: string };
  }[];
  topUsersByQr: { id: string; email: string; qrCount: number }[];
  topUsersByScans: { id: string; email: string; scanCount: number }[];
  topDonors: { userId: string | null; email: string | null; count: number }[];
};

function Kpi({ label, value }: { label: string; value: number }) {
  return (
    <Paper variant="outlined" sx={{ p: 2.5, flex: "1 1 140px", minWidth: 140 }}>
      <Typography color="text.secondary" variant="body2">
        {label}
      </Typography>
      <Typography variant="h4" fontWeight={800}>
        {value}
      </Typography>
    </Paper>
  );
}

export default function AdminOverviewPage() {
  const { t } = useI18n();
  const { data: session } = useSession();
  const token = session?.accessToken;
  const initial = useMemo(() => rangeFromPreset(14), []);
  const [from, setFrom] = useState(initial.from);
  const [to, setTo] = useState(initial.to);

  const stats = useQuery({
    queryKey: ["admin-overview", from, to],
    enabled: Boolean(token),
    queryFn: () => apiFetch<Overview>(`/admin/overview?${statsQuery(from, to)}`, { token }),
  });

  const data = stats.data;
  const dates = (data?.days.scans ?? []).map((d) => d.date.slice(5));

  return (
    <Container maxWidth="lg" sx={{ py: { xs: 2, md: 4 } }}>
      <Box sx={{ mb: 3 }}>
        <Typography component="h1" variant="h4" fontWeight={800}>
          {t("admin.title")}
        </Typography>
        <Typography color="text.secondary">{t("admin.subtitle")}</Typography>
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

      <Stack direction="row" spacing={2} useFlexGap flexWrap="wrap" sx={{ mb: 3 }}>
        <Kpi label={t("admin.totalUsers")} value={data?.totalUsers ?? 0} />
        <Kpi label={t("admin.verifiedUsers")} value={data?.verifiedUsers ?? 0} />
        <Kpi label={t("admin.usersInRange")} value={data?.usersInRange ?? 0} />
        <Kpi label={t("admin.totalQr")} value={data?.totalQr ?? 0} />
        <Kpi label={t("admin.createdInRange")} value={data?.createdInRange ?? 0} />
        <Kpi label={t("admin.usedInRange")} value={data?.usedInRange ?? 0} />
        <Kpi label={t("admin.scansInRange")} value={data?.scansInRange ?? 0} />
        <Kpi label={t("admin.donateInRange")} value={data?.donateInRange ?? 0} />
      </Stack>

      <Paper variant="outlined" sx={{ p: 2, mb: 3 }}>
        <Typography fontWeight={700} sx={{ px: 1, pt: 1 }}>
          {t("admin.trendTitle", { from, to })}
        </Typography>
        <AdminTrendChart
          dates={dates}
          scans={(data?.days.scans ?? []).map((d) => d.count)}
          qr={(data?.days.qr ?? []).map((d) => d.count)}
          users={(data?.days.users ?? []).map((d) => d.count)}
          donates={(data?.days.donates ?? []).map((d) => d.count)}
          labels={{
            scans: t("admin.seriesScans"),
            qr: t("admin.seriesQr"),
            users: t("admin.seriesUsers"),
            donates: t("admin.seriesDonates"),
          }}
        />
      </Paper>

      <Stack direction={{ xs: "column", md: "row" }} spacing={2} sx={{ mb: 3 }}>
        <Paper variant="outlined" sx={{ p: 2, flex: 1 }}>
          <Typography fontWeight={700} sx={{ px: 1, pt: 1 }}>
            {t("admin.usedSplit")}
          </Typography>
          <DonutChart
            slices={[
              { id: 0, value: data?.usedInRange ?? 0, label: t("admin.used"), color: CHART.used },
              { id: 1, value: data?.unusedInRange ?? 0, label: t("admin.unused"), color: CHART.unused },
            ]}
            emptyText={t("dashboard.noUsage")}
          />
        </Paper>
        <Paper variant="outlined" sx={{ p: 2, flex: 1 }}>
          <Typography fontWeight={700} sx={{ px: 1, pt: 1 }}>
            {t("admin.donates")}
          </Typography>
          <DonutChart
            slices={[
              { id: 0, value: data?.donateSignedIn ?? 0, label: t("admin.donateSignedIn"), color: CHART.signedIn },
              { id: 1, value: data?.donateAnonymous ?? 0, label: t("admin.donateAnonymous"), color: CHART.anonymous },
            ]}
            emptyText={t("admin.emptyDonates")}
          />
        </Paper>
      </Stack>

      <Paper variant="outlined" sx={{ p: 2, mb: 3 }}>
        <ScanBreakdownCharts byReferrer={data?.byReferrer ?? []} byDevice={data?.byDevice ?? []} />
      </Paper>

      <RankBlock
        title={t("admin.topQr")}
        rows={(data?.topQr ?? []).map((row) => ({
          href: `/admin/qr/${row.id}`,
          label: shortLabel(row.title, row.destinationUrl),
          extra: row.owner.email,
          value: row.scanCount,
        }))}
      />
      <RankBlock
        title={t("admin.topUsersByQr")}
        rows={(data?.topUsersByQr ?? []).map((row) => ({
          href: `/admin/users/${row.id}`,
          label: row.email,
          value: row.qrCount,
        }))}
      />
      <RankBlock
        title={t("admin.topUsersByScans")}
        rows={(data?.topUsersByScans ?? []).map((row) => ({
          href: `/admin/users/${row.id}`,
          label: row.email,
          value: row.scanCount,
        }))}
      />
      <RankBlock
        title={t("admin.topDonors")}
        rows={(data?.topDonors ?? []).map((row) => ({
          href: row.userId ? `/admin/users/${row.userId}` : null,
          label: row.email ?? t("stats.anonymous"),
          value: row.count,
        }))}
      />
    </Container>
  );
}

function RankBlock({
  title,
  rows,
}: {
  title: string;
  rows: { href: string | null; label: string; extra?: string; value: number }[];
}) {
  const { t } = useI18n();

  return (
    <Paper variant="outlined" sx={{ p: 2, mb: 2 }}>
      <Typography fontWeight={700} sx={{ mb: 1.5 }}>
        {title}
      </Typography>
      {rows.length ? (
        <Stack spacing={1}>
          {rows.map((row, index) => {
            const content = (
              <Stack direction="row" spacing={1.5} alignItems="baseline" justifyContent="space-between">
                <Typography className="rank-label" variant="body2" sx={{ minWidth: 0, wordBreak: "break-all" }}>
                  <Box component="span" sx={{ color: "text.secondary", fontWeight: 700, mr: 1 }}>
                    {index + 1}
                  </Box>
                  {row.label}
                  {row.extra ? (
                    <Box component="span" sx={{ color: "text.secondary" }}>
                      {" "}
                      · {row.extra}
                    </Box>
                  ) : null}
                </Typography>
                <Typography variant="body2" fontWeight={800} sx={{ flexShrink: 0 }}>
                  {row.value}
                </Typography>
              </Stack>
            );
            return row.href ? (
              <Box
                key={`${row.href}-${row.label}`}
                component={LocaleLink}
                href={row.href}
                sx={{ color: "inherit", textDecoration: "none", "&:hover .rank-label": { color: "primary.main" } }}
              >
                {content}
              </Box>
            ) : (
              <Box key={row.label}>{content}</Box>
            );
          })}
        </Stack>
      ) : (
        <Typography color="text.secondary">{t("dashboard.noUsage")}</Typography>
      )}
    </Paper>
  );
}
