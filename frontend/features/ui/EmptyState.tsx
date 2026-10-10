"use client";

import InboxOutlinedIcon from "@mui/icons-material/InboxOutlined";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Paper from "@mui/material/Paper";
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
    <Paper sx={{ p: 4, textAlign: "center" }}>
      <Stack spacing={1.5} sx={{ alignItems: "center" }}>
        <Box sx={{ color: "text.secondary", display: "flex" }}>
          {icon ?? <InboxOutlinedIcon fontSize="large" />}
        </Box>
        <Typography variant="h6" sx={{ fontWeight: 650 }}>
          {title}
        </Typography>
        {description ? (
          <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 420 }}>
            {description}
          </Typography>
        ) : null}
        {actionLabel && onAction ? (
          <Button variant="contained" onClick={onAction} sx={{ mt: 1 }}>
            {actionLabel}
          </Button>
        ) : null}
      </Stack>
    </Paper>
  );
}
