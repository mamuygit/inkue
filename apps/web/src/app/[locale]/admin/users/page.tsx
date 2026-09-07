"use client";

import Box from "@mui/material/Box";
import Container from "@mui/material/Container";
import Paper from "@mui/material/Paper";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TablePagination from "@mui/material/TablePagination";
import TableRow from "@mui/material/TableRow";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { useQuery } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { LocaleLink } from "@/components/LocaleLink";
import { useI18n } from "@/i18n/LocaleProvider";
import { formatWhen } from "@/lib/admin-format";
import { apiFetch } from "@/lib/api";

type UserRow = {
  id: string;
  email: string;
  createdAt: string;
  lastLoginAt: string | null;
  verified: boolean;
  qrCount: number;
  scanCount: number;
  donateCount: number;
};

type UserList = { page: number; limit: number; total: number; items: UserRow[] };

export default function AdminUsersPage() {
  const { t, locale } = useI18n();
  const { data: session } = useSession();
  const token = session?.accessToken;
  const [q, setQ] = useState("");
  const [debounced, setDebounced] = useState("");
  const [page, setPage] = useState(0);
  const [limit, setLimit] = useState(20);

  useEffect(() => {
    const id = window.setTimeout(() => setDebounced(q.trim()), 300);
    return () => window.clearTimeout(id);
  }, [q]);

  useEffect(() => {
    setPage(0);
  }, [debounced]);

  const list = useQuery({
    queryKey: ["admin-users", debounced, page, limit],
    enabled: Boolean(token),
    queryFn: () => {
      const params = new URLSearchParams({ page: String(page + 1), limit: String(limit) });
      if (debounced) params.set("q", debounced);
      return apiFetch<UserList>(`/admin/users?${params}`, { token });
    },
  });

  return (
    <Container maxWidth="lg" sx={{ py: { xs: 2, md: 4 } }}>
      <Typography component="h1" variant="h4" fontWeight={800} sx={{ mb: 3 }}>
        {t("admin.users")}
      </Typography>
      <TextField
        size="small"
        value={q}
        onChange={(event) => setQ(event.target.value)}
        placeholder={t("admin.searchUsers")}
        sx={{ mb: 2, maxWidth: 360, width: "100%" }}
      />
      <Paper variant="outlined">
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>{t("admin.email")}</TableCell>
                <TableCell>{t("admin.created")}</TableCell>
                <TableCell>{t("admin.lastLogin")}</TableCell>
                <TableCell align="right">{t("admin.qrCount")}</TableCell>
                <TableCell align="right">{t("admin.scanCount")}</TableCell>
                <TableCell align="right">{t("admin.donateCount")}</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {(list.data?.items ?? []).map((row) => (
                <TableRow key={row.id} hover>
                  <TableCell>
                    <Box
                      component={LocaleLink}
                      href={`/admin/users/${row.id}`}
                      sx={{ color: "primary.main", textDecoration: "none", fontWeight: 700 }}
                    >
                      {row.email}
                    </Box>
                    <Typography variant="caption" color="text.secondary">
                      {row.verified ? t("admin.verified") : t("admin.unverified")}
                    </Typography>
                  </TableCell>
                  <TableCell>{formatWhen(row.createdAt, locale, t("admin.never"))}</TableCell>
                  <TableCell>{formatWhen(row.lastLoginAt, locale, t("admin.never"))}</TableCell>
                  <TableCell align="right">{row.qrCount}</TableCell>
                  <TableCell align="right">{row.scanCount}</TableCell>
                  <TableCell align="right">{row.donateCount}</TableCell>
                </TableRow>
              ))}
              {!list.isLoading && !(list.data?.items.length ?? 0) ? (
                <TableRow>
                  <TableCell colSpan={6}>
                    <Typography color="text.secondary">{t("admin.emptyUsers")}</Typography>
                  </TableCell>
                </TableRow>
              ) : null}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination
          component="div"
          count={list.data?.total ?? 0}
          page={page}
          onPageChange={(_, next) => setPage(next)}
          rowsPerPage={limit}
          onRowsPerPageChange={(event) => {
            setLimit(Number(event.target.value));
            setPage(0);
          }}
          rowsPerPageOptions={[10, 20, 50]}
        />
      </Paper>
    </Container>
  );
}
