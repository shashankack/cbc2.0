"use client";

import * as React from "react";
import CssBaseline from "@mui/material/CssBaseline";
import { ThemeProvider } from "@mui/material/styles";
import { COLOR_MODE_KEY } from "./tokens";
import { darkTheme, lightTheme } from "./theme";

type ColorMode = "light" | "dark";

type ColorModeContextValue = {
  mode: ColorMode;
  setMode: (mode: ColorMode) => void;
  toggleColorMode: () => void;
};

const ColorModeContext = React.createContext<ColorModeContextValue | null>(
  null,
);

function getSystemMode(): ColorMode {
  if (typeof window === "undefined") return "light";
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

function readStoredMode(): ColorMode | null {
  if (typeof window === "undefined") return null;
  const value = window.localStorage.getItem(COLOR_MODE_KEY);
  return value === "light" || value === "dark" ? value : null;
}

export function useColorMode(): ColorModeContextValue {
  const ctx = React.useContext(ColorModeContext);
  if (!ctx) {
    throw new Error("useColorMode must be used within ThemeRegistry");
  }
  return ctx;
}

export default function ThemeRegistry({
  children,
}: {
  children: React.ReactNode;
}) {
  const [mode, setModeState] = React.useState<ColorMode>("light");
  const [ready, setReady] = React.useState(false);

  React.useEffect(() => {
    const stored = readStoredMode();
    setModeState(stored ?? getSystemMode());
    setReady(true);

    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => {
      if (!readStoredMode()) {
        setModeState(mq.matches ? "dark" : "light");
      }
    };
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  React.useEffect(() => {
    if (!ready) return;
    document.documentElement.dataset.colorMode = mode;
    document.documentElement.style.colorScheme = mode;
  }, [mode, ready]);

  const setMode = React.useCallback((next: ColorMode) => {
    setModeState(next);
    window.localStorage.setItem(COLOR_MODE_KEY, next);
  }, []);

  const toggleColorMode = React.useCallback(() => {
    setMode(mode === "light" ? "dark" : "light");
  }, [mode, setMode]);

  const value = React.useMemo(
    () => ({ mode, setMode, toggleColorMode }),
    [mode, setMode, toggleColorMode],
  );

  const theme = mode === "dark" ? darkTheme : lightTheme;

  return (
    <ColorModeContext.Provider value={value}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </ThemeProvider>
    </ColorModeContext.Provider>
  );
}
