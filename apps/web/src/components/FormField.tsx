"use client";

import Box from "@mui/material/Box";
import FormHelperText from "@mui/material/FormHelperText";
import InputLabel from "@mui/material/InputLabel";
import { ReactNode } from "react";

type Props = {
  label: string;
  htmlFor: string;
  error?: string;
  hint?: string;
  children: ReactNode;
};

export function FormField({ label, htmlFor, error, hint, children }: Props) {
  return (
    <Box sx={{ mb: 2.5 }}>
      <InputLabel
        htmlFor={htmlFor}
        sx={{
          mb: 1,
          position: "static",
          transform: "none",
          fontWeight: 600,
          color: "text.primary",
          fontSize: 14,
        }}
      >
        {label}
      </InputLabel>
      {children}
      {error ? (
        <FormHelperText error sx={{ mx: 0, mt: 0.75 }}>
          {error}
        </FormHelperText>
      ) : hint ? (
        <FormHelperText sx={{ mx: 0, mt: 0.75 }}>{hint}</FormHelperText>
      ) : null}
    </Box>
  );
}
