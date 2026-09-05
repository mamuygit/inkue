"use client";

import Box from "@mui/material/Box";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";

import { useI18n } from "@/i18n/LocaleProvider";

function padCount(n: number) {
  const raw = Math.max(0, Math.floor(n)).toString();
  const width = Math.max(7, raw.length);
  return raw.padStart(width, "0");
}

export function Odometer({ value }: { value: number }) {
  const { t, locale } = useI18n();
  const digits = padCount(value).split("");
  const dateLocale = locale === "th" ? "th-TH" : "en-US";
  return (
    <Stack
      direction="row"
      spacing={0.75}
      justifyContent="center"
      role="img"
      aria-label={t("home.odometerAria", { count: value.toLocaleString(dateLocale) })}
    >
      {digits.map((d, i) => (
        <Paper
          key={`${i}-${digits.length}`}
          elevation={0}
          sx={{
            width: { xs: 36, sm: 48 },
            height: { xs: 52, sm: 68 },
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            bgcolor: "primary.dark",
            color: "#fff",
            borderRadius: 1.5,
          }}
        >
          <Typography component="span" sx={{ fontWeight: 800, fontSize: { xs: 24, sm: 32 }, fontVariantNumeric: "tabular-nums" }}>
            {d}
          </Typography>
        </Paper>
      ))}
    </Stack>
  );
}

export function OdometerCaption({ children }: { children: string }) {
  return (
    <Box sx={{ mt: 1.5 }}>
      <Typography color="text.secondary" textAlign="center">
        {children}
      </Typography>
    </Box>
  );
}
