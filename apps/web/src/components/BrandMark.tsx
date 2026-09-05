"use client";

import Box from "@mui/material/Box";

export function BrandMark({ size = 36 }: { size?: number }) {
  return (
    <Box
      component="img"
      src="/logo.svg?v=a"
      alt="Inkue"
      width={size}
      height={size}
      sx={{
        width: size,
        height: size,
        borderRadius: "50%",
        objectFit: "cover",
        display: "block",
      }}
    />
  );
}
