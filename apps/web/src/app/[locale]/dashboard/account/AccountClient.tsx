"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import AddPhotoAlternateOutlinedIcon from "@mui/icons-material/AddPhotoAlternateOutlined";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Container from "@mui/material/Container";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogContentText from "@mui/material/DialogContentText";
import DialogTitle from "@mui/material/DialogTitle";
import IconButton from "@mui/material/IconButton";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import {
  AVATAR_FRAMES,
  AVATAR_FRAME_MIN_MONTHS,
  changePasswordSchema,
  deleteAccountSchema,
  effectiveAvatarFrame,
  isAvatarFrameUnlocked,
  type AvatarFrame,
} from "@mamuy/shared";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { signOut, useSession } from "next-auth/react";
import { useEffect, useRef, useState, type DragEvent } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { AvatarCropDialog } from "@/components/AvatarCropDialog";
import { FormField } from "@/components/FormField";
import { PageLoading } from "@/components/PageLoading";
import { PasswordField } from "@/components/PasswordField";
import { ProfileAvatar } from "@/components/ProfileAvatar";
import type { AuthMe } from "@/components/UserMenu";
import { translateApiError, translateMessage } from "@/i18n/errors";
import { useI18n } from "@/i18n/LocaleProvider";
import { localizedPath } from "@/i18n/path";
import { ApiError, apiFetch } from "@/lib/api";

const PHOTO_TYPES = new Set(["image/png", "image/jpeg", "image/jpg", "image/pjpeg", "image/webp"]);
const PHOTO_EXT = /\.(png|jpe?g|webp)$/i;
const PHOTO_EDIT_MAX = 12 * 1024 * 1024;
const FRAME_PICKER_SIZE = 72;

const FRAME_LABEL: Record<AvatarFrame, "account.frameNone" | "account.frameTier2" | "account.frameTier3" | "account.frameTier4" | "account.frameTier5"> = {
  none: "account.frameNone",
  tier2: "account.frameTier2",
  tier3: "account.frameTier3",
  tier4: "account.frameTier4",
  tier5: "account.frameTier5",
};

