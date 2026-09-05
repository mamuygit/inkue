"use client";

import Button from "@mui/material/Button";
import Container from "@mui/material/Container";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogContentText from "@mui/material/DialogContentText";
import DialogTitle from "@mui/material/DialogTitle";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { ScanAreaChart } from "@/components/ScanAreaChart";
import { ScanBreakdownCharts } from "@/components/ScanBreakdownCharts";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import { useParams, useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { DateRangeFilter } from "@/components/DateRangeFilter";
import { QrEditor, type QrRecord } from "@/components/QrEditor";
import { apiFetch } from "@/lib/api";
import { rangeFromPreset, statsQuery } from "@/lib/date-range";
import { useI18n } from "@/i18n/LocaleProvider";
import { localizedPath } from "@/i18n/path";

type QrStats = {
  total: number;
  scansInRange: number;
  days: { date: string; count: number }[];
  byReferrer: { label: string; count: number }[];
  byDevice: { label: string; count: number }[];
};

export default function EditQrPage() {
  const { t, locale } = useI18n();
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { data: session } = useSession();
  const token = session?.accessToken;
  const initial = useMemo(() => rangeFromPreset(14), []);
  const [from, setFrom] = useState(initial.from);
  const [to, setTo] = useState(initial.to);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const qr = useQuery({
    queryKey: ["qr", params.id],
    enabled: Boolean(token && params.id),
    queryFn: () => apiFetch<QrRecord>(`/qr/${params.id}`, { token }),
  });

  const stats = useQuery({
    queryKey: ["qr-stats", params.id, from, to],
    enabled: Boolean(token && params.id),
    queryFn: () => apiFetch<QrStats>(`/qr/${params.id}/stats?${statsQuery(from, to)}`, { token }),
  });

  const remove = useMutation({
    mutationFn: () => apiFetch<{ ok: boolean }>(`/qr/${params.id}`, { method: "DELETE", token }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["qr-list"] });
      queryClient.invalidateQueries({ queryKey: ["folders"] });
      queryClient.invalidateQueries({ queryKey: ["stats-me"] });
      router.push(localizedPath("/dashboard/qr", locale));
    },
  });

  if (qr.isLoading) {
    return (
      <Container maxWidth="lg" sx={{ py: 5 }}>
        <Typography>{t("dashboard.loading")}</Typography>
      </Container>
    );
  }

  if (!qr.data) {
    return (
      <Container maxWidth="lg" sx={{ py: 5 }}>
        <Typography>{t("dashboard.notFound")}</Typography>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 5 }}>
      <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" alignItems={{ sm: "flex-start" }} spacing={2} sx={{ mb: 3 }}>
        <div>
          <Typography component="h1" variant="h4" fontWeight={800} sx={{ mb: 1 }}>
            {t("dashboard.edit")}
          </Typography>
          <Typography color="text.secondary">
            {t("dashboard.scansGoTo", { url: qr.data.scanUrl, count: stats.data?.total ?? qr.data.scanCount })}
          </Typography>
        </div>
        <Button color="error" variant="outlined" onClick={() => setConfirmDelete(true)}>
          {t("dashboard.deleteQr")}
        </Button>
      </Stack>
      <Paper variant="outlined" sx={{ p: 2, mb: 4 }}>
        <Stack spacing={2} sx={{ px: 1, pt: 1 }}>
          <Typography fontWeight={700}>{t("dashboard.daily")}</Typography>
          <DateRangeFilter
            from={from}
            to={to}
            onChange={(next) => {
              setFrom(next.from);
              setTo(next.to);
            }}
          />
        </Stack>
        <ScanAreaChart
          height={260}
          dates={(stats.data?.days ?? []).map((d) => d.date.slice(5))}
          counts={(stats.data?.days ?? []).map((d) => d.count)}
          label={t("dashboard.scans")}
        />
        <ScanBreakdownCharts byReferrer={stats.data?.byReferrer ?? []} byDevice={stats.data?.byDevice ?? []} />
      </Paper>
      <QrEditor existing={qr.data} />

      <Dialog open={confirmDelete} onClose={() => setConfirmDelete(false)}>
        <DialogTitle>{t("dashboard.deleteQr")}</DialogTitle>
        <DialogContent>
          <DialogContentText>{t("dashboard.deleteQrConfirm")}</DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmDelete(false)}>{t("dashboard.cancel")}</Button>
          <Button color="error" onClick={() => remove.mutate()} disabled={remove.isPending}>
            {t("dashboard.deleteQr")}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}
