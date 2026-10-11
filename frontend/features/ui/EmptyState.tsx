"use client";

import InboxOutlinedIcon from "@mui/icons-material/InboxOutlined";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import type { ReactNode } from "react";

type EmptyStateProps = {
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  icon?: ReactNode;
};

export default function EmptyState({
  title,
  description,
  actionLabel,
  onAction,
  icon,
}: EmptyStateProps) {
  return (
    <Box
      sx={{
        py: 3,
        px: 2,
        textAlign: "center",
        borderRadius: 2,
        border: "1px dashed",
        borderColor: "divider",
        bgcolor: "rgba(241, 245, 249, 0.55)",
      }}
    >
      <Stack spacing={1.25} sx={{ alignItems: "center" }}>
        <Box sx={{ color: "text.secondary", display: "flex" }}>
          {icon ?? <InboxOutlinedIcon fontSize="large" />}
        </Box>
        <Typography variant="subtitle1" sx={{ fontWeight: 650 }}>
          {title}
        </Typography>
        {description ? (
          <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 420 }}>
            {description}
          </Typography>
        ) : null}
        {actionLabel && onAction ? (
          <Button variant="contained" onClick={onAction} sx={{ mt: 0.5 }}>
            {actionLabel}
          </Button>
        ) : null}
      </Stack>
    </Box>
  );
}
