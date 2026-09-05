"use client";

import Stack from "@mui/material/Stack";
import ToggleButton from "@mui/material/ToggleButton";
import ToggleButtonGroup from "@mui/material/ToggleButtonGroup";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import dayjs, { type Dayjs } from "dayjs";
import "dayjs/locale/th";
import { RANGE_PRESETS, matchingPreset, rangeFromPreset, type RangePreset } from "@/lib/date-range";
import { useI18n } from "@/i18n/LocaleProvider";

type Props = {
  from: string;
  to: string;
  onChange: (next: { from: string; to: string }) => void;
};

const PRESET_KEYS = {
  7: "dashboard.days7",
  14: "dashboard.days14",
  30: "dashboard.days30",
  90: "dashboard.days90",
} as const;

const pickerField = {
  size: "small" as const,
  hiddenLabel: false,
  sx: { width: { xs: "100%", sm: 172 } },
};

function toDay(value: string) {
  const parsed = dayjs(value);
  return parsed.isValid() ? parsed : null;
}

export function DateRangeFilter({ from, to, onChange }: Props) {
  const { t, locale } = useI18n();
  const preset = matchingPreset(from, to);
  const fromDate = toDay(from);
  const toDate = toDay(to);

  const applyPreset = (_: unknown, value: RangePreset | null) => {
    if (!value || value === "custom") return;
    onChange(rangeFromPreset(value));
  };

  const applyFrom = (value: Dayjs | null) => {
    if (!value?.isValid()) return;
    const nextFrom = value.format("YYYY-MM-DD");
    onChange({ from: nextFrom, to: nextFrom > to ? nextFrom : to });
  };

  const applyTo = (value: Dayjs | null) => {
    if (!value?.isValid()) return;
    const nextTo = value.format("YYYY-MM-DD");
    onChange({ from: nextTo < from ? nextTo : from, to: nextTo });
  };

  return (
    <LocalizationProvider
      dateAdapter={AdapterDayjs}
      adapterLocale={locale === "th" ? "th" : "en"}
      localeText={{
        clearButtonLabel: t("dashboard.clearDate"),
        todayButtonLabel: t("dashboard.today"),
        cancelButtonLabel: t("editor.cancel"),
        okButtonLabel: t("dashboard.ok"),
      }}
    >
      <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5} alignItems={{ sm: "center" }} flexWrap="wrap">
        <ToggleButtonGroup exclusive size="small" value={preset === "custom" ? null : preset} onChange={applyPreset}>
          {RANGE_PRESETS.map((days) => (
            <ToggleButton key={days} value={days}>
              {t(PRESET_KEYS[days])}
            </ToggleButton>
          ))}
        </ToggleButtonGroup>
        <Stack direction="row" spacing={1.5} alignItems="center" sx={{ width: { xs: "100%", sm: "auto" } }}>
          <DatePicker
            label={t("dashboard.from")}
            value={fromDate}
            format="DD/MM/YYYY"
            maxDate={toDate ?? undefined}
            onChange={applyFrom}
            slotProps={{
              textField: pickerField,
              actionBar: { actions: ["clear", "today"] },
            }}
          />
          <DatePicker
            label={t("dashboard.to")}
            value={toDate}
            format="DD/MM/YYYY"
            minDate={fromDate ?? undefined}
            onChange={applyTo}
            slotProps={{
              textField: pickerField,
              actionBar: { actions: ["clear", "today"] },
            }}
          />
        </Stack>
      </Stack>
    </LocalizationProvider>
  );
}
