"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import AddIcon from "@mui/icons-material/Add";
import CreateNewFolderIcon from "@mui/icons-material/CreateNewFolder";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import DriveFileRenameOutlineIcon from "@mui/icons-material/DriveFileRenameOutline";
import FolderOutlinedIcon from "@mui/icons-material/FolderOutlined";
import InboxOutlinedIcon from "@mui/icons-material/InboxOutlined";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import SearchIcon from "@mui/icons-material/Search";
import Box from "@mui/material/Box";
import Breadcrumbs from "@mui/material/Breadcrumbs";
import Button from "@mui/material/Button";
import Container from "@mui/material/Container";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogContentText from "@mui/material/DialogContentText";
import DialogTitle from "@mui/material/DialogTitle";
import IconButton from "@mui/material/IconButton";
import InputAdornment from "@mui/material/InputAdornment";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { LocaleLink } from "@/components/LocaleLink";
import { PageLoading } from "@/components/PageLoading";
import { QrListRow } from "@/components/QrListRow";
import { type FolderRecord, type QrRecord } from "@/components/QrEditor";
import { useI18n } from "@/i18n/LocaleProvider";
import { localizedPath } from "@/i18n/path";
import { ApiError, apiFetch } from "@/lib/api";
import { translateApiError } from "@/i18n/errors";

const UNFILED_FOLDER = "unfiled";

type FolderDialog =
  | { mode: "create" }
  | { mode: "rename"; id: string; name: string }
  | { mode: "delete"; id: string; name: string }
  | { mode: "deleteQr"; id: string; name: string }
  | null;

function matchesQr(qr: QrRecord, query: string) {
  if (!query) return true;
  const title = qr.title?.trim() ?? "";
  return (
    title.toLowerCase().includes(query) ||
    qr.destinationUrl.toLowerCase().includes(query) ||
    qr.scanUrl.toLowerCase().includes(query)
  );
}

export default function QrManagePage() {
  return (
    <Suspense fallback={<PageLoading />}>
      <QrManageView />
    </Suspense>
  );
}

