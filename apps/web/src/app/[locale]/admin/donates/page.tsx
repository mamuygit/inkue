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
import Typography from "@mui/material/Typography";
import { useQuery } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import { useMemo, useState } from "react";
import { DateRangeFilter } from "@/components/DateRangeFilter";
import { LocaleLink } from "@/components/LocaleLink";
import { useI18n } from "@/i18n/LocaleProvider";
import { formatWhen } from "@/lib/admin-format";
import { apiFetch } from "@/lib/api";
import { rangeFromPreset, statsQuery } from "@/lib/date-range";

type DonateRow = {
  id: string;
  createdAt: string;
  path: string | null;
  userId: string | null;
  email: string | null;
};

type DonateList = {
  page: number;
  limit: number;
  total: number;
  items: DonateRow[];
};

export default function AdminDonatesPage() {
  const { t, locale } = useI18n();
  const { data: session } = useSession();
  const token = session?.accessToken;
  const initial = useMemo(() => rangeFromPreset(14), []);
  const [from, setFrom] = useState(initial.from);
  const [to, setTo] = useState(initial.to);
  const [page, setPage] = useState(0);
  const [limit, setLimit] = useState(20);

  const list = useQuery({
    queryKey: ["admin-donates", from, to, page, limit],
    enabled: Boolean(token),
    queryFn: () =>
      apiFetch<DonateList>(`/admin/donates?${statsQuery(from, to)}&page=${page + 1}&limit=${limit}`, { token }),
  });

  return (
    <Container maxWidth="lg" sx={{ py: { xs: 2, md: 4 } }}>
      <Typography component="h1" variant="h4" fontWeight={800} sx={{ mb: 3 }}>
        {t("admin.donates")}
      </Typography>
      <Paper variant="outlined" sx={{ p: 2, mb: 3 }}>
        <DateRangeFilter
          from={from}
          to={to}
          onChange={(next) => {
            setFrom(next.from);
            setTo(next.to);
            setPage(0);
          }}
        />
      </Paper>
      <Paper variant="outlined">
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>{t("admin.time")}</TableCell>
                <TableCell>{t("admin.email")}</TableCell>
                <TableCell>{t("admin.path")}</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {(list.data?.items ?? []).map((row) => (
                <TableRow key={row.id} hover>
                  <TableCell>{formatWhen(row.createdAt, locale, t("admin.never"))}</TableCell>
                  <TableCell>
                    {row.userId && row.email ? (
                      <Box
                        component={LocaleLink}
                        href={`/admin/users/${row.userId}`}
                        sx={{ color: "primary.main", textDecoration: "none" }}
                      >
                        {row.email}
                      </Box>
                    ) : (
                      t("stats.anonymous")
                    )}
                  </TableCell>
                  <TableCell sx={{ wordBreak: "break-all" }}>{row.path || "—"}</TableCell>
                </TableRow>
              ))}
              {!list.isLoading && !(list.data?.items.length ?? 0) ? (
                <TableRow>
                  <TableCell colSpan={3}>
                    <Typography color="text.secondary">{t("admin.emptyDonates")}</Typography>
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