const passwordFormSchema = changePasswordSchema
  .extend({
    confirmPassword: z.string().min(1, "Please confirm your password"),
  })
  .refine((v) => v.password === v.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export function AccountClient() {
  const { t, locale } = useI18n();
  const { data: session } = useSession();
  const token = session?.accessToken;
  const email = session?.user?.email ?? "";
  const queryClient = useQueryClient();
  const photoDragDepth = useRef(0);
  const [photoNotice, setPhotoNotice] = useState<string | null>(null);
  const [photoError, setPhotoError] = useState<string | null>(null);
  const [photoDragging, setPhotoDragging] = useState(false);
  const [cropSrc, setCropSrc] = useState<string | null>(null);
  const [passwordNotice, setPasswordNotice] = useState<string | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [frameNotice, setFrameNotice] = useState<string | null>(null);
  const [frameError, setFrameError] = useState<string | null>(null);

  const me = useQuery({
    queryKey: ["auth-me"],
    enabled: Boolean(token),
    queryFn: () => apiFetch<AuthMe>("/auth/me", { token }),
  });

  const passwordForm = useForm({
    resolver: zodResolver(passwordFormSchema),
    defaultValues: { currentPassword: "", password: "", confirmPassword: "" },
  });

  const deleteForm = useForm({
    resolver: zodResolver(deleteAccountSchema),
    defaultValues: { password: "" },
  });

  const upload = useMutation({
    mutationFn: (file: File) => {
      const body = new FormData();
      body.append("file", file);
      return apiFetch<AuthMe>("/auth/avatar", { method: "POST", token, body });
    },
    onSuccess: (data) => {
      queryClient.setQueryData(["auth-me"], data);
      setPhotoError(null);
      setPhotoNotice(t("account.photoUpdated"));
      setCropSrc((prev) => {
        if (prev) URL.revokeObjectURL(prev);
        return null;
      });
    },
    onError: (err) => {
      setPhotoNotice(null);
      setPhotoError(err instanceof ApiError ? translateApiError(t, err) : t("errors.generic"));
    },
  });

  const removePhoto = useMutation({
    mutationFn: () => apiFetch<AuthMe>("/auth/avatar", { method: "DELETE", token }),
    onSuccess: (data) => {
      queryClient.setQueryData(["auth-me"], data);
      setPhotoError(null);
      setPhotoNotice(t("account.photoRemoved"));
    },
    onError: (err) => {
      setPhotoNotice(null);
      setPhotoError(err instanceof ApiError ? translateApiError(t, err) : t("errors.generic"));
    },
  });

  const setFrame = useMutation({
    mutationFn: (frame: AvatarFrame) =>
      apiFetch<AuthMe>("/auth/avatar-frame", {
        method: "PATCH",
        token,
        body: JSON.stringify({ frame }),
      }),
    onSuccess: (data) => {
      queryClient.setQueryData(["auth-me"], data);
      setFrameError(null);
      setFrameNotice(t("account.frameUpdated"));
    },
    onError: (err) => {
      setFrameNotice(null);
      setFrameError(err instanceof ApiError ? translateApiError(t, err) : t("errors.generic"));
    },
  });

  const changePassword = useMutation({
    mutationFn: (payload: { currentPassword: string; password: string }) =>
      apiFetch<{ ok: true }>("/auth/password", {
        method: "POST",
        token,
        body: JSON.stringify(payload),
      }),
    onSuccess: () => {
      passwordForm.reset();
      setPasswordNotice(t("account.passwordUpdated"));
    },
  });

  const isAdmin = Boolean(me.data?.isAdmin);

  useEffect(() => {
    return () => {
      if (cropSrc) URL.revokeObjectURL(cropSrc);
    };
  }, [cropSrc]);

  function isAllowedPhoto(file: File) {
    return PHOTO_TYPES.has(file.type.toLowerCase()) || PHOTO_EXT.test(file.name);
  }

  function pickPhoto(file: File | undefined | null) {
    if (!file) return;
    if (!isAllowedPhoto(file)) {
      setPhotoNotice(null);
      setPhotoError(t("errors.avatarType"));
      return;
    }
    if (file.size > PHOTO_EDIT_MAX) {
      setPhotoNotice(null);
      setPhotoError(t("errors.avatarTooLarge"));
      return;
    }
    setPhotoError(null);
    setPhotoNotice(null);
    setCropSrc((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return URL.createObjectURL(file);
    });
  }

  function onPhotoDragEnter(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    photoDragDepth.current += 1;
    if (Array.from(event.dataTransfer.types).includes("Files")) setPhotoDragging(true);
  }

  function onPhotoDragLeave(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    photoDragDepth.current = Math.max(0, photoDragDepth.current - 1);
    if (photoDragDepth.current === 0) setPhotoDragging(false);
  }

  function onPhotoDragOver(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    event.dataTransfer.dropEffect = "copy";
  }

  function onPhotoDrop(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    photoDragDepth.current = 0;
    setPhotoDragging(false);
    pickPhoto(event.dataTransfer.files[0] ?? null);
  }

  const deleteAccount = useMutation({
    mutationFn: (payload: { password: string }) =>
      apiFetch<{ ok: true }>("/auth/delete", {
        method: "POST",
        token,
        body: JSON.stringify(payload),
      }),
    onSuccess: () => signOut({ callbackUrl: localizedPath("/", locale) }),
    onError: (err) => {
      setDeleteError(err instanceof ApiError ? translateApiError(t, err) : t("errors.generic"));
    },
  });

  if (!token || me.isLoading) {
    return <PageLoading />;
  }

  const photoCard = (
    <Paper variant="outlined" sx={{ p: { xs: 2.5, md: 3 }, flex: 1, minWidth: 0 }}>
      {photoNotice ? (
        <Alert severity="success" sx={{ mb: 2 }}>
          {photoNotice}
        </Alert>
      ) : null}
      {photoError ? (
        <Alert severity="error" sx={{ mb: 2 }}>
          {photoError}
        </Alert>
      ) : null}
      <Stack direction={{ xs: "column", sm: "row" }} spacing={2.5} alignItems={{ xs: "stretch", sm: "flex-start" }}>
        <ProfileAvatar
          src={me.data?.avatarUrl}
          email={email}
          frame={me.data?.avatarFrame}
          createdAt={me.data?.createdAt}
          size={112}
        />
        <Box sx={{ minWidth: 0, flex: 1 }}>
          <input
            id="account-photo"
            type="file"
            accept="image/png,image/jpeg,image/webp"
            hidden
            onChange={(event) => {
              const file = event.target.files?.[0];
              event.target.value = "";
              pickPhoto(file);
            }}
          />
          <Box
            component="label"
            htmlFor="account-photo"
            onDragEnter={onPhotoDragEnter}
            onDragLeave={onPhotoDragLeave}
            onDragOver={onPhotoDragOver}
            onDrop={onPhotoDrop}
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 2,
              px: 2,
              py: 1.75,
              borderRadius: 2,
              border: "1.5px dashed",
              borderColor: photoDragging ? "primary.main" : "divider",
              bgcolor: photoDragging ? "rgba(37, 99, 235, 0.08)" : "background.paper",
              cursor: "pointer",
              transition: "border-color 0.15s ease, background-color 0.15s ease",
              "&:hover": { borderColor: "primary.main" },
            }}
          >
            <AddPhotoAlternateOutlinedIcon color="primary" sx={{ fontSize: 36, flexShrink: 0 }} />
            <Box sx={{ minWidth: 0 }}>
              <Typography fontWeight={700} color="primary.main">
                {photoDragging ? t("account.dropPhotoActive") : t("account.upload")}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {t("account.dropPhoto")}
              </Typography>
            </Box>
          </Box>
          {me.data?.avatarUrl ? (
            <Button
              color="inherit"
              sx={{ mt: 1, ml: -1 }}
              onClick={() => removePhoto.mutate()}
              disabled={removePhoto.isPending}
            >
              {t("account.remove")}
            </Button>
          ) : null}
          <Typography fontWeight={800} sx={{ mt: 1.5 }}>
            {t("account.photo")}
          </Typography>
          <Typography color="text.secondary" variant="body2">
            {t("account.photoHint")}
          </Typography>
        </Box>
      </Stack>
    </Paper>
  );

  const passwordCard = (
    <Paper variant="outlined" sx={{ p: { xs: 2.5, md: 3 }, flex: 1.35, minWidth: 0 }}>
      <Typography variant="h6" fontWeight={800} sx={{ mb: 2 }}>
        {t("account.password")}
      </Typography>
      {passwordNotice ? (
        <Alert severity="success" sx={{ mb: 2 }}>
          {passwordNotice}
        </Alert>
      ) : null}
      {changePassword.isError ? (
        <Alert severity="error" sx={{ mb: 2 }}>
          {changePassword.error instanceof ApiError
            ? translateApiError(t, changePassword.error)
            : t("errors.generic")}
        </Alert>
      ) : null}
      <Box
        component="form"
        onSubmit={passwordForm.handleSubmit((values) => {
          setPasswordNotice(null);
          changePassword.mutate({ currentPassword: values.currentPassword, password: values.password });
        })}
      >
        <FormField
          label={t("account.currentPassword")}
          htmlFor="currentPassword"
          error={translateMessage(t, passwordForm.formState.errors.currentPassword?.message)}
        >
          <PasswordField
            id="currentPassword"
            autoComplete="current-password"
            fullWidth
            error={Boolean(passwordForm.formState.errors.currentPassword)}
            {...passwordForm.register("currentPassword")}
          />
        </FormField>
        <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <FormField
              label={t("account.newPassword")}
              htmlFor="newPassword"
              error={translateMessage(t, passwordForm.formState.errors.password?.message)}
            >
              <PasswordField
                id="newPassword"
                autoComplete="new-password"
                fullWidth
                error={Boolean(passwordForm.formState.errors.password)}
                {...passwordForm.register("password")}
              />
            </FormField>
          </Box>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <FormField
              label={t("account.confirmPassword")}
              htmlFor="confirmNewPassword"
              error={translateMessage(t, passwordForm.formState.errors.confirmPassword?.message)}
            >
              <PasswordField
                id="confirmNewPassword"
                autoComplete="new-password"
                fullWidth
                error={Boolean(passwordForm.formState.errors.confirmPassword)}
                {...passwordForm.register("confirmPassword")}
              />
            </FormField>
          </Box>
        </Stack>
        <Stack direction="row" spacing={1.5} justifyContent="flex-end" sx={{ mt: 0.5 }}>
          <Button type="submit" variant="contained" disabled={changePassword.isPending}>
            {t("account.savePassword")}
          </Button>
        </Stack>
      </Box>
    </Paper>
  );

  return (
    <Container maxWidth="lg" sx={{ py: { xs: 2, md: 4 } }}>
      <Box sx={{ mb: 3 }}>
        <Typography component="h1" variant="h4" fontWeight={800}>
          {t("account.title")}
        </Typography>
        {email ? (
          <Typography color="text.secondary">{email}</Typography>
        ) : null}
      </Box>

      <Stack direction={{ xs: "column", md: "row" }} spacing={2} alignItems="flex-start" sx={{ mb: 2 }}>
        {photoCard}
        {me.data && !isAdmin ? passwordCard : null}
      </Stack>

      {me.data ? (
        <Paper variant="outlined" sx={{ p: { xs: 2.5, md: 3 }, mb: 2 }}>
          <Typography variant="h6" fontWeight={800}>
            {t("account.frame")}
          </Typography>
          <Typography color="text.secondary" variant="body2" sx={{ mb: 2 }}>
            {t("account.frameHint")}
          </Typography>
          {frameNotice ? (
            <Alert severity="success" sx={{ mb: 2 }}>
              {frameNotice}
            </Alert>
          ) : null}
          {frameError ? (
            <Alert severity="error" sx={{ mb: 2 }}>
              {frameError}
            </Alert>
          ) : null}
          <Stack direction="row" spacing={1.5} flexWrap="wrap" useFlexGap>
            {AVATAR_FRAMES.map((frame) => {
              const unlocked = isAvatarFrameUnlocked(frame, me.data.createdAt, email);
              const selected = effectiveAvatarFrame(me.data.avatarFrame, me.data.createdAt, email) === frame;
              const months = AVATAR_FRAME_MIN_MONTHS[frame];
              const label = t(FRAME_LABEL[frame]);
              const requirement =
                frame === "none"
                  ? label
                  : months % 12 === 0
                    ? t("account.frameNeedYears", { years: months / 12 })
                    : t("account.frameNeedMonths", { months });
              const tooltip = frame === "none" ? label : `${label} — ${requirement}`;
              return (
                <Tooltip key={frame} title={tooltip}>
                  <Box component="span" sx={{ display: "inline-flex" }}>
                    <IconButton
                      disabled={!unlocked || setFrame.isPending}
                      onClick={() => {
                        if (!selected) setFrame.mutate(frame);
                      }}
                      aria-label={tooltip}
                      aria-pressed={selected}
                      sx={{
                        p: 0.75,
                        borderRadius: "50%",
                        border: "2px solid",
                        borderColor: selected ? "primary.main" : "transparent",
                        bgcolor: "transparent",
                        "&.Mui-disabled": { opacity: 1 },
                      }}
                    >
                      <Box sx={{ position: "relative", opacity: unlocked ? 1 : 0.78 }}>
                        <ProfileAvatar src={me.data.avatarUrl} email={email} frame={frame} size={FRAME_PICKER_SIZE} />
                        {unlocked ? null : (
                          <LockOutlinedIcon
                            sx={{
                              position: "absolute",
                              right: 0,
                              bottom: 0,
                              fontSize: 15,
                              color: "text.secondary",
                              bgcolor: "background.paper",
                              borderRadius: "50%",
                              boxShadow: "0 0 0 1px rgba(15, 23, 42, 0.08)",
                              p: "2px",
                            }}
                          />
                        )}
                      </Box>
                    </IconButton>
                  </Box>
                </Tooltip>
              );
            })}
          </Stack>
        </Paper>
      ) : null}

      <AvatarCropDialog
        open={Boolean(cropSrc)}
        src={cropSrc}
        busy={upload.isPending}
        onClose={() => {
          if (upload.isPending) return;
          setCropSrc((prev) => {
            if (prev) URL.revokeObjectURL(prev);
            return null;
          });
        }}
        onConfirm={(file) => upload.mutate(file)}
      />

      {me.data && !isAdmin ? (
        <>
          <Paper variant="outlined" sx={{ p: { xs: 2.5, md: 3 }, borderColor: "error.main" }}>
            <Stack
              direction={{ xs: "column", sm: "row" }}
              spacing={2}
              alignItems={{ xs: "flex-start", sm: "center" }}
              justifyContent="space-between"
            >
              <Box sx={{ minWidth: 0, pr: { sm: 2 } }}>
                <Typography variant="h6" fontWeight={800} sx={{ mb: 0.5 }}>
                  {t("account.deleteTitle")}
                </Typography>
                <Typography color="text.secondary">{t("account.deleteBody")}</Typography>
              </Box>
              <Button color="error" variant="outlined" onClick={() => setDeleteOpen(true)} sx={{ flexShrink: 0 }}>
                {t("account.deleteConfirm")}
              </Button>
            </Stack>
          </Paper>

          <Dialog
            open={deleteOpen}
            onClose={() => {
              if (deleteAccount.isPending) return;
              setDeleteOpen(false);
              setDeleteError(null);
              deleteForm.reset();
            }}
          >
            <DialogTitle>{t("account.deleteTitle")}</DialogTitle>
            <Box
              component="form"
              onSubmit={deleteForm.handleSubmit((values) => {
                setDeleteError(null);
                deleteAccount.mutate({ password: values.password });
              })}
            >
              <DialogContent>
                <DialogContentText sx={{ mb: 2 }}>{t("account.deleteWarning")}</DialogContentText>
                {deleteError ? (
                  <Alert severity="error" sx={{ mb: 2 }}>
                    {deleteError}
                  </Alert>
                ) : null}
                <FormField
                  label={t("account.currentPassword")}
                  htmlFor="deletePassword"
                  error={translateMessage(t, deleteForm.formState.errors.password?.message)}
                >
                  <PasswordField
                    id="deletePassword"
                    autoComplete="current-password"
                    fullWidth
                    error={Boolean(deleteForm.formState.errors.password)}
                    {...deleteForm.register("password")}
                  />
                </FormField>
              </DialogContent>
              <DialogActions>
                <Button
                  type="button"
                  onClick={() => {
                    setDeleteOpen(false);
                    setDeleteError(null);
                    deleteForm.reset();
                  }}
                  disabled={deleteAccount.isPending}
                >
                  {t("dashboard.cancel")}
                </Button>
                <Button type="submit" color="error" variant="contained" disabled={deleteAccount.isPending}>
                  {deleteAccount.isPending ? t("account.deleting") : t("account.deleteConfirm")}
                </Button>
              </DialogActions>
            </Box>
          </Dialog>
        </>
      ) : null}
    </Container>
  );
}
