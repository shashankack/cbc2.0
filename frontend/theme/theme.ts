"use client";

import { createTheme, type ThemeOptions } from "@mui/material/styles";
import { brand, light, radii } from "./tokens";

const t = light;

const options: ThemeOptions = {
  palette: {
    mode: "light",
    primary: {
      main: t.primaryAction,
      light: brand.teal,
      dark: "#0F766E",
      contrastText: "#FFFFFF",
    },
    secondary: {
      main: brand.amber,
      light: "#FBBF24",
      dark: "#D97706",
      contrastText: "#020617",
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
    fontFamily:
      "var(--font-geist-sans), system-ui, -apple-system, 'Segoe UI', sans-serif",
    h1: {
      fontWeight: 800,
      letterSpacing: "-0.03em",
      lineHeight: 1.08,
    },
    h2: { fontWeight: 750, letterSpacing: "-0.025em" },
    h3: { fontWeight: 700, letterSpacing: "-0.02em" },
    h4: { fontWeight: 700, letterSpacing: "-0.015em" },
    h5: { fontWeight: 700, letterSpacing: "-0.01em" },
    h6: { fontWeight: 650 },
    subtitle1: { fontWeight: 500 },
    button: { textTransform: "none", fontWeight: 600 },
  },
  shape: {
    borderRadius: radii.md,
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
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
          borderRadius: 12,
          paddingInline: 18,
        },
        contained: {
          "&.MuiButton-colorPrimary": {
            backgroundColor: t.primaryAction,
            color: "#FFFFFF",
            "&:hover": {
              backgroundColor: "#0F766E",
              boxShadow: "0 8px 20px -8px rgba(13, 148, 136, 0.35)",
            },
          },
        },
        sizeLarge: {
          paddingBlock: 12,
          fontSize: "1rem",
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
          borderRadius: radii.md,
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundImage: "none",
          backgroundColor: "rgba(255,255,255,0.9)",
          backdropFilter: "blur(10px)",
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
          backgroundColor: t.surface,
        },
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          backgroundColor: "#FFFFFF",
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        head: {
          fontWeight: 600,
          color: t.textMuted,
          backgroundColor: "#F8FAFC",
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
    MuiListItemButton: {
      styleOverrides: {
        root: {
          borderRadius: 10,
          "&.Mui-selected": {
            backgroundColor: "rgba(13, 148, 136, 0.1)",
            "&:hover": {
              backgroundColor: "rgba(13, 148, 136, 0.14)",
            },
          },
        },
      },
    },
  },
};

export const lightTheme = createTheme(options);
