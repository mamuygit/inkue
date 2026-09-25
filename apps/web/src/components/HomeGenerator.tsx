"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import DownloadIcon from "@mui/icons-material/Download";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { GUEST_QR, guestQrCreateSchema, type GuestQrCreateInput } from "@mamuy/shared";
import { useMutation } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { ApiError, apiFetch, getApiUrl } from "@/lib/api";
import { getGuestToken, setGuestToken } from "@/lib/guest";
import { translateApiError, translateMessage } from "@/i18n/errors";
import { useI18n } from "@/i18n/LocaleProvider";
import { localizedPath } from "@/i18n/path";
import { FormField } from "./FormField";
import { LocaleLink } from "./LocaleLink";

type GuestQrResponse = {
  guestToken: string;
  hash: string;
  scanUrl: string;
  imageDataUrl: string;
  remaining: number;
};

type Result =
  | { kind: "saved"; src: string; fileName: string; scanUrl: string; remaining: number }
  | { kind: "static"; src: string; fileName: string };

async function fetchStaticQr(body: GuestQrCreateInput) {
  const res = await fetch(`${getApiUrl()}/guest/qr/static`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: res.statusText }));
    throw new ApiError(err, res.status);
  }
  return URL.createObjectURL(await res.blob());
}

export function HomeGenerator() {
  const { t, locale } = useI18n();
  const { data: session } = useSession();
  const [result, setResult] = useState<Result | null>(null);
  const [error, setError] = useState<string | null>(null);

  const { control, handleSubmit, formState } = useForm<GuestQrCreateInput>({
    resolver: zodResolver(guestQrCreateSchema),
    defaultValues: { destinationUrl: "", qrColor: "#0F172A", bgColor: "#FFFFFF" },
  });

  useEffect(() => {
    if (result?.kind !== "static") return;
    return () => URL.revokeObjectURL(result.src);
  }, [result]);

  const generate = useMutation({
    mutationFn: async (body: GuestQrCreateInput): Promise<Result> => {
      const guestToken = getGuestToken();
      try {
        const data = await apiFetch<GuestQrResponse>("/guest/qr", {
          method: "POST",
          headers: guestToken ? { [GUEST_QR.tokenHeader]: guestToken } : undefined,
          body: JSON.stringify(body),
        });
        setGuestToken(data.guestToken);
        return {
          kind: "saved",
          src: data.imageDataUrl,
          fileName: `inkue-${data.hash}.png`,
          scanUrl: data.scanUrl,
          remaining: data.remaining,
        };
      } catch (err) {
        if (!(err instanceof ApiError) || err.code !== "GUEST_LIMIT") throw err;
        return { kind: "static", src: await fetchStaticQr(body), fileName: "inkue-qr.png" };
      }
    },
    onMutate: () => setError(null),
    onSuccess: setResult,
    onError: (err) => {
      setError(err instanceof ApiError ? translateApiError(t, err) : t("home.genFailed"));
    },
  });

  const registerHref = `/register?callbackUrl=${encodeURIComponent(localizedPath("/dashboard/qr", locale))}`;

  if (session?.user) {
    return (
      <Box sx={{ textAlign: "center", mt: 4 }}>
        <Button component={LocaleLink} href="/dashboard/qr/create" prefetch={false} variant="contained" size="large">
          {t("home.ctaCreate")}
        </Button>
      </Box>
    );
  }

  return (
    <Paper
      variant="outlined"
      sx={{
        mt: 4,
        p: { xs: 2.5, md: 3.5 },
        textAlign: "left",
        display: "flex",
        flexDirection: { xs: "column", sm: "row" },
        gap: { xs: 3, md: 4 },
        alignItems: { sm: "center" },
        boxShadow: "0 12px 40px rgba(37, 99, 235, 0.10)",
      }}
    >
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography component="h2" variant="h6" fontWeight={800} sx={{ mb: 2 }}>
          {t("home.genTitle")}
        </Typography>
        {error ? (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        ) : null}

        {result ? (
          <Stack spacing={1.5}>
            <Alert severity={result.kind === "saved" ? "success" : "warning"}>
              {result.kind === "saved"
                ? t("home.genSavedNote", { remaining: result.remaining })
                : t("home.genStaticNote")}
            </Alert>
            {result.kind === "saved" ? (
              <Typography variant="body2" color="text.secondary" sx={{ wordBreak: "break-all" }}>
                {result.scanUrl}
              </Typography>
            ) : null}
            <Stack direction="row" spacing={1.5} flexWrap="wrap" useFlexGap>
              <Button
                component="a"
                href={result.src}
                download={result.fileName}
                variant="contained"
                startIcon={<DownloadIcon />}
              >
                {t("home.genDownload")}
              </Button>
              <Button component={LocaleLink} href={registerHref} variant="outlined">
                {t("home.genSignUp")}
              </Button>
              <Button color="inherit" onClick={() => setResult(null)}>
                {t("home.genAnother")}
              </Button>
            </Stack>
          </Stack>
        ) : (
          <Box component="form" onSubmit={handleSubmit((v) => generate.mutate(v))}>
            <Controller
              name="destinationUrl"
              control={control}
              render={({ field }) => (
                <FormField
                  label={t("home.genUrl")}
                  htmlFor="guestDestinationUrl"
                  error={translateMessage(t, formState.errors.destinationUrl?.message)}
                >
                  <TextField
                    {...field}
                    id="guestDestinationUrl"
                    placeholder="www.example.com"
                    autoComplete="url"
                    error={Boolean(formState.errors.destinationUrl)}
                  />
                </FormField>
              )}
            />
            <Stack direction="row" spacing={2}>
              {(["qrColor", "bgColor"] as const).map((name) => (
                <Box key={name} sx={{ flex: 1 }}>
                  <Controller
                    name={name}
                    control={control}
                    render={({ field }) => (
                      <FormField
                        label={name === "qrColor" ? t("home.genQrColor") : t("home.genBgColor")}
                        htmlFor={`guest-${name}`}
                      >
                        <TextField
                          id={`guest-${name}`}
                          type="color"
                          value={field.value}
                          onChange={field.onChange}
                          inputProps={{ style: { height: 44, padding: 4, cursor: "pointer" } }}
                        />
                      </FormField>
                    )}
                  />
                </Box>
              ))}
            </Stack>
            <Box
              component={LocaleLink}
              href={registerHref}
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 1.5,
                mb: 2.5,
                px: 2,
                py: 1.25,
                borderRadius: 2,
                border: "1.5px dashed",
                borderColor: "divider",
                color: "text.secondary",
                textDecoration: "none",
                "&:hover": { borderColor: "primary.main", color: "primary.main" },
              }}
            >
              <LockOutlinedIcon fontSize="small" />
              <Typography variant="body2" sx={{ flex: 1 }}>
                {t("home.genLogoLocked")}
              </Typography>
              <Typography variant="body2" fontWeight={700} color="primary.main" sx={{ whiteSpace: "nowrap" }}>
                {t("home.genLogoSignUp")}
              </Typography>
            </Box>
            <Button type="submit" variant="contained" size="large" fullWidth disabled={generate.isPending}>
              {t("home.genSubmit")}
            </Button>
            <Typography variant="body2" color="text.secondary" textAlign="center" sx={{ mt: 1.5 }}>
              <Box component={LocaleLink} href="/faq" sx={{ color: "primary.main", fontWeight: 600 }}>
                {t("home.ctaHow")}
              </Box>
            </Typography>
          </Box>
        )}
      </Box>

      <Box sx={{ width: { xs: "100%", sm: 220, md: 260 }, flexShrink: 0, textAlign: "center" }}>
        <Box
          component="img"
          src={result?.src ?? "/features/logo.webp"}
          alt={result ? t("home.genPreviewAlt") : t("home.genSampleAlt")}
          sx={{
            width: "100%",
            maxWidth: 260,
            aspectRatio: "1 / 1",
            objectFit: "contain",
            borderRadius: 3,
            display: "block",
            mx: "auto",
            bgcolor: "#fff",
            opacity: result ? 1 : 0.9,
          }}
        />
        {result ? null : (
          <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 1 }}>
            {t("home.genSample")}
          </Typography>
        )}
      </Box>
    </Paper>
  );
}
