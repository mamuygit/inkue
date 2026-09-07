"use client";

import Avatar from "@mui/material/Avatar";
import Box from "@mui/material/Box";
import {
  AVATAR_FRAME_INNER_SCALE,
  avatarFrameSrc,
  effectiveAvatarFrame,
  parseAvatarFrame,
  type AvatarFrame,
} from "@mamuy/shared";

function initialFromEmail(email: string) {
  const letter = email.trim().charAt(0);
  return letter ? letter.toUpperCase() : "?";
}

type Props = {
  src?: string | null;
  email: string;
  frame?: string | null;
  createdAt?: string | Date | null;
  size: number;
};

export function ProfileAvatar({ src, email, frame, createdAt, size }: Props) {
  const parsed = parseAvatarFrame(frame);
  const resolved: AvatarFrame = createdAt ? effectiveAvatarFrame(parsed, createdAt, email) : parsed;
  const overlay = avatarFrameSrc(resolved);
  const inner = overlay && resolved !== "none" ? AVATAR_FRAME_INNER_SCALE[resolved] : 1;
  const photoSize = Math.round(size * inner);
  const fontSize = Math.max(12, Math.round(photoSize * 0.36));

  if (!overlay) {
    return (
      <Avatar
        src={src ?? undefined}
        alt=""
        sx={{ width: size, height: size, bgcolor: "primary.main", fontSize, fontWeight: 800, flexShrink: 0 }}
      >
        {initialFromEmail(email)}
      </Avatar>
    );
  }

  return (
    <Box sx={{ position: "relative", width: size, height: size, flexShrink: 0 }}>
      <Avatar
        src={src ?? undefined}
        alt=""
        sx={{
          width: photoSize,
          height: photoSize,
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          bgcolor: "primary.main",
          fontSize,
          fontWeight: 800,
        }}
      >
        {initialFromEmail(email)}
      </Avatar>
      <Box
        component="img"
        src={overlay}
        alt=""
        draggable={false}
        sx={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          pointerEvents: "none",
          userSelect: "none",
          display: "block",
          filter: "drop-shadow(0 1px 1px rgba(15, 23, 42, 0.18))",
        }}
      />
    </Box>
  );
}