function QrManageView() {
  const { t, locale } = useI18n();
  const { data: session } = useSession();
  const token = session?.accessToken;
  const queryClient = useQueryClient();
  const router = useRouter();
  const searchParams = useSearchParams();
  const folderParam = searchParams.get("folder");
  const [dialog, setDialog] = useState<FolderDialog>(null);
  const [folderName, setFolderName] = useState("");
  const [folderError, setFolderError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [cardMenu, setCardMenu] = useState<{ id: string; name: string; el: HTMLElement } | null>(null);
  const [movingId, setMovingId] = useState<string | null>(null);

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

  useEffect(() => {
    setQuery("");
  }, [folderParam]);

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
    onSuccess: (_data, id) => {
      setDialog(null);
      invalidateLists();
      if (folderParam === id) router.push(localizedPath("/dashboard/qr", locale));
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
      apiFetch<QrRecord>(`/qr/${id}`, { method: "PATCH", token, body: JSON.stringify({ folderId }) }),
    onMutate: ({ id }) => setMovingId(id),
    onSettled: () => {
      setMovingId(null);
      invalidateLists();
    },
  });

  const qrs = list.data ?? [];
  const folderRows = folders.data ?? [];
  const unfiled = useMemo(() => qrs.filter((qr) => !qr.folderId), [qrs]);
  const q = query.trim().toLowerCase();

  const selectedFolder =
    folderParam && folderParam !== UNFILED_FOLDER ? folderRows.find((folder) => folder.id === folderParam) : undefined;
  const folderMissing = Boolean(folderParam && folderParam !== UNFILED_FOLDER && folders.isSuccess && !selectedFolder);
  const viewingUnfiled = folderParam === UNFILED_FOLDER;
  const currentFolderId = viewingUnfiled ? null : selectedFolder?.id ?? null;
  const currentItems = viewingUnfiled
    ? unfiled
    : selectedFolder
      ? qrs.filter((qr) => qr.folderId === selectedFolder.id)
      : [];
  const visibleItems = q ? currentItems.filter((qr) => matchesQr(qr, q)) : currentItems;

  const visibleFolders = q ? folderRows.filter((folder) => folder.name.toLowerCase().includes(q)) : folderRows;
  const showUnfiledCard = !q || t("dashboard.unfiled").toLowerCase().includes(q);

  const createHref =
    folderParam && !folderMissing ? `/dashboard/qr/create?folder=${encodeURIComponent(folderParam)}` : "/dashboard/qr/create";

  const openCreate = () => {
    setFolderName("");
    setFolderError(null);
    setDialog({ mode: "create" });
  };

  const openRename = (id: string, name: string) => {
    setCardMenu(null);
    setFolderName(name);
    setFolderError(null);
    setDialog({ mode: "rename", id, name });
  };

  const openDeleteFolder = (id: string, name: string) => {
    setCardMenu(null);
    setDialog({ mode: "delete", id, name });
  };

  const headerActions = (
    <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
      {!folderParam ? (
        <Button size="small" startIcon={<CreateNewFolderIcon />} onClick={openCreate}>
          {t("dashboard.newFolder")}
        </Button>
      ) : null}
      <Button component={LocaleLink} href={createHref} size="small" variant="contained" startIcon={<AddIcon />}>
        {t("dashboard.create")}
      </Button>
    </Stack>
  );

  const dialogs = (
    <>
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
    </>
  );

  if (list.isLoading || folders.isLoading) {
    return <PageLoading />;
  }

  if (folderMissing) {
    return (
      <Container maxWidth="lg" sx={{ py: { xs: 2, md: 4 } }}>
        <Typography component="h1" variant="h4" fontWeight={800} sx={{ mb: 1 }}>
          {t("errors.folderNotFound")}
        </Typography>
        <Button component={LocaleLink} href="/dashboard/qr">
          {t("dashboard.allFolders")}
        </Button>
      </Container>
    );
  }

  if (folderParam && (selectedFolder || viewingUnfiled)) {
    const folderTitle = viewingUnfiled ? t("dashboard.unfiled") : selectedFolder!.name;
    return (
      <Container maxWidth="lg" sx={{ py: { xs: 2, md: 4 } }}>
        <Box sx={{ mb: 3 }}>
          <Breadcrumbs sx={{ mb: 1 }}>
            <Box component={LocaleLink} href="/dashboard/qr" sx={{ color: "text.secondary", textDecoration: "none", "&:hover": { color: "primary.main" } }}>
              {t("dashboard.allFolders")}
            </Box>
            <Typography color="text.primary">{folderTitle}</Typography>
          </Breadcrumbs>
          <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={1}>
            <Stack direction="row" alignItems="center" spacing={0.5} sx={{ minWidth: 0, flex: 1 }}>
              <Typography component="h1" variant="h4" fontWeight={800} noWrap>
                {folderTitle}
              </Typography>
              {!viewingUnfiled && selectedFolder ? (
                <>
                  <IconButton
                    size="small"
                    aria-label={t("dashboard.rename")}
                    onClick={() => openRename(selectedFolder.id, selectedFolder.name)}
                  >
                    <DriveFileRenameOutlineIcon fontSize="small" />
                  </IconButton>
                  <IconButton
                    size="small"
                    aria-label={t("dashboard.deleteFolder")}
                    onClick={() => openDeleteFolder(selectedFolder.id, selectedFolder.name)}
                  >
                    <DeleteOutlineIcon fontSize="small" />
                  </IconButton>
                </>
              ) : null}
            </Stack>
            <Box sx={{ flexShrink: 0 }}>{headerActions}</Box>
          </Stack>
          <Typography color="text.secondary">{t("dashboard.qrCount", { count: currentItems.length })}</Typography>
        </Box>

        <Box sx={{ width: 1, maxWidth: { md: 420 }, mb: 3 }}>
          <TextField
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t("dashboard.searchQr")}
            size="small"
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon fontSize="small" />
                  </InputAdornment>
                ),
              },
              htmlInput: { "aria-label": t("dashboard.searchQr") },
            }}
          />
        </Box>

        <Stack spacing={1.5}>
          {visibleItems.length ? (
            visibleItems.map((qr) => (
              <QrListRow
                key={qr.id}
                qr={qr}
                folders={folderRows}
                currentFolderId={currentFolderId}
                moving={movingId === qr.id}
                onMove={(folderId) => moveQr.mutate({ id: qr.id, folderId })}
                onDelete={() => setDialog({ mode: "deleteQr", id: qr.id, name: qr.title?.trim() || qr.destinationUrl })}
              />
            ))
          ) : q ? (
            <Typography color="text.secondary">{t("dashboard.noQrMatch")}</Typography>
          ) : (
            <Typography color="text.secondary">
              {currentItems.length === 0 && qrs.length === 0 ? t("dashboard.empty") : t("dashboard.emptyFolder")}
            </Typography>
          )}
        </Stack>
        {dialogs}
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: { xs: 2, md: 4 } }}>
      <Box sx={{ mb: 3 }}>
        <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={1}>
          <Typography component="h1" variant="h4" fontWeight={800} noWrap sx={{ minWidth: 0 }}>
            {t("menu.folders")}
          </Typography>
          <Box sx={{ flexShrink: 0 }}>{headerActions}</Box>
        </Stack>
        <Typography color="text.secondary">{t("menu.foldersHint")}</Typography>
      </Box>

      <Box sx={{ width: 1, maxWidth: { md: 420 }, mb: 3 }}>
        <TextField
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t("dashboard.searchFolders")}
          size="small"
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon fontSize="small" />
                </InputAdornment>
              ),
            },
            htmlInput: { "aria-label": t("dashboard.searchFolders") },
          }}
        />
      </Box>

      {visibleFolders.length === 0 && !showUnfiledCard ? (
        <Typography color="text.secondary">{t("dashboard.noFolderMatch")}</Typography>
      ) : (
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", sm: "repeat(2, 1fr)", md: "repeat(3, 1fr)" },
            gap: 2,
          }}
        >
          {visibleFolders.map((folder) => {
            const count = qrs.filter((qr) => qr.folderId === folder.id).length;
            return (
              <Paper
                key={folder.id}
                variant="outlined"
                sx={{
                  position: "relative",
                  overflow: "hidden",
                  transition: "border-color 0.15s ease",
                  "&:hover": { borderColor: "primary.main" },
                }}
              >
                <Box
                  component={LocaleLink}
                  href={`/dashboard/qr?folder=${encodeURIComponent(folder.id)}`}
                  sx={{
                    display: "flex",
                    gap: 1.5,
                    alignItems: "flex-start",
                    p: 2,
                    pr: 6,
                    textDecoration: "none",
                    color: "inherit",
                  }}
                >
                  <FolderOutlinedIcon color="action" sx={{ mt: 0.25 }} />
                  <Box sx={{ minWidth: 0 }}>
                    <Typography fontWeight={800} sx={{ wordBreak: "break-word" }}>
                      {folder.name}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {t("dashboard.qrCount", { count })}
                    </Typography>
                  </Box>
                </Box>
                <IconButton
                  size="small"
                  aria-label={t("dashboard.folderActions")}
                  onClick={(event) => setCardMenu({ id: folder.id, name: folder.name, el: event.currentTarget })}
                  sx={{ position: "absolute", top: 8, right: 8 }}
                >
                  <MoreVertIcon fontSize="small" />
                </IconButton>
              </Paper>
            );
          })}
          {showUnfiledCard ? (
            <Paper
              variant="outlined"
              sx={{
                transition: "border-color 0.15s ease",
                "&:hover": { borderColor: "primary.main" },
              }}
            >
              <Box
                component={LocaleLink}
                href={`/dashboard/qr?folder=${UNFILED_FOLDER}`}
                sx={{
                  display: "flex",
                  gap: 1.5,
                  alignItems: "flex-start",
                  p: 2,
                  textDecoration: "none",
                  color: "inherit",
                }}
              >
                <InboxOutlinedIcon color="action" sx={{ mt: 0.25 }} />
                <Box sx={{ minWidth: 0 }}>
                  <Typography fontWeight={800}>{t("dashboard.unfiled")}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    {t("dashboard.qrCount", { count: unfiled.length })}
                  </Typography>
                </Box>
              </Box>
            </Paper>
          ) : null}
        </Box>
      )}

      {qrs.length === 0 && folderRows.length === 0 && !q ? (
        <Typography color="text.secondary" sx={{ mt: 3 }}>
          {t("dashboard.empty")}
        </Typography>
      ) : null}

      <Menu anchorEl={cardMenu?.el} open={Boolean(cardMenu)} onClose={() => setCardMenu(null)}>
        <MenuItem onClick={() => cardMenu && openRename(cardMenu.id, cardMenu.name)}>{t("dashboard.rename")}</MenuItem>
        <MenuItem onClick={() => cardMenu && openDeleteFolder(cardMenu.id, cardMenu.name)}>{t("dashboard.deleteFolder")}</MenuItem>
      </Menu>
      {dialogs}
    </Container>
  );
}
