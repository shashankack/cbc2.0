"use client";

/**
 * BoardingScanPanel — scanner viewport + success / duplicate / error / expired states.
 * Parent owns camera/decode and passes status. No API calls here.
 *
 * @example
 * ```tsx
 * <BoardingScanPanel status="success" message="Boarded for trip 7." onRetry={() => {}} />
 * ```
 */

import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import CircularProgress from "@mui/material/CircularProgress";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import type { ReactNode } from "react";

export type BoardingScanStatus =
  | "idle"
  | "scanning"
  | "success"
  | "duplicate"
  | "error"
  | "expired";

export type BoardingScanPanelProps = {
  status: BoardingScanStatus;
  message?: string | null;
  viewport?: ReactNode;
  onRetry?: () => void;
};

const STATUS_COPY: Record<
  BoardingScanStatus,
  { severity: "info" | "success" | "warning" | "error"; fallback: string }
> = {
  idle: {
    severity: "info",
    fallback: "Point your camera at the driver’s trip QR when the session is active.",
  },
  scanning: {
    severity: "info",
    fallback: "Scanning…",
  },
  success: {
    severity: "success",
    fallback: "Boarding recorded. You can close this screen.",
  },
  duplicate: {
    severity: "warning",
    fallback: "This boarding was already recorded for this trip.",
  },
  error: {
    severity: "error",
    fallback: "Scan failed. Try again or ask the driver to refresh the QR.",
  },
  expired: {
    severity: "error",
    fallback: "This trip session has ended. Further scans are not accepted.",
  },
};

export function BoardingScanPanel({
  status,
  message = null,
  viewport,
  onRetry,
}: BoardingScanPanelProps) {
  const copy = STATUS_COPY[status];
  const showRetry = Boolean(onRetry) && (status === "error" || status === "expired");

  return (
    <Paper variant="outlined" sx={{ p: 2 }}>
      <Stack spacing={2}>
        <Typography variant="subtitle1">Scan boarding QR</Typography>
        <Box
          sx={{
            position: "relative",
            minHeight: 220,
            borderRadius: 1,
            border: "2px dashed",
            borderColor: "divider",
            bgcolor: "grey.900",
            overflow: "hidden",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
          aria-label="QR scanner viewport"
        >
          {viewport ?? (
            <Typography variant="body2" sx={{ color: "grey.400", px: 2, textAlign: "center" }}>
              Scanner viewport (owner injects camera via `viewport` prop)
            </Typography>
          )}
          {status === "scanning" ? (
            <Box
              sx={{
                position: "absolute",
                inset: 0,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                bgcolor: "rgba(0,0,0,0.35)",
              }}
            >
              <CircularProgress color="inherit" aria-label="Scanning QR" />
            </Box>
          ) : null}
        </Box>
        <Alert severity={copy.severity}>{message ?? copy.fallback}</Alert>
        {showRetry ? (
          <Button variant="outlined" onClick={onRetry}>
            Try again
          </Button>
        ) : null}
      </Stack>
    </Paper>
  );
}
