"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import DownloadIcon from "@mui/icons-material/Download";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import CircularProgress from "@mui/material/CircularProgress";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import MenuItem from "@mui/material/MenuItem";
import TextField from "@mui/material/TextField";
import ToggleButton from "@mui/material/ToggleButton";
import ToggleButtonGroup from "@mui/material/ToggleButtonGroup";
import Typography from "@mui/material/Typography";
import { qrCreateSchema, type QrCreateInput } from "@mamuy/shared";
import { keepPreviousData, useMutation, useQuery } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState, type DragEvent } from "react";
import { Controller, useForm } from "react-hook-form";
import { ApiError, apiFetch, getApiUrl } from "@/lib/api";
import { FormField } from "./FormField";
import { translateApiError, translateMessage } from "@/i18n/errors";
import { useI18n } from "@/i18n/LocaleProvider";
import { localizedPath } from "@/i18n/path";

export type QrRecord = {
  id: string;
  hash: string;
  scanUrl: string;
  destinationUrl: string;
  title: string | null;
  qrColor: string;
  bgColor: string;
  logoKey: string | null;
  logoUrl: string | null;
  logoPosition: QrCreateInput["logoPosition"];
  frameShape: QrCreateInput["frameShape"];
  frameBgColor: string;
  imageUrl: string;
  folderId: string | null;
  scanCount: number;
};

export type FolderRecord = {
  id: string;
  name: string;
  sortOrder: number;
  qrCount: number;
};

const UNFILED_FOLDER = "unfiled";

const POSITIONS: QrCreateInput["logoPosition"][] = [
  "center",
  "top_left",
  "top_right",
  "bottom_left",
  "bottom_right",
];

const FRAMES: QrCreateInput["frameShape"][] = ["none", "circle", "rounded_square"];

const LOGO_MAX_BYTES = 2 * 1024 * 1024;
const LOGO_TYPES = new Set([
  "image/png",
  "image/jpeg",
  "image/jpg",
  "image/pjpeg",
  "image/webp",
  "image/svg+xml",
]);
const LOGO_EXT = /\.(png|jpe?g|webp|svg)$/i;

function isAllowedLogo(file: File) {
  return LOGO_TYPES.has(file.type.toLowerCase()) || LOGO_EXT.test(file.name);
}

type FormValues = QrCreateInput;

