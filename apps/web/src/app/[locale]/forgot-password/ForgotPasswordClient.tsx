"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Container from "@mui/material/Container";
import Paper from "@mui/material/Paper";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { OTP, passwordResetRequestSchema, passwordResetSchema } from "@mamuy/shared";
import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { FormField } from "@/components/FormField";
import { LocaleLink } from "@/components/LocaleLink";
import { PasswordField } from "@/components/PasswordField";
import { ApiError, apiFetch } from "@/lib/api";
import { signInWithAccessToken } from "@/lib/session";
import { translateApiError, translateMessage } from "@/i18n/errors";
import { useI18n } from "@/i18n/LocaleProvider";
import { localizedPath } from "@/i18n/path";

const requestFormSchema = passwordResetRequestSchema.pick({ email: true });
const resetFormSchema = passwordResetSchema
  .pick({ password: true })
  .extend({
    confirmPassword: z.string().min(1, "Please confirm your password"),
  })
  .refine((v) => v.password === v.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export function ForgotPasswordClient({ email: emailFromQuery, token }: { email?: string; token?: string }) {
  const { t, locale } = useI18n();
  const router = useRouter();
  const hasLink = Boolean(emailFromQuery && token && token.length >= 32);
  const [sentTo, setSentTo] = useState<string | null>(null);
  const [cooldown, setCooldown] = useState(0);
  const [banner, setBanner] = useState<{ type: "error" | "info"; text: string } | null>(
    emailFromQuery && !hasLink ? { type: "error", text: t("forgot.invalidLink") } : null,
  );
  const dateLocale = locale === "th" ? "th-TH" : "en-US";

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [cooldown]);

  const requestForm = useForm({
    resolver: zodResolver(requestFormSchema),
    defaultValues: { email: emailFromQuery ?? "" },
  });

  const resetForm = useForm({
    resolver: zodResolver(resetFormSchema),
    defaultValues: { password: "", confirmPassword: "" },
  });

  const showApiError = (err: unknown, fallback: string) => {
    if (err instanceof ApiError) {
      const message = translateApiError(t, err) ?? fallback;
      if (err.unlockAt) {
        const when = new Date(err.unlockAt).toLocaleString(dateLocale, { timeZone: "Asia/Bangkok" });
        setBanner({ type: "error", text: t("login.availableAgain", { message, when }) });
        return;
      }
      if (err.retryAfterSec) setCooldown(err.retryAfterSec);
      setBanner({ type: "error", text: message });
      return;
    }
    setBanner({ type: "error", text: fallback });
  };

  const requestReset = useMutation({
    mutationFn: (payload: { email: string }) =>
      apiFetch<{ ok: boolean }>("/auth/password/request", {
        method: "POST",
        body: JSON.stringify({ email: payload.email, locale }),
      }),
    onSuccess: (_data, vars) => {
      setSentTo(vars.email);
      setCooldown(OTP.resendCooldownSec);
      setBanner({ type: "info", text: t("forgot.sent", { email: vars.email }) });
    },
    onError: (err) => showApiError(err, t("login.sendFailed")),
  });

  const resetPassword = useMutation({
    mutationFn: async (password: string) => {
      const data = await apiFetch<{ accessToken: string }>("/auth/password/reset", {
        method: "POST",
        body: JSON.stringify({ email: emailFromQuery, token, password }),
      });
      await signInWithAccessToken(data.accessToken);
    },
    onSuccess: () => {
      router.refresh();
      router.push(localizedPath("/dashboard", locale));
    },
    onError: (err) => showApiError(err, t("errors.resetInvalid")),
  });

  return (
    <Container maxWidth="sm" sx={{ py: { xs: 6, md: 10 } }}>
      <Paper sx={{ p: { xs: 3, md: 5 } }} elevation={0} variant="outlined">
        <Typography component="h1" variant="h4" fontWeight={800}>
          {hasLink ? t("forgot.resetHeading") : t("forgot.heading")}
        </Typography>
        <Typography color="text.secondary" sx={{ mt: 1, mb: 3 }}>
          {hasLink ? t("forgot.resetSub", { email: emailFromQuery ?? "" }) : t("forgot.sub")}
        </Typography>
        {banner ? (
          <Alert severity={banner.type} sx={{ mb: 2 }}>
            {banner.text}
          </Alert>
        ) : null}

        {hasLink ? (
          <Box component="form" onSubmit={resetForm.handleSubmit((v) => resetPassword.mutate(v.password))}>
            <FormField
              label={t("register.password")}
              htmlFor="password"
              error={translateMessage(t, resetForm.formState.errors.password?.message)}
            >
              <PasswordField
                id="password"
                autoComplete="new-password"
                error={Boolean(resetForm.formState.errors.password)}
                {...resetForm.register("password")}
              />
            </FormField>
            <FormField
              label={t("register.confirmPassword")}
              htmlFor="confirmPassword"
              error={translateMessage(t, resetForm.formState.errors.confirmPassword?.message)}
            >
              <PasswordField
                id="confirmPassword"
                autoComplete="new-password"
                error={Boolean(resetForm.formState.errors.confirmPassword)}
                {...resetForm.register("confirmPassword")}
              />
            </FormField>
            <Button type="submit" variant="contained" fullWidth disabled={resetPassword.isPending}>
              {t("forgot.reset")}
            </Button>
          </Box>
        ) : (
          <Box component="form" onSubmit={requestForm.handleSubmit((v) => requestReset.mutate(v))}>
            <FormField
              label={t("login.email")}
              htmlFor="email"
              error={translateMessage(t, requestForm.formState.errors.email?.message)}
            >
              <TextField
                id="email"
                type="email"
                autoComplete="email"
                placeholder="you@example.com"
                error={Boolean(requestForm.formState.errors.email)}
                {...requestForm.register("email")}
              />
            </FormField>
            <Button type="submit" variant="contained" fullWidth disabled={requestReset.isPending}>
              {t("forgot.submit")}
            </Button>
            {sentTo ? (
              <Button
                fullWidth
                sx={{ mt: 1.5 }}
                disabled={cooldown > 0 || requestReset.isPending}
                onClick={() => requestReset.mutate({ email: sentTo })}
              >
                {cooldown > 0 ? t("login.resendIn", { seconds: cooldown }) : t("forgot.resend")}
              </Button>
            ) : null}
          </Box>
        )}

        <Typography color="text.secondary" textAlign="center" sx={{ mt: 3 }}>
          <Box
            component={LocaleLink}
            href="/login"
            sx={{ fontWeight: 700, color: "primary.main", textDecoration: "none" }}
          >
            {t("forgot.backToSignIn")}
          </Box>
        </Typography>
      </Paper>
    </Container>
  );
}
