"use client";

import AddIcon from "@mui/icons-material/Add";
import CreateNewFolderIcon from "@mui/icons-material/CreateNewFolder";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import DriveFileRenameOutlineIcon from "@mui/icons-material/DriveFileRenameOutline";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Container from "@mui/material/Container";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogContentText from "@mui/material/DialogContentText";
import DialogTitle from "@mui/material/DialogTitle";
import IconButton from "@mui/material/IconButton";
import MenuItem from "@mui/material/MenuItem";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import { useState } from "react";
import { LocaleLink } from "@/components/LocaleLink";
import { type FolderRecord, type QrRecord } from "@/components/QrEditor";
import { useI18n } from "@/i18n/LocaleProvider";
import { ApiError, apiFetch } from "@/lib/api";
import { translateApiError } from "@/i18n/errors";

type FolderDialog =
  | { mode: "create" }
  | { mode: "rename"; id: string; name: string }
  | { mode: "delete"; id: string; name: string }
  | { mode: "deleteQr"; id: string; name: string }
  | null;

export default function QrManagePage() {
  const { t } = useI18n();
  const { data: session } = useSession();
  const token = session?.accessToken;
  const queryClient = useQueryClient();
  const [dialog, setDialog] = useState<FolderDialog>(null);
  const [folderName, setFolderName] = useState("");
  const [folderError, setFolderError] = useState<string | null>(null);

  const list = useQuery({
    queryKey: ["qr-list"],
    enabled: Boolean(token),
    queryFn: () => apiFetch<QrRecord[]>("/qr", { token }),
  });

  const folders = useQuery({
    queryKey: ["folders"],
    enabled: Boolean(token),
    queryFn: () => apiFetch<FolderRecord[]>("/folders", { token }),
  });

  const invalidateLists = () => {
    queryClient.invalidateQueries({ queryKey: ["qr-list"] });
    queryClient.invalidateQueries({ queryKey: ["folders"] });
    queryClient.invalidateQueries({ queryKey: ["stats-me"] });
  };

  const saveFolder = useMutation({
    mutationFn: async () => {
      const name = folderName.trim();
      if (dialog?.mode === "rename") {
        return apiFetch<FolderRecord>(`/folders/${dialog.id}`, {
          method: "PATCH",
          token,
          body: JSON.stringify({ name }),
        });
      }
      return apiFetch<FolderRecord>("/folders", {
        method: "POST",
        token,
        body: JSON.stringify({ name }),
      });
    },
    onSuccess: () => {
      setDialog(null);
      setFolderName("");
      setFolderError(null);
      invalidateLists();
    },
    onError: (err) => {
      setFolderError(err instanceof ApiError ? translateApiError(t, err) ?? t("errors.generic") : t("errors.generic"));
    },
  });

  const deleteFolder = useMutation({
    mutationFn: async (id: string) => apiFetch<{ ok: boolean }>(`/folders/${id}`, { method: "DELETE", token }),
    onSuccess: () => {
      setDialog(null);
      invalidateLists();
    },
  });

  const deleteQr = useMutation({
    mutationFn: async (id: string) => apiFetch<{ ok: boolean }>(`/qr/${id}`, { method: "DELETE", token }),
    onSuccess: () => {
      setDialog(null);
      invalidateLists();
    },
  });

  const moveQr = useMutation({
    mutationFn: async ({ id, folderId }: { id: string; folderId: string | null }) =>
      apiFetch<QrRecord>(`/qr/${id}`, {
        method: "PATCH",
        token,
        body: JSON.stringify({ folderId }),
      }),
    onSuccess: invalidateLists,
  });

  const qrs = list.data ?? [];
  const folderRows = folders.data ?? [];
  const grouped = folderRows.map((folder) => ({
    folder,
    items: qrs.filter((qr) => qr.folderId === folder.id),
  }));
  const unfiled = qrs.filter((qr) => !qr.folderId);

  const renderQrRow = (qr: QrRecord) => (
    <Paper key={qr.id} variant="outlined" sx={{ p: 2, display: "flex", gap: 2, alignItems: "center" }}>
      <Box
        component={LocaleLink}
        href={`/dashboard/${qr.id}`}
        sx={{ display: "flex", gap: 2, alignItems: "center", flex: 1, minWidth: 0, textDecoration: "none", color: "inherit" }}
      >
        <Box component="img" src={qr.imageUrl} alt="" sx={{ width: 72, height: 72, borderRadius: 1, bgcolor: "#fff" }} />
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography fontWeight={700} noWrap>
            {qr.title || qr.destinationUrl}
          </Typography>
          <Typography variant="body2" color="text.secondary" noWrap>
            {qr.scanUrl}
          </Typography>
        </Box>
        <Typography fontWeight={700} sx={{ whiteSpace: "nowrap" }}>
          {t("dashboard.scanCount", { count: qr.scanCount })}
        </Typography>
      </Box>
      <TextField
        select
        size="small"
        label={t("dashboard.moveTo")}
        value={qr.folderId ?? ""}
        sx={{ minWidth: 160 }}
        onChange={(e) => moveQr.mutate({ id: qr.id, folderId: e.target.value || null })}
      >
        <MenuItem value="">{t("dashboard.unfiled")}</MenuItem>
        {folderRows.map((folder) => (
          <MenuItem key={folder.id} value={folder.id}>
            {folder.name}
          </MenuItem>
        ))}
      </TextField>
      <IconButton
        size="small"
        aria-label={t("dashboard.deleteQr")}
        onClick={() => setDialog({ mode: "deleteQr", id: qr.id, name: qr.title || qr.destinationUrl })}
      >
        <DeleteOutlineIcon fontSize="small" />
      </IconButton>
    </Paper>
  );

  return (
    <Container maxWidth="lg" sx={{ py: { xs: 2, md: 4 } }}>
      <Stack
        direction={{ xs: "column", sm: "row" }}
        justifyContent="space-between"
        alignItems={{ sm: "flex-start" }}
        spacing={2}
        sx={{ mb: 3 }}
      >
        <Box>
          <Typography component="h1" variant="h4" fontWeight={800}>
            {t("menu.folders")}
          </Typography>
          <Typography color="text.secondary">{t("menu.foldersHint")}</Typography>
        </Box>
        <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
          <Button
            size="small"
            startIcon={<CreateNewFolderIcon />}
            onClick={() => {
              setFolderName("");
              setFolderError(null);
              setDialog({ mode: "create" });
            }}
          >
            {t("dashboard.newFolder")}
          </Button>
          <Button component={LocaleLink} href="/dashboard/qr/create" size="small" variant="contained" startIcon={<AddIcon />}>
            {t("dashboard.create")}
          </Button>
        </Stack>
      </Stack>

      <Stack spacing={3}>
        {grouped.map(({ folder, items }) => (
          <Box key={folder.id}>
            <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
              <Typography variant="h6" fontWeight={800}>
                {folder.name}
              </Typography>
              <Typography color="text.secondary">{items.length}</Typography>
              <IconButton
                size="small"
                aria-label={t("dashboard.rename")}
                onClick={() => {
                  setFolderName(folder.name);
                  setFolderError(null);
                  setDialog({ mode: "rename", id: folder.id, name: folder.name });
                }}
              >
                <DriveFileRenameOutlineIcon fontSize="small" />
              </IconButton>
              <IconButton
                size="small"
                aria-label={t("dashboard.deleteFolder")}
                onClick={() => setDialog({ mode: "delete", id: folder.id, name: folder.name })}
              >
                <DeleteOutlineIcon fontSize="small" />
              </IconButton>
            </Stack>
            <Stack spacing={1.5}>
              {items.length ? items.map(renderQrRow) : <Typography color="text.secondary">{t("dashboard.emptyFolder")}</Typography>}
            </Stack>
          </Box>
        ))}

        <Box>
          <Typography variant="h6" fontWeight={800} sx={{ mb: 1 }}>
            {t("dashboard.unfiled")}
          </Typography>
          <Stack spacing={1.5}>
            {unfiled.length ? unfiled.map(renderQrRow) : null}
            {qrs.length === 0 ? <Typography color="text.secondary">{t("dashboard.empty")}</Typography> : null}
            {qrs.length > 0 && unfiled.length === 0 && folderRows.length > 0 ? (
              <Typography color="text.secondary">{t("dashboard.emptyFolder")}</Typography>
            ) : null}
          </Stack>
        </Box>
      </Stack>

      <Dialog
        open={dialog?.mode === "create" || dialog?.mode === "rename"}
        onClose={() => setDialog(null)}
        fullWidth
        maxWidth="xs"
      >
        <DialogTitle>{dialog?.mode === "rename" ? t("dashboard.rename") : t("dashboard.createFolder")}</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            fullWidth
            margin="dense"
            label={t("dashboard.folderName")}
            value={folderName}
            onChange={(e) => setFolderName(e.target.value)}
            error={Boolean(folderError)}
            helperText={folderError}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialog(null)}>{t("dashboard.cancel")}</Button>
          <Button variant="contained" onClick={() => saveFolder.mutate()} disabled={saveFolder.isPending || !folderName.trim()}>
            {t("dashboard.saveFolder")}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={dialog?.mode === "delete"} onClose={() => setDialog(null)}>
        <DialogTitle>{t("dashboard.deleteFolder")}</DialogTitle>
        <DialogContent>
          <DialogContentText>{t("dashboard.deleteFolderConfirm")}</DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialog(null)}>{t("dashboard.cancel")}</Button>
          <Button color="error" onClick={() => dialog?.mode === "delete" && deleteFolder.mutate(dialog.id)} disabled={deleteFolder.isPending}>
            {t("dashboard.deleteFolder")}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={dialog?.mode === "deleteQr"} onClose={() => setDialog(null)}>
        <DialogTitle>{t("dashboard.deleteQr")}</DialogTitle>
        <DialogContent>
          <DialogContentText>{t("dashboard.deleteQrConfirm")}</DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialog(null)}>{t("dashboard.cancel")}</Button>
          <Button color="error" onClick={() => dialog?.mode === "deleteQr" && deleteQr.mutate(dialog.id)} disabled={deleteQr.isPending}>
            {t("dashboard.deleteQr")}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}
