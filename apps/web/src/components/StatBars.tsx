"use client";

import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";

export type StatBarRow = { label: string; count: number };

export function StatBars({
  rows,
  color,
  emptyText,
}: {
  rows: StatBarRow[];
  color: string;
  emptyText: string;
}) {
  const max = Math.max(1, ...rows.map((row) => row.count));

  if (!rows.length) {
    return (
      <Typography color="text.secondary" sx={{ px: 1, py: 3 }}>
        {emptyText}
      </Typography>
    );
  }

  return (
    <Stack spacing={1.75} sx={{ px: 1, py: 1.5 }}>
      {rows.map((row, index) => (
        <Box key={`${row.label}-${index}`} sx={{ minWidth: 0 }}>
          <Stack direction="row" spacing={1.5} alignItems="baseline" sx={{ mb: 0.75 }}>
            <Typography variant="body2" noWrap title={row.label} sx={{ flex: 1, minWidth: 0 }}>
              {row.label}
            </Typography>
            <Typography variant="body2" fontWeight={700} color="text.secondary">
              {row.count}
            </Typography>
          </Stack>
          <Box
            sx={{
              height: 7,
              bgcolor: "rgba(15, 23, 42, 0.06)",
              borderRadius: 999,
              overflow: "hidden",
            }}
          >
            <Box
              sx={{
                width: `${(row.count / max) * 100}%`,
                height: "100%",
                bgcolor: color,
                borderRadius: 999,
                minWidth: row.count > 0 ? 7 : 0,
                opacity: 0.88,
              }}
            />
          </Box>
        </Box>
      ))}
    </Stack>
  );
}
