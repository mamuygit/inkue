"use client";

import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import Slider from "@mui/material/Slider";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { useCallback, useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import { useI18n } from "@/i18n/LocaleProvider";

const VIEW = 280;
const OUTPUT = 512;
const MAX_ZOOM = 3;

type Props = {
  open: boolean;
  src: string | null;
  busy?: boolean;
  onClose: () => void;
  onConfirm: (file: File) => void;
};

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

export function AvatarCropDialog({ open, src, busy, onClose, onConfirm }: Props) {
  const { t } = useI18n();
  const imgRef = useRef<HTMLImageElement | null>(null);
  const stageRef = useRef<HTMLDivElement | null>(null);
  const drag = useRef<{ x: number; y: number; ox: number; oy: number } | null>(null);
  const [natural, setNatural] = useState({ w: 0, h: 0 });
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });

  const minScale = natural.w && natural.h ? VIEW / Math.min(natural.w, natural.h) : 1;
  const scale = minScale * zoom;
  const drawW = natural.w * scale;
  const drawH = natural.h * scale;
  const maxX = Math.max(0, (drawW - VIEW) / 2);
  const maxY = Math.max(0, (drawH - VIEW) / 2);

  const clampOffset = useCallback(
    (x: number, y: number, nextZoom = zoom) => {
      const nextScale = minScale * nextZoom;
      const nextMaxX = Math.max(0, (natural.w * nextScale - VIEW) / 2);
      const nextMaxY = Math.max(0, (natural.h * nextScale - VIEW) / 2);
      return { x: clamp(x, -nextMaxX, nextMaxX), y: clamp(y, -nextMaxY, nextMaxY) };
    },
    [minScale, natural.h, natural.w, zoom],
  );

  useEffect(() => {
    if (!open) return;
    setZoom(1);
    setOffset({ x: 0, y: 0 });
    setNatural({ w: 0, h: 0 });
  }, [open, src]);

  useEffect(() => {
    const node = stageRef.current;
    if (!node) return;
    const onWheel = (event: WheelEvent) => {
      event.preventDefault();
      const next = clamp(zoom * (event.deltaY > 0 ? 0.94 : 1.06), 1, MAX_ZOOM);
      setZoom(next);
      setOffset((prev) => clampOffset(prev.x, prev.y, next));
    };
    node.addEventListener("wheel", onWheel, { passive: false });
    return () => node.removeEventListener("wheel", onWheel);
  }, [clampOffset, zoom]);

  function onImageLoad(image: HTMLImageElement) {
    setNatural({ w: image.naturalWidth, h: image.naturalHeight });
    setZoom(1);
    setOffset({ x: 0, y: 0 });
  }

  function onPointerDown(event: ReactPointerEvent<HTMLDivElement>) {
    if (busy) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    drag.current = { x: event.clientX, y: event.clientY, ox: offset.x, oy: offset.y };
  }

  function onPointerMove(event: ReactPointerEvent<HTMLDivElement>) {
    if (!drag.current) return;
    const dx = event.clientX - drag.current.x;
    const dy = event.clientY - drag.current.y;
    setOffset(clampOffset(drag.current.ox + dx, drag.current.oy + dy));
  }

  function onPointerUp() {
    drag.current = null;
  }

  async function save() {
    const image = imgRef.current;
    if (!image || !natural.w) return;
    const canvas = document.createElement("canvas");
    canvas.width = OUTPUT;
    canvas.height = OUTPUT;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const imgX = VIEW / 2 - drawW / 2 + offset.x;
    const imgY = VIEW / 2 - drawH / 2 + offset.y;
    const srcSize = VIEW / scale;
    const srcX = Math.min(Math.max((0 - imgX) / scale, 0), Math.max(0, natural.w - srcSize));
    const srcY = Math.min(Math.max((0 - imgY) / scale, 0), Math.max(0, natural.h - srcSize));
    ctx.drawImage(image, srcX, srcY, srcSize, srcSize, 0, 0, OUTPUT, OUTPUT);
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.92));
    if (!blob) return;
    onConfirm(new File([blob], "avatar.jpg", { type: "image/jpeg" }));
  }

  return (
    <Dialog open={open} onClose={busy ? undefined : onClose} fullWidth maxWidth="xs">
      <DialogTitle>{t("account.cropTitle")}</DialogTitle>
      <DialogContent>
        <Typography color="text.secondary" sx={{ mb: 2 }}>
          {t("account.cropHint")}
        </Typography>
        <Box
          ref={stageRef}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
          sx={{
            position: "relative",
            width: VIEW,
            height: VIEW,
            mx: "auto",
            overflow: "hidden",
            borderRadius: "50%",
            bgcolor: "#111",
            touchAction: "none",
            cursor: busy ? "default" : "grab",
            "&:active": { cursor: busy ? "default" : "grabbing" },
          }}
        >
          {src ? (
            <Box
              component="img"
              ref={imgRef}
              src={src}
              alt=""
              draggable={false}
              onLoad={(event) => onImageLoad(event.currentTarget)}
              sx={{
                position: "absolute",
                left: VIEW / 2 - drawW / 2 + offset.x,
                top: VIEW / 2 - drawH / 2 + offset.y,
                width: drawW || "auto",
                height: drawH || "auto",
                maxWidth: "none",
                pointerEvents: "none",
                userSelect: "none",
                visibility: natural.w ? "visible" : "hidden",
              }}
            />
          ) : null}
        </Box>
        <Stack direction="row" spacing={2} alignItems="center" sx={{ mt: 2, px: 1 }}>
          <Typography variant="body2" color="text.secondary" sx={{ flexShrink: 0 }}>
            {t("account.zoom")}
          </Typography>
          <Slider
            min={1}
            max={MAX_ZOOM}
            step={0.01}
            value={zoom}
            disabled={busy || !natural.w}
            onChange={(_, value) => {
              const next = Array.isArray(value) ? value[0] : value;
              setZoom(next);
              setOffset((prev) => clampOffset(prev.x, prev.y, next));
            }}
          />
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={busy}>
          {t("dashboard.cancel")}
        </Button>
        <Button variant="contained" onClick={() => void save()} disabled={busy || !natural.w}>
          {t("account.cropSave")}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
