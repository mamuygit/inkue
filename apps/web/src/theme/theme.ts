import { createTheme } from "@mui/material/styles";
import { COLORS } from "@mamuy/shared";
import type { Locale } from "@/i18n/config";

export function createAppTheme(locale: Locale) {
  return createTheme({
  palette: {
    mode: "light",
    primary: { main: COLORS.primary, dark: COLORS.primaryDark, contrastText: "#fff" },
    secondary: { main: COLORS.accent, contrastText: "#fff" },
    success: { main: COLORS.success },
    background: { default: COLORS.paper, paper: "#FFFFFF" },
    text: { primary: COLORS.ink, secondary: "#475569" },
  },
  shape: { borderRadius: 12 },
  typography: {
    fontFamily:
      locale === "th"
        ? "var(--font-sans-th), system-ui, sans-serif"
        : "var(--font-sans-en), system-ui, sans-serif",
    h1: { fontWeight: 700, letterSpacing: "-0.03em" },
    h2: { fontWeight: 700, letterSpacing: "-0.02em" },
    h3: { fontWeight: 700 },
    button: { textTransform: "none", fontWeight: 700 },
  },
  components: {
    MuiButton: {
      defaultProps: { disableElevation: true },
      styleOverrides: {
        root: { borderRadius: 12, paddingInline: 20, paddingBlock: 10 },
      },
    },
    MuiTextField: {
      defaultProps: { fullWidth: true, size: "medium", hiddenLabel: true },
    },
    MuiPaper: {
      styleOverrides: { root: { backgroundImage: "none" } },
    },
  },
  });
}
