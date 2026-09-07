"use client";

import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import DriveFileMoveOutlinedIcon from "@mui/icons-material/DriveFileMoveOutlined";
import Box from "@mui/material/Box";
import CircularProgress from "@mui/material/CircularProgress";
import IconButton from "@mui/material/IconButton";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { useState, type MouseEvent } from "react";
import { LocaleLink } from "@/components/LocaleLink";
import { type FolderRecord, type QrRecord } from "@/components/QrEditor";
import { useI18n } from "@/i18n/LocaleProvider";

type Props = {
  qr: QrRecord;
  folders: FolderRecord[];
  currentFolderId: string | null;
  moving?: boolean;
  onMove: (folderId: string | null) => void;
  onDelete: () => void;
};

export function QrListRow({ qr, folders, currentFolderId, moving, onMove, onDelete }: Props) {
  const { t } = useI18n();
  const [anchor, setAnchor] = useState<HTMLElement | null>(null);
  const title = qr.title?.trim();
  const destinations = folders.filter((folder) => folder.id !== currentFolderId);
  const canUnfile = currentFolderId !== null;
  const canMove = destinations.length > 0 || canUnfile;

  const openMove = (event: MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setAnchor(event.currentTarget);
  };

  return (
    <Paper variant="outlined" sx={{ p: 2 }}>
      <Stack direction="row" spacing={2} alignItems="flex-start">
        <Box
          component={LocaleLink}
          href={`/dashboard/${qr.id}`}
          sx={{
            display: "flex",
            gap: 2,
            alignItems: "flex-start",
            flex: 1,
            minWidth: 0,
            textDecoration: "none",
            color: "inherit",
            "&:hover .qr-title": { color: "primary.main" },
          }}
        >
          <Box
            component="img"
            src={qr.imageUrl}
            alt=""
            sx={{ width: 72, height: 72, borderRadius: 1, bgcolor: "#fff", flexShrink: 0 }}
          />
          <Box sx={{ minWidth: 0, flex: 1 }}>
            <Stack direction="row" spacing={1.5} alignItems="baseline" justifyContent="space-between" sx={{ mb: 0.5 }}>
              <Typography className="qr-title" fontWeight={700} sx={{ wordBreak: "break-word" }}>
                {title || t("dashboard.untitled")}
              </Typography>
              <Typography variant="body2" fontWeight={700} color="text.secondary" sx={{ whiteSpace: "nowrap", flexShrink: 0 }}>
                {t("dashboard.scanCount", { count: qr.scanCount })}
              </Typography>
            </Stack>
            <Typography variant="body2" sx={{ wordBreak: "break-all" }}>
              {qr.destinationUrl}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ wordBreak: "break-all" }}>
              {qr.scanUrl}
            </Typography>
          </Box>
        </Box>
        <Stack direction="row" spacing={0.5} sx={{ flexShrink: 0, mt: -0.5 }}>
          {canMove ? (
            <IconButton size="small" aria-label={t("dashboard.moveTo")} onClick={openMove} disabled={moving}>
              {moving ? <CircularProgress size={18} /> : <DriveFileMoveOutlinedIcon fontSize="small" />}
            </IconButton>
          ) : null}
          <IconButton
            size="small"
            aria-label={t("dashboard.deleteQr")}
            onClick={() => onDelete()}
            disabled={moving}
          >
            <DeleteOutlineIcon fontSize="small" />
          </IconButton>
        </Stack>
      </Stack>
      <Menu anchorEl={anchor} open={Boolean(anchor)} onClose={() => setAnchor(null)}>
        {destinations.map((folder) => (
          <MenuItem
            key={folder.id}
            onClick={() => {
              setAnchor(null);
              onMove(folder.id);
            }}
          >
            {folder.name}
          </MenuItem>
        ))}
        {canUnfile ? (
          <MenuItem
            onClick={() => {
              setAnchor(null);
              onMove(null);
            }}
          >
            {t("dashboard.unfiled")}
          </MenuItem>
        ) : null}
      </Menu>
    </Paper>
  );
}
