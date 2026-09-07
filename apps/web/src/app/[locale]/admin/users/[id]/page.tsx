"use client";

import Alert from "@mui/material/Alert";
import Avatar from "@mui/material/Avatar";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogContentText from "@mui/material/DialogContentText";
import DialogTitle from "@mui/material/DialogTitle";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Typography from "@mui/material/Typography";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import { useParams } from "next/navigation";
import { useState } from "react";
import { LocaleLink } from "@/components/LocaleLink";
import { PageLoading } from "@/components/PageLoading";
import { translateApiError } from "@/i18n/errors";
import { useI18n } from "@/i18n/LocaleProvider";
import { formatWhen, shortLabel } from "@/lib/admin-format";
import { ApiError, apiFetch } from "@/lib/api";

type QrRow = {
  id: string;
  title: string | null;
  destinationUrl: string;
  scanUrl: string;
  imageUrl: string;
  scanCount: number;
  createdAt: string;
};

type DonateRow = {
  id: string;
  createdAt: string;
  path: string | null;
};

type UserDetail = {
  id: string;
  email: string;
  isAdmin: boolean;
  avatarUrl: string | null;
  createdAt: string;
  lastLoginAt: string | null;
  verified: boolean;
  deleted: boolean;
  disabled: boolean;
  qrCount: number;
  scanCount: number;
  donateCount: number;
  qrs: QrRow[];
  donates: DonateRow[];
};

function initialFromEmail(email: string) {
  const letter = email.trim().charAt(0);
  return letter ? letter.toUpperCase() : "?";
}

export default function AdminUserDetailPage() {
  const { t, locale } = useI18n();
  const params = useParams<{ id: string }>();
  const { data: session } = useSession();
  const token = session?.accessToken;
  const queryClient = useQueryClient();
  const [confirm, setConfirm] = useState<"activate" | "deactivate" | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const user = useQuery({
    queryKey: ["admin-user", params.id],
    enabled: Boolean(token && params.id),
    queryFn: () => apiFetch<UserDetail>(`/admin/users/${params.id}`, { token }),
  });

  const status = useMutation({
    mutationFn: (active: boolean) =>
      apiFetch<UserDetail>(`/admin/users/${params.id}/status`, {
        method: "PATCH",
        token,
        body: JSON.stringify({ active }),
      }),
    onSuccess: (data) => {
      queryClient.setQueryData(["admin-user", params.id], data);
      void queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      setConfirm(null);
      setError(null);
      setNotice(t("admin.statusUpdated"));
    },
    onError: (err) => {
      setConfirm(null);
      setNotice(null);
      setError(err instanceof ApiError ? translateApiError(t, err) : t("errors.generic"));
    },
  });

  if (user.isLoading) {
    return <PageLoading />;
  }

  if (!user.data) {
    return (
      <Box sx={{ px: { xs: 2, md: 3 }, py: 5 }}>
        <Typography>{t("errors.userNotFound")}</Typography>
      </Box>
    );
  }

  const row = user.data;
  const isSelf = session?.user?.id === row.id;
  const canToggle = !row.deleted && !row.isAdmin && !isSelf;

  return (
    <Box sx={{ px: { xs: 2, md: 3 }, py: { xs: 2, md: 3 } }}>
      <Button component={LocaleLink} href="/admin/users" sx={{ mb: 2 }}>
        {t("admin.backToUsers")}
      </Button>

      {notice ? (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setNotice(null)}>
          {notice}
        </Alert>
      ) : null}
      {error ? (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      ) : null}

      <Paper variant="outlined" sx={{ p: { xs: 2, md: 3 }, mb: 3 }}>
        <Stack direction={{ xs: "column", sm: "row" }} spacing={2.5} alignItems={{ sm: "flex-start" }}>
          <Avatar
            src={row.avatarUrl ?? undefined}
            alt=""
            sx={{ width: 72, height: 72, bgcolor: "primary.main", fontWeight: 800, fontSize: 28 }}
          >
            {initialFromEmail(row.email)}
          </Avatar>
          <Box sx={{ minWidth: 0, flex: 1 }}>
            <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap sx={{ mb: 1 }}>
              <Typography component="h1" variant="h4" fontWeight={800} sx={{ wordBreak: "break-all" }}>
                {row.email}
              </Typography>
              {row.deleted ? (
                <Chip label={t("admin.deleted")} color="error" size="small" />
              ) : row.disabled ? (
                <Chip label={t("admin.inactive")} color="warning" size="small" />
              ) : (
                <Chip label={t("admin.active")} color="success" size="small" variant="outlined" />
              )}
              <Chip
                label={row.verified ? t("admin.verified") : t("admin.unverified")}
                size="small"
                variant="outlined"
              />
            </Stack>
            <Typography color="text.secondary">
              {t("admin.created")} {formatWhen(row.createdAt, locale, t("admin.never"))} · {t("admin.lastLogin")}{" "}
              {formatWhen(row.lastLoginAt, locale, t("admin.never"))}
            </Typography>
          </Box>
          {canToggle ? (
            <Button
              color={row.disabled ? "primary" : "error"}
              variant={row.disabled ? "contained" : "outlined"}
              onClick={() => setConfirm(row.disabled ? "activate" : "deactivate")}
              sx={{ flexShrink: 0 }}
            >
              {row.disabled ? t("admin.activate") : t("admin.deactivate")}
            </Button>
          ) : null}
        </Stack>
      </Paper>

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
      <Stack spacing={1.5} sx={{ mb: 4 }}>
        {row.qrs.map((qr) => (
          <Paper key={qr.id} variant="outlined" sx={{ p: 2 }}>
            <Stack direction="row" spacing={2} alignItems="flex-start">
              <Box
                component="img"
                src={qr.imageUrl}
                alt=""
                sx={{ width: 72, height: 72, borderRadius: 1, bgcolor: "#fff", flexShrink: 0 }}
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

      <Typography fontWeight={800} sx={{ mb: 2 }}>
        {t("admin.userDonates")}
      </Typography>
      <Paper variant="outlined">
        {row.donates.length ? (
          <Table
            sx={{
              "& .MuiTableCell-root": { py: 1.75, px: 2.5 },
              "& .MuiTableCell-head": { fontWeight: 700, bgcolor: "grey.50" },
            }}
          >
            <TableHead>
              <TableRow>
                <TableCell>{t("admin.time")}</TableCell>
                <TableCell>{t("admin.path")}</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {row.donates.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>{formatWhen(item.createdAt, locale, t("admin.never"))}</TableCell>
                  <TableCell sx={{ wordBreak: "break-all" }}>{item.path || "—"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <Typography color="text.secondary" sx={{ p: 2.5 }}>
            {t("admin.emptyUserDonates")}
          </Typography>
        )}
      </Paper>

      <Dialog open={Boolean(confirm)} onClose={() => setConfirm(null)}>
        <DialogTitle>{confirm === "activate" ? t("admin.activateTitle") : t("admin.deactivateTitle")}</DialogTitle>
        <DialogContent>
          <DialogContentText>
            {confirm === "activate" ? t("admin.activateBody") : t("admin.deactivateBody")}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirm(null)}>{t("dashboard.cancel")}</Button>
          <Button
            color={confirm === "activate" ? "primary" : "error"}
            variant="contained"
            disabled={status.isPending}
            onClick={() => status.mutate(confirm === "activate")}
          >
            {confirm === "activate" ? t("admin.activate") : t("admin.deactivate")}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
