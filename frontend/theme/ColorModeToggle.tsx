"use client";

import DarkModeOutlinedIcon from "@mui/icons-material/DarkModeOutlined";
import LightModeOutlinedIcon from "@mui/icons-material/LightModeOutlined";
import IconButton from "@mui/material/IconButton";
import Tooltip from "@mui/material/Tooltip";
import { useColorMode } from "./ThemeRegistry";

export default function ColorModeToggle() {
  const { mode, toggleColorMode } = useColorMode();
  const next = mode === "light" ? "dark" : "light";

  return (
    <Tooltip title={`Switch to ${next} mode`}>
      <IconButton
        onClick={toggleColorMode}
        color="inherit"
        aria-label={`Switch to ${next} mode`}
        size="small"
      >
        {mode === "light" ? (
          <DarkModeOutlinedIcon fontSize="small" />
        ) : (
          <LightModeOutlinedIcon fontSize="small" />
        )}
      </IconButton>
    </Tooltip>
  );
}
