"use client";

import { createTheme, type ThemeOptions } from "@mui/material/styles";
import { brand, dark, light, radii } from "./tokens";

function buildTheme(mode: "light" | "dark") {
  const t = mode === "light" ? light : dark;

  const options: ThemeOptions = {
    palette: {
      mode,
      primary: {
        main: mode === "light" ? brand.navy : t.primaryAction,
        contrastText: "#FFFFFF",
      },
      secondary: {
        main: t.primaryAction,
        contrastText: "#FFFFFF",
      },
      info: {
        main: t.accent,
      },
      success: {
        main: t.success,
      },
      warning: {
        main: t.warning,
      },
      error: {
        main: t.error,
      },
      background: {
        default: t.bg,
        paper: t.surface,
      },
      text: {
        primary: t.text,
        secondary: t.textMuted,
      },
      divider: t.border,
    },
    typography: {
      fontFamily: "var(--font-geist-sans), 'Segoe UI', Helvetica, Arial, sans-serif",
      h1: { fontWeight: 700, letterSpacing: "-0.02em" },
      h2: { fontWeight: 700, letterSpacing: "-0.02em" },
      h3: { fontWeight: 700, letterSpacing: "-0.015em" },
      h4: { fontWeight: 650, letterSpacing: "-0.01em" },
      h5: { fontWeight: 650 },
      h6: { fontWeight: 600 },
      subtitle1: { fontWeight: 500 },
      button: { textTransform: "none", fontWeight: 600 },
    },
    shape: {
      borderRadius: radii.md,
    },
    components: {
      MuiCssBaseline: {
        styleOverrides: {
          body: {
            transition:
              "background-color 160ms ease, color 160ms ease, border-color 160ms ease",
          },
          "@media (prefers-reduced-motion: reduce)": {
            "*, *::before, *::after": {
              animationDuration: "0.01ms !important",
              animationIterationCount: "1 !important",
              transitionDuration: "0.01ms !important",
              scrollBehavior: "auto !important",
            },
          },
        },
      },
      MuiButton: {
        defaultProps: {
          disableElevation: true,
        },
        styleOverrides: {
          root: {
            borderRadius: radii.sm,
            paddingInline: 16,
          },
          contained: {
            "&.MuiButton-colorPrimary": {
              backgroundColor: t.primaryAction,
              "&:hover": {
                backgroundColor: mode === "light" ? brand.navy : "#7AA2F5",
              },
            },
          },
        },
      },
      MuiPaper: {
        defaultProps: {
          elevation: 0,
        },
        styleOverrides: {
          root: {
            backgroundImage: "none",
            border: `1px solid ${t.border}`,
          },
        },
      },
      MuiAppBar: {
        styleOverrides: {
          root: {
            backgroundImage: "none",
            backgroundColor: t.surface,
            color: t.text,
            borderBottom: `1px solid ${t.border}`,
          },
        },
      },
      MuiDrawer: {
        styleOverrides: {
          paper: {
            borderRight: `1px solid ${t.border}`,
            backgroundImage: "none",
          },
        },
      },
      MuiTableCell: {
        styleOverrides: {
          head: {
            fontWeight: 600,
            color: t.textMuted,
            backgroundColor: mode === "light" ? "#F8FAFC" : "#121A29",
          },
        },
      },
      MuiChip: {
        styleOverrides: {
          root: {
            fontWeight: 600,
          },
        },
      },
    },
  };

  return createTheme(options);
}

export const lightTheme = buildTheme("light");
export const darkTheme = buildTheme("dark");
