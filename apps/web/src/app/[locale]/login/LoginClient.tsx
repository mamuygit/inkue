"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Container from "@mui/material/Container";
import Paper from "@mui/material/Paper";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { loginSchema } from "@mamuy/shared";
import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { FormField } from "@/components/FormField";
import { LocaleLink } from "@/components/LocaleLink";
import { PasswordField } from "@/components/PasswordField";
import { ApiError, apiFetch } from "@/lib/api";
import { signInWithAccessToken } from "@/lib/session";
import { translateApiError, translateMessage } from "@/i18n/errors";
import { useI18n } from "@/i18n/LocaleProvider";
import { localizedPath } from "@/i18n/path";

export function LoginClient({ callbackUrl: callbackFromQuery }: { callbackUrl?: string }) {
  const { t, locale } = useI18n();
  const router = useRouter();
  const callbackUrl = callbackFromQuery || localizedPath("/dashboard", locale);
  const [banner, setBanner] = useState<{ type: "error" | "info"; text: string } | null>(null);
  const dateLocale = locale === "th" ? "th-TH" : "en-US";
  const registerHref = `/register?callbackUrl=${encodeURIComponent(callbackUrl)}`;

  const form = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  const login = useMutation({
    mutationFn: async (payload: { email: string; password: string }) => {
      const data = await apiFetch<{ accessToken: string }>("/auth/login", {
        method: "POST",
        body: JSON.stringify(payload),
      });
      await signInWithAccessToken(data.accessToken);
    },
    onSuccess: () => {
      router.refresh();
      router.push(callbackUrl);
    },
    onError: (err) => {
      if (err instanceof ApiError) {
        const message = translateApiError(t, err);
        if (err.unlockAt) {
          const when = new Date(err.unlockAt).toLocaleString(dateLocale, { timeZone: "Asia/Bangkok" });
          setBanner({ type: "error", text: t("login.availableAgain", { message, when }) });
          return;
        }
        setBanner({ type: "error", text: message });
        return;
      }
      setBanner({ type: "error", text: t("login.sessionFailed") });
    },
  });

  return (
    <Container maxWidth="sm" sx={{ py: { xs: 6, md: 10 } }}>
      <Paper sx={{ p: { xs: 3, md: 5 } }} elevation={0} variant="outlined">
        <Typography component="h1" variant="h4" fontWeight={800}>
          {t("login.heading")}
        </Typography>
        <Typography color="text.secondary" sx={{ mt: 1, mb: 3 }}>
          {t("login.sub")}
        </Typography>
        {banner ? (
          <Alert severity={banner.type} sx={{ mb: 2 }}>
            {banner.text}
          </Alert>
        ) : null}

        <Box component="form" onSubmit={form.handleSubmit((v) => login.mutate(v))}>
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
            label={t("login.password")}
            htmlFor="password"
            error={translateMessage(t, form.formState.errors.password?.message)}
          >
            <PasswordField
              id="password"
              autoComplete="current-password"
              error={Boolean(form.formState.errors.password)}
              {...form.register("password")}
            />
          </FormField>
          <Box sx={{ display: "flex", justifyContent: "flex-end", mb: 2 }}>
            <Box
              component={LocaleLink}
              href="/forgot-password"
              sx={{ fontWeight: 700, color: "primary.main", textDecoration: "none", fontSize: 14 }}
            >
              {t("login.forgotPassword")}
            </Box>
          </Box>
          <Button type="submit" variant="contained" fullWidth disabled={login.isPending}>
            {t("login.submit")}
          </Button>
        </Box>

        <Typography color="text.secondary" textAlign="center" sx={{ mt: 3 }}>
          {t("login.noAccount")}{" "}
          <Box
            component={LocaleLink}
            href={registerHref}
            sx={{ fontWeight: 700, color: "primary.main", textDecoration: "none" }}
          >
            {t("login.createAccount")}
          </Box>
        </Typography>
      </Paper>
    </Container>
  );
}

