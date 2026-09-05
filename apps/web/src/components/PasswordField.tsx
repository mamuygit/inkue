"use client";

import Visibility from "@mui/icons-material/Visibility";
import VisibilityOff from "@mui/icons-material/VisibilityOff";
import IconButton from "@mui/material/IconButton";
import InputAdornment from "@mui/material/InputAdornment";
import TextField, { type TextFieldProps } from "@mui/material/TextField";
import { useState } from "react";
import { useI18n } from "@/i18n/LocaleProvider";

export function PasswordField({ InputProps, ...props }: Omit<TextFieldProps, "type">) {
  const { t } = useI18n();
  const [visible, setVisible] = useState(false);

  return (
    <TextField
      {...props}
      type={visible ? "text" : "password"}
      InputProps={{
        ...InputProps,
        endAdornment: (
          <InputAdornment position="end">
            <IconButton
              type="button"
              edge="end"
              aria-label={visible ? t("login.hidePassword") : t("login.showPassword")}
              onClick={() => setVisible((v) => !v)}
              onMouseDown={(event) => event.preventDefault()}
            >
              {visible ? <VisibilityOff /> : <Visibility />}
            </IconButton>
          </InputAdornment>
        ),
      }}
    />
  );
}
