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
  owner: { id: string; email: string };
};

type QrList = { page: number; limit: number; total: number; items: QrRow[] };

export default function AdminQrListPage() {
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
    queryKey: ["admin-qr", debounced, page, limit],
    enabled: Boolean(token),
    queryFn: () => {
      const params = new URLSearchParams({ page: String(page + 1), limit: String(limit) });
      if (debounced) params.set("q", debounced);
      return apiFetch<QrList>(`/admin/qr?${params}`, { token });
    },
  });

  return (
    <Container maxWidth="lg" sx={{ py: { xs: 2, md: 4 } }}>
      <Typography component="h1" variant="h4" fontWeight={800} sx={{ mb: 3 }}>
        {t("admin.allQr")}
      </Typography>
      <TextField
        size="small"
        value={q}
        onChange={(event) => setQ(event.target.value)}
        placeholder={t("admin.searchQr")}
        sx={{ mb: 2, maxWidth: 360, width: "100%" }}
      />
      <Paper variant="outlined">
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell />
                <TableCell>{t("editor.title")}</TableCell>
                <TableCell>{t("admin.owner")}</TableCell>
                <TableCell align="right">{t("admin.scanCount")}</TableCell>
                <TableCell>{t("admin.created")}</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {(list.data?.items ?? []).map((row) => (
                <TableRow key={row.id} hover>
                  <TableCell sx={{ width: 72 }}>
                    <Box
                      component="img"
                      src={row.imageUrl}
                      alt=""
                      sx={{ width: 48, height: 48, borderRadius: 1, bgcolor: "#fff" }}
                    />
                  </TableCell>
                  <TableCell>
                    <Box
                      component={LocaleLink}
                      href={`/admin/qr/${row.id}`}
                      sx={{ color: "inherit", textDecoration: "none", fontWeight: 700, "&:hover": { color: "primary.main" } }}
                    >
                      {shortLabel(row.title, row.destinationUrl)}
                    </Box>
                    <Typography variant="body2" color="text.secondary" sx={{ wordBreak: "break-all" }}>
                      {row.destinationUrl}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Box
                      component={LocaleLink}
                      href={`/admin/users/${row.owner.id}`}
                      sx={{ color: "primary.main", textDecoration: "none" }}
                    >
                      {row.owner.email}
                    </Box>
                  </TableCell>
                  <TableCell align="right">{row.scanCount}</TableCell>
                  <TableCell>{formatWhen(row.createdAt, locale, t("admin.never"))}</TableCell>
                </TableRow>
              ))}
              {!list.isLoading && !(list.data?.items.length ?? 0) ? (
                <TableRow>
                  <TableCell colSpan={5}>
                    <Typography color="text.secondary">{t("admin.emptyQr")}</Typography>
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
