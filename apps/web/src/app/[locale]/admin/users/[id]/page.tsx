"use client";

import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Container from "@mui/material/Container";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { useQuery } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import { useParams } from "next/navigation";
import { LocaleLink } from "@/components/LocaleLink";
import { useI18n } from "@/i18n/LocaleProvider";
import { formatWhen, shortLabel } from "@/lib/admin-format";
import { apiFetch } from "@/lib/api";

type QrRow = {
  id: string;
  title: string | null;
  destinationUrl: string;
  scanUrl: string;
  imageUrl: string;
  scanCount: number;
  createdAt: string;
};

type UserDetail = {
  id: string;
  email: string;
  createdAt: string;
  lastLoginAt: string | null;
  verified: boolean;
  qrCount: number;
  scanCount: number;
  donateCount: number;
  qrs: QrRow[];
};

export default function AdminUserDetailPage() {
  const { t, locale } = useI18n();
  const params = useParams<{ id: string }>();
  const { data: session } = useSession();
  const token = session?.accessToken;

  const user = useQuery({
    queryKey: ["admin-user", params.id],
    enabled: Boolean(token && params.id),
    queryFn: () => apiFetch<UserDetail>(`/admin/users/${params.id}`, { token }),
  });

  if (user.isLoading) {
    return (
      <Container maxWidth="lg" sx={{ py: 5 }}>
        <Typography>{t("dashboard.loading")}</Typography>
      </Container>
    );
  }

  if (!user.data) {
    return (
      <Container maxWidth="lg" sx={{ py: 5 }}>
        <Typography>{t("errors.userNotFound")}</Typography>
      </Container>
    );
  }

  const row = user.data;

  return (
    <Container maxWidth="lg" sx={{ py: { xs: 2, md: 4 } }}>
      <Button component={LocaleLink} href="/admin/users" sx={{ mb: 2 }}>
        {t("admin.backToUsers")}
      </Button>
      <Typography component="h1" variant="h4" fontWeight={800}>
        {row.email}
      </Typography>
      <Typography color="text.secondary" sx={{ mb: 3 }}>
        {row.verified ? t("admin.verified") : t("admin.unverified")} · {t("admin.created")}{" "}
        {formatWhen(row.createdAt, locale, t("admin.never"))} · {t("admin.lastLogin")}{" "}
        {formatWhen(row.lastLoginAt, locale, t("admin.never"))}
      </Typography>

      <Stack direction={{ xs: "column", sm: "row" }} spacing={2} sx={{ mb: 4 }}>
        <Paper variant="outlined" sx={{ p: 2.5, flex: 1 }}>
          <Typography color="text.secondary">{t("admin.qrCount")}</Typography>
          <Typography variant="h4" fontWeight={800}>
            {row.qrCount}
          </Typography>
        </Paper>
        <Paper variant="outlined" sx={{ p: 2.5, flex: 1 }}>
          <Typography color="text.secondary">{t("admin.scanCount")}</Typography>
          <Typography variant="h4" fontWeight={800}>
            {row.scanCount}
          </Typography>
        </Paper>
        <Paper variant="outlined" sx={{ p: 2.5, flex: 1 }}>
          <Typography color="text.secondary">{t("admin.donateCount")}</Typography>
          <Typography variant="h4" fontWeight={800}>
            {row.donateCount}
          </Typography>
        </Paper>
      </Stack>

      <Typography fontWeight={800} sx={{ mb: 2 }}>
        {t("admin.userQr", { email: row.email })}
      </Typography>
      <Stack spacing={1.5}>
        {row.qrs.map((qr) => (
          <Paper key={qr.id} variant="outlined" sx={{ p: 2 }}>
            <Stack direction="row" spacing={2} alignItems="flex-start">
              <Box
                component="img"
                src={qr.imageUrl}
                alt=""
                sx={{ width: 64, height: 64, borderRadius: 1, bgcolor: "#fff", flexShrink: 0 }}
              />
              <Box sx={{ minWidth: 0, flex: 1 }}>
                <Box
                  component={LocaleLink}
                  href={`/admin/qr/${qr.id}`}
                  sx={{ color: "inherit", textDecoration: "none", fontWeight: 700, "&:hover": { color: "primary.main" } }}
                >
                  {shortLabel(qr.title, qr.destinationUrl)}
                </Box>
                <Typography variant="body2" sx={{ wordBreak: "break-all" }}>
                  {qr.destinationUrl}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {t("dashboard.scanCount", { count: qr.scanCount })} · {formatWhen(qr.createdAt, locale, t("admin.never"))}
                </Typography>
              </Box>
            </Stack>
          </Paper>
        ))}
        {!row.qrs.length ? <Typography color="text.secondary">{t("admin.emptyQr")}</Typography> : null}
      </Stack>
    </Container>
  );
}
