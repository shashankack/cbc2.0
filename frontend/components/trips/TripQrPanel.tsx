"use client";

/**
 * TripQrPanel — QR image/url + refresh callback. No token fetch inside this component.
 *
 * @example
 * ```tsx
 * <TripQrPanel
 *   status="active"
 *   qrImageUrl="/mock-qr.png"
 *   onRefresh={() => {}}
 * />
 * ```
 */

import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import CircularProgress from "@mui/material/CircularProgress";
import IconButton from "@mui/material/IconButton";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import RefreshIcon from "@mui/icons-material/Refresh";

export type TripQrPanelStatus = "idle" | "loading" | "active" | "empty" | "error" | "expired";

export type TripQrPanelProps = {
  status: TripQrPanelStatus;
  qrImageUrl?: string | null;
  qrValue?: string | null;
  onRefresh?: () => void;
  error?: string | null;
  caption?: string;
};

export function TripQrPanel({
  status,
  qrImageUrl = null,
  qrValue = null,
  onRefresh,
  error = null,
  caption = "Students scan this code once while the session is active.",
}: TripQrPanelProps) {
  const showImage = status === "active" && Boolean(qrImageUrl);

  return (
    <Paper variant="outlined" sx={{ p: 2 }}>
      <Stack spacing={1.5} sx={{ alignItems: "center" }}>
        <Stack
          direction="row"
          spacing={1}
          sx={{ width: "100%", justifyContent: "space-between", alignItems: "center" }}
        >
          <Typography variant="subtitle1">Trip QR</Typography>
          <IconButton
            aria-label="Refresh trip QR"
            onClick={onRefresh}
            disabled={!onRefresh || status === "loading"}
          >
            <RefreshIcon />
          </IconButton>
        </Stack>

        {status === "loading" ? (
          <CircularProgress size={28} aria-label="Loading QR" />
        ) : null}

        {status === "error" ? (
          <Alert severity="error" sx={{ width: "100%" }}>
            {error ?? "QR could not be loaded."}
          </Alert>
        ) : null}

        {status === "expired" ? (
          <Alert severity="warning" sx={{ width: "100%" }}>
            This QR is no longer valid. End or start a session from the driver controls.
          </Alert>
        ) : null}

        {status === "empty" || status === "idle" ? (
          <Alert severity="info" sx={{ width: "100%" }}>
            QR appears after the driver starts the trip session.
          </Alert>
        ) : null}

        {showImage ? (
          <Box
            component="img"
            src={qrImageUrl ?? undefined}
            alt="Trip boarding QR code"
            sx={{ width: 220, height: 220, objectFit: "contain", bgcolor: "common.white" }}
          />
        ) : null}

        {status === "active" && !qrImageUrl ? (
          <Alert severity="info" sx={{ width: "100%" }}>
            Session is active but no QR image URL was provided.
            {qrValue ? ` Token hint: ${qrValue}` : ""}
          </Alert>
        ) : null}

        <Typography variant="caption" color="text.secondary" align="center">
          {caption}
        </Typography>
      </Stack>
    </Paper>
  );
}