export function QrEditor({ existing }: { existing?: QrRecord }) {
  const { t, locale } = useI18n();
  const { data: session } = useSession();
  const token = session?.accessToken;
  const router = useRouter();
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(existing?.logoUrl ?? null);
  const [removeLogo, setRemoveLogo] = useState(false);
  const [logoDragging, setLogoDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const logoDragDepth = useRef(0);

  const { control, handleSubmit, watch, formState } = useForm<FormValues>({
    resolver: zodResolver(qrCreateSchema),
    defaultValues: {
      destinationUrl: existing?.destinationUrl ?? "",
      title: existing?.title ?? "",
      qrColor: existing?.qrColor ?? "#0F172A",
      bgColor: existing?.bgColor ?? "#FFFFFF",
      logoPosition: existing?.logoPosition ?? "center",
      frameShape: existing?.frameShape ?? "rounded_square",
      frameBgColor: existing?.frameBgColor ?? "#000000",
      logoKey: existing?.logoKey ?? undefined,
      folderId: existing?.folderId ?? null,
    },
  });

  const folders = useQuery({
    queryKey: ["folders"],
    enabled: Boolean(token),
    queryFn: () => apiFetch<FolderRecord[]>("/folders", { token }),
  });

  const values = watch();
  const hasLogo = Boolean(logoFile || (values.logoKey && !removeLogo));

  const applyLogoFile = (file: File | undefined | null) => {
    if (!file) return;
    if (file.size > LOGO_MAX_BYTES) {
      setError(t("errors.logoSize"));
      return;
    }
    if (!isAllowedLogo(file)) {
      setError(t("errors.logoType"));
      return;
    }
    setError(null);
    setLogoFile(file);
    setRemoveLogo(false);
  };

  const onLogoDragEnter = (e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    logoDragDepth.current += 1;
    if (Array.from(e.dataTransfer.types).includes("Files")) setLogoDragging(true);
  };

  const onLogoDragLeave = (e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    logoDragDepth.current = Math.max(0, logoDragDepth.current - 1);
    if (logoDragDepth.current === 0) setLogoDragging(false);
  };

  const onLogoDragOver = (e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = "copy";
  };

  const onLogoDrop = (e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    logoDragDepth.current = 0;
    setLogoDragging(false);
    applyLogoFile(e.dataTransfer.files[0] ?? null);
  };

  useEffect(() => {
    if (!logoFile) return;
    const url = URL.createObjectURL(logoFile);
    setLogoPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [logoFile]);

  const previewKey = useMemo(
    () =>
      JSON.stringify({
        ...values,
        removeLogo,
        file: logoFile ? `${logoFile.name}-${logoFile.size}` : null,
      }),
    [values, removeLogo, logoFile],
  );

  const previewQuery = useQuery({
    queryKey: ["qr-preview", previewKey],
    enabled: Boolean(token),
    queryFn: async () => {
      const payload: Record<string, unknown> = {
        destinationUrl: values.destinationUrl || "https://qr.mamuy.dev",
        title: values.title,
        qrColor: values.qrColor,
        bgColor: values.bgColor,
        logoPosition: values.logoPosition,
        frameShape: values.frameShape,
        frameBgColor: values.frameBgColor,
      };
      if (!removeLogo && values.logoKey && !logoFile) payload.logoKey = values.logoKey;
      const fd = new FormData();
      fd.append("payload", JSON.stringify(payload));
      if (logoFile) fd.append("file", logoFile);
      const res = await fetch(`${getApiUrl()}/qr/preview`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: fd,
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({ message: "preview failed" }));
        throw new ApiError(body, res.status);
      }
      const blob = await res.blob();
      return URL.createObjectURL(blob);
    },
    placeholderData: keepPreviousData,
    staleTime: 20_000,
  });

  const previewSrc = previewQuery.data ?? existing?.imageUrl ?? null;
  const previewLoading = previewQuery.isFetching || (!previewSrc && Boolean(token));

  const save = useMutation({
    mutationFn: async (form: FormValues) => {
      let logoKey = removeLogo ? null : form.logoKey ?? existing?.logoKey ?? null;
      if (logoFile) {
        const fd = new FormData();
        fd.append("file", logoFile);
        const uploaded = await apiFetch<{ key: string }>("/qr/logo", {
          method: "POST",
          token,
          body: fd,
        });
        logoKey = uploaded.key;
      }
      const body = {
        destinationUrl: form.destinationUrl,
        title: form.title || "",
        qrColor: form.qrColor,
        bgColor: form.bgColor,
        logoKey,
        logoPosition: form.logoPosition,
        frameShape: form.frameShape,
        frameBgColor: form.frameBgColor,
        removeLogo,
        folderId: form.folderId || null,
      };
      if (existing) {
        return apiFetch<QrRecord>(`/qr/${existing.id}`, {
          method: "PATCH",
          token,
          body: JSON.stringify(body),
        });
      }
      return apiFetch<QrRecord>("/qr", {
        method: "POST",
        token,
        body: JSON.stringify(body),
      });
    },
    onSuccess: (data) => {
      router.push(localizedPath(`/dashboard/${data.id}`, locale));
      router.refresh();
    },
    onError: (err) => {
      setError(err instanceof ApiError ? translateApiError(t, err) ?? t("editor.saveFailed") : t("editor.saveFailed"));
    },
  });

  const download = async () => {
    if (!existing || !token) return;
    const res = await fetch(`${getApiUrl()}/qr/${existing.id}/download`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const blob = await res.blob();
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `inkue-${existing.hash}.png`;
    a.click();
  };

  return (
    <Stack direction={{ xs: "column", md: "row" }} spacing={4} alignItems="flex-start">
      <Paper
        component="form"
        variant="outlined"
        onSubmit={handleSubmit((v) => save.mutate(v))}
        sx={{ flex: 1, width: "100%", p: { xs: 2.5, md: 3.5 } }}
      >
        {error ? (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        ) : null}

        <Controller
          name="destinationUrl"
          control={control}
          render={({ field }) => (
            <FormField
              label={t("editor.destination")}
              htmlFor="destinationUrl"
              error={translateMessage(t, formState.errors.destinationUrl?.message)}
              hint={t("editor.destinationHint")}
            >
              <TextField
                {...field}
                id="destinationUrl"
                placeholder="www.google.com"
                autoComplete="url"
                error={Boolean(formState.errors.destinationUrl)}
              />
            </FormField>
          )}
        />

        <Controller
          name="title"
          control={control}
          render={({ field }) => (
            <FormField label={t("editor.title")} htmlFor="title" error={translateMessage(t, formState.errors.title?.message)}>
              <TextField {...field} id="title" placeholder={t("editor.titlePlaceholder")} />
            </FormField>
          )}
        />

        <Controller
          name="folderId"
          control={control}
          render={({ field }) => (
            <FormField label={t("editor.folder")} htmlFor="folderId">
              <TextField
                {...field}
                id="folderId"
                select
                value={field.value ?? UNFILED_FOLDER}
                onChange={(e) => field.onChange(e.target.value === UNFILED_FOLDER ? null : e.target.value)}
              >
                <MenuItem value={UNFILED_FOLDER}>{t("editor.noFolder")}</MenuItem>
                {(folders.data ?? []).map((folder) => (
                  <MenuItem key={folder.id} value={folder.id}>
                    {folder.name}
                  </MenuItem>
                ))}
              </TextField>
            </FormField>
          )}
        />

        <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
          <Box sx={{ flex: 1 }}>
            <Controller
              name="qrColor"
              control={control}
              render={({ field }) => (
                <FormField label={t("editor.qrColor")} htmlFor="qrColor">
                  <TextField
                    id="qrColor"
                    type="color"
                    value={field.value}
                    onChange={field.onChange}
                    inputProps={{ style: { height: 44, padding: 4, cursor: "pointer" } }}
                  />
                </FormField>
              )}
            />
          </Box>
          <Box sx={{ flex: 1 }}>
            <Controller
              name="bgColor"
              control={control}
              render={({ field }) => (
                <FormField label={t("editor.bgColor")} htmlFor="bgColor">
                  <TextField
                    id="bgColor"
                    type="color"
                    value={field.value}
                    onChange={field.onChange}
                    inputProps={{ style: { height: 44, padding: 4, cursor: "pointer" } }}
                  />
                </FormField>
              )}
            />
          </Box>
        </Stack>

        <FormField label={t("editor.logo")} htmlFor="logo" hint={t("editor.logoHint")}>
          <Stack spacing={1.25}>
            <Box
              component="label"
              htmlFor="logo"
              data-logo-dropzone
              onDragEnter={onLogoDragEnter}
              onDragLeave={onLogoDragLeave}
              onDragOver={onLogoDragOver}
              onDrop={onLogoDrop}
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 2,
                px: 2,
                py: 1.75,
                borderRadius: 2,
                border: "1.5px dashed",
                borderColor: logoDragging ? "primary.main" : "divider",
                bgcolor: logoDragging ? "rgba(37, 99, 235, 0.08)" : "background.paper",
                cursor: "pointer",
                transition: "border-color 0.15s ease, background-color 0.15s ease",
                "&:hover": { borderColor: "primary.main" },
              }}
            >
              {logoPreview && !removeLogo ? (
                <Box
                  component="img"
                  src={logoPreview}
                  alt={t("editor.logoPreview")}
                  sx={{ width: 48, height: 48, objectFit: "contain", flexShrink: 0 }}
                />
              ) : (
                <CloudUploadIcon color="primary" sx={{ flexShrink: 0 }} />
              )}
              <Box sx={{ minWidth: 0 }}>
                <Typography fontWeight={700} color="primary.main">
                  {logoDragging ? t("editor.dropLogoActive") : t("editor.upload")}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {t("editor.dropLogo")}
                </Typography>
              </Box>
              <input
                id="logo"
                hidden
                type="file"
                accept="image/png,image/jpeg,image/webp,image/svg+xml"
                onChange={(e) => {
                  const input = e.currentTarget;
                  const file = input.files?.[0] ?? null;
                  input.value = "";
                  applyLogoFile(file);
                }}
              />
            </Box>
            {hasLogo ? (
              <Button
                color="inherit"
                sx={{ alignSelf: "flex-start" }}
                onClick={() => {
                  setLogoFile(null);
                  setLogoPreview(null);
                  setRemoveLogo(true);
                }}
              >
                {t("editor.remove")}
              </Button>
            ) : null}
          </Stack>
        </FormField>

        {hasLogo ? (
          <>
            <FormField label={t("editor.position")} htmlFor="logoPosition">
              <Controller
                name="logoPosition"
                control={control}
                render={({ field }) => (
                  <ToggleButtonGroup
                    id="logoPosition"
                    exclusive
                    color="primary"
                    value={field.value}
                    onChange={(_, v) => v && field.onChange(v)}
                    sx={{ flexWrap: "wrap" }}
                  >
                    {POSITIONS.map((p) => (
                      <ToggleButton key={p} value={p} sx={{ px: 1.5 }}>
                        {t(`editor.pos_${p}`)}
                      </ToggleButton>
                    ))}
                  </ToggleButtonGroup>
                )}
              />
            </FormField>

            <FormField label={t("editor.frame")} htmlFor="frameShape">
              <Controller
                name="frameShape"
                control={control}
                render={({ field }) => (
                  <ToggleButtonGroup
                    id="frameShape"
                    exclusive
                    color="primary"
                    value={field.value}
                    onChange={(_, v) => v && field.onChange(v)}
                  >
                    {FRAMES.map((p) => (
                      <ToggleButton key={p} value={p}>
                        {t(`editor.frame_${p}`)}
                      </ToggleButton>
                    ))}
                  </ToggleButtonGroup>
                )}
              />
            </FormField>

            <Controller
              name="frameBgColor"
              control={control}
              render={({ field }) => (
                <FormField label={t("editor.frameBg")} htmlFor="frameBgColor">
                  <TextField
                    id="frameBgColor"
                    type="color"
                    value={field.value}
                    onChange={field.onChange}
                    inputProps={{ style: { height: 44, padding: 4, cursor: "pointer" } }}
                  />
                </FormField>
              )}
            />
          </>
        ) : null}

        <Stack direction="row" spacing={1.5} justifyContent="flex-end" flexWrap="wrap" useFlexGap sx={{ mt: 1 }}>
          <Button
            type="button"
            variant="outlined"
            color="inherit"
            onClick={() => router.push(localizedPath("/dashboard/qr", locale))}
          >
            {t("editor.cancel")}
          </Button>
          {existing ? (
            <Button variant="outlined" color="secondary" startIcon={<DownloadIcon />} onClick={download}>
              {t("editor.download")}
            </Button>
          ) : null}
          <Button type="submit" variant="contained" disabled={save.isPending}>
            {existing ? t("editor.save") : t("editor.create")}
          </Button>
        </Stack>
      </Paper>

      <Paper variant="outlined" sx={{ p: 2.5, width: { xs: "100%", md: 360 }, position: { md: "sticky" }, top: 96 }}>
        <Typography fontWeight={700} sx={{ mb: 1.5 }}>
          {t("editor.preview")}
        </Typography>
        <Box
          sx={{
            position: "relative",
            width: "100%",
            borderRadius: 2,
            bgcolor: values.bgColor,
            aspectRatio: "1 / 1",
            overflow: "hidden",
          }}
        >
          {previewSrc ? (
            <Box
              component="img"
              src={previewSrc}
              alt={t("editor.previewAlt")}
              sx={{ width: "100%", height: "100%", objectFit: "contain", display: "block" }}
            />
          ) : null}
          {previewLoading ? (
            <Box
              sx={{
                position: "absolute",
                inset: 0,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                bgcolor: "rgba(255,255,255,0.62)",
                backdropFilter: "blur(2px)",
              }}
            >
              <CircularProgress size={40} aria-label={t("dashboard.loading")} />
            </Box>
          ) : null}
        </Box>
        {existing ? (
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1.5, wordBreak: "break-all" }}>
            {existing.scanUrl}
          </Typography>
        ) : (
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1.5 }}>
            {t("editor.afterCreate")}
          </Typography>
        )}
        {previewQuery.isError ? (
          <Alert severity="warning" sx={{ mt: 1.5 }}>
            {previewQuery.error instanceof ApiError
              ? (translateApiError(t, previewQuery.error) ?? t("errors.logoUnreadable"))
              : t("errors.logoUnreadable")}
          </Alert>
        ) : null}
      </Paper>
    </Stack>
  );
}
