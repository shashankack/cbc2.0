/** UniTransit semantic design tokens */

export const brand = {
  navy: "#0B1F3A",
  royal: "#1B4FBF",
  teal: "#0D9488",
} as const;

export const light = {
  bg: "#F4F6F9",
  surface: "#FFFFFF",
  text: "#0B1F3A",
  textMuted: "#5B6575",
  border: "#E2E8F0",
  success: "#15803D",
  warning: "#D97706",
  error: "#DC2626",
  primaryAction: "#1B4FBF",
  accent: "#0D9488",
} as const;

export const dark = {
  bg: "#0B1220",
  surface: "#151E2E",
  text: "#E8EEF7",
  textMuted: "#9AA6B2",
  border: "#2A3548",
  success: "#4ADE80",
  warning: "#FBBF24",
  error: "#F87171",
  primaryAction: "#5B8DEF",
  accent: "#2DD4BF",
} as const;

export const space = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
} as const;

export const radii = {
  sm: 6,
  md: 10,
  lg: 14,
} as const;

export const COLOR_MODE_KEY = "unitransit-color-mode";
