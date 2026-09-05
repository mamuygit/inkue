"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Container from "@mui/material/Container";
import Paper from "@mui/material/Paper";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { OTP, registerSchema, otpVerifySchema } from "@mamuy/shared";
import { useMutation } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { FormField } from "@/components/FormField";
import { LocaleLink } from "@/components/LocaleLink";
import { PasswordField } from "@/components/PasswordField";
import { ApiError, apiFetch } from "@/lib/api";
import { safeCallbackUrl } from "@/lib/callback-url";
import { navigateAfterAuth, signInWithAccessToken } from "@/lib/session";
import { translateApiError, translateMessage } from "@/i18n/errors";
import { useI18n } from "@/i18n/LocaleProvider";
import { localizedPath } from "@/i18n/path";

const registerFormSchema = registerSchema
  .extend({
    confirmPassword: z.string().min(1, "Please confirm your password"),
  })
  .refine((v) => v.password === v.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

function RegisterForm({ callbackUrl: callbackFromQuery }: { callbackUrl?: string }) {
  const { t, locale } = useI18n();
  const callbackUrl = safeCallbackUrl(callbackFromQuery, localizedPath("/dashboard", locale));
  const [step, setStep] = useState<"form" | "otp">("form");
  const [email, setEmail] = useState("");
  const [cooldown, setCooldown] = useState(0);
  const [banner, setBanner] = useState<{ type: "error" | "info"; text: string } | null>(null);
  const dateLocale = locale === "th" ? "th-TH" : "en-US";
  const loginHref = `/login?callbackUrl=${encodeURIComponent(callbackUrl)}`;

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [cooldown]);

  const form = useForm({
    resolver: zodResolver(registerFormSchema),
    defaultValues: { email: "", password: "", confirmPassword: "" },
  });

  const otpForm = useForm({
    resolver: zodResolver(otpVerifySchema.pick({ otp: true })),
    defaultValues: { otp: "" },
  });

  const showApiError = (err: unknown, fallback: string) => {
    if (err instanceof ApiError) {
      const message = translateApiError(t, err);
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

  const register = useMutation({
    mutationFn: (payload: { email: string; password: string }) =>
      apiFetch<{ remaining: number }>("/auth/register", {
        method: "POST",
        body: JSON.stringify(payload),
      }),
    onSuccess: (_data, vars) => {
      setEmail(vars.email);
      setStep("otp");
      setCooldown(OTP.resendCooldownSec);
      setBanner({ type: "info", text: t("register.sent", { email: vars.email }) });
      otpForm.reset({ otp: "" });
    },
    onError: (err) => showApiError(err, t("login.sendFailed")),
  });

  const requestOtp = useMutation({
    mutationFn: (payload: { email: string }) =>
      apiFetch<{ remaining: number }>("/auth/otp/request", {
        method: "POST",
        body: JSON.stringify(payload),
      }),
    onSuccess: () => {
      setCooldown(OTP.resendCooldownSec);
      setBanner({ type: "info", text: t("register.sent", { email }) });
    },
    onError: (err) => showApiError(err, t("login.sendFailed")),
  });

  const verifyOtp = useMutation({
    mutationFn: async (otp: string) => {
      const data = await apiFetch<{ accessToken: string }>("/auth/otp/verify", {
        method: "POST",
        body: JSON.stringify({ email, otp }),
      });
      await signInWithAccessToken(data.accessToken);
    },
    onSuccess: () => {
      navigateAfterAuth(callbackUrl);
    },
    onError: (err) => showApiError(err, t("login.invalidCode")),
  });

  return (
    <Container maxWidth="sm" sx={{ py: { xs: 6, md: 10 } }}>
      <Paper sx={{ p: { xs: 3, md: 5 } }} elevation={0} variant="outlined">
        <Typography component="h1" variant="h4" fontWeight={800}>
          {step === "otp" ? t("register.verifyHeading") : t("register.heading")}
        </Typography>
        <Typography color="text.secondary" sx={{ mt: 1, mb: 3 }}>
          {step === "otp" ? t("register.verifySub", { email }) : t("register.sub")}
        </Typography>
        {banner ? (
          <Alert severity={banner.type} sx={{ mb: 2 }}>
            {banner.text}
          </Alert>
        ) : null}

        {step === "form" ? (
          <Box
            component="form"
            onSubmit={form.handleSubmit((v) =>
              register.mutate({ email: v.email, password: v.password }),
            )}
          >
            <FormField
              label={t("login.email")}
              htmlFor="email"
              error={translateMessage(t, form.formState.errors.email?.message)}
            >
              <TextField
                id="email"
                type="email"
                autoComplete="email"
                placeholder="you@example.com"
                error={Boolean(form.formState.errors.email)}
                {...form.register("email")}
              />
            </FormField>
            <FormField
              label={t("register.password")}
              htmlFor="password"
              error={translateMessage(t, form.formState.errors.password?.message)}
            >
              <PasswordField
                id="password"
                autoComplete="new-password"
                error={Boolean(form.formState.errors.password)}
                {...form.register("password")}
              />
            </FormField>
            <FormField
              label={t("register.confirmPassword")}
              htmlFor="confirmPassword"
              error={translateMessage(t, form.formState.errors.confirmPassword?.message)}
            >
              <PasswordField
                id="confirmPassword"
                autoComplete="new-password"
                error={Boolean(form.formState.errors.confirmPassword)}
                {...form.register("confirmPassword")}
              />
            </FormField>
            <Button type="submit" variant="contained" fullWidth disabled={register.isPending}>
              {t("register.submit")}
            </Button>
          </Box>
        ) : (
          <Box component="form" onSubmit={otpForm.handleSubmit((v) => verifyOtp.mutate(v.otp))}>
            <FormField
              label={t("login.otp")}
              htmlFor="otp"
              error={translateMessage(t, otpForm.formState.errors.otp?.message)}
            >
              <TextField
                id="otp"
                inputMode="numeric"
                autoComplete="one-time-code"
                placeholder="000000"
                inputProps={{ maxLength: 6 }}
                error={Boolean(otpForm.formState.errors.otp)}
                {...otpForm.register("otp")}
              />
            </FormField>
            <Button type="submit" variant="contained" fullWidth disabled={verifyOtp.isPending}>
              {t("register.verify")}
            </Button>
            <Button
              fullWidth
              sx={{ mt: 1.5 }}
              disabled={cooldown > 0 || requestOtp.isPending}
              onClick={() => requestOtp.mutate({ email })}
            >
              {cooldown > 0 ? t("login.resendIn", { seconds: cooldown }) : t("login.resend")}
            </Button>
            <Button fullWidth color="inherit" sx={{ mt: 1 }} onClick={() => setStep("form")}>
              {t("login.otherEmail")}
            </Button>
          </Box>
        )}

        {step === "form" ? (
          <Typography color="text.secondary" textAlign="center" sx={{ mt: 3 }}>
            {t("register.hasAccount")}{" "}
            <Box
              component={LocaleLink}
              href={loginHref}
              sx={{ fontWeight: 700, color: "primary.main", textDecoration: "none" }}
            >
              {t("register.signIn")}
            </Box>
          </Typography>
        ) : null}
      </Paper>
    </Container>
  );
}

export function RegisterClient({ callbackUrl }: { callbackUrl?: string }) {
  return <RegisterForm callbackUrl={callbackUrl} />;
}
