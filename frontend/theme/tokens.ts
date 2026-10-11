/** UniTransit semantic design tokens — teal / amber / slate (light only). */

export const brand = {
  navy: "#0F172A",
  royal: "#0D9488",
  teal: "#14B8A6",
  amber: "#F59E0B",
} as const;

export const light = {
  bg: "#F1F5F9",
  surface: "#FFFFFF",
  text: "#0F172A",
  textMuted: "#64748B",
  border: "#E2E8F0",
  success: "#15803D",
  warning: "#D97706",
  error: "#DC2626",
  primaryAction: "#0D9488",
  accent: "#14B8A6",
  glow: "rgba(20, 184, 166, 0.12)",
} as const;

export const space = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
} as const;

export const radii = {
  sm: 10,
  md: 14,
  lg: 20,
  pill: 999,
} as const;
