"use client";

/**
 * TripSessionControls — driver Start / End session (callbacks only).
 *
 * @example
 * ```tsx
 * <TripSessionControls status="scheduled" onStart={() => {}} onEnd={() => {}} />
 * ```
 */

import Alert from "@mui/material/Alert";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import CircularProgress from "@mui/material/CircularProgress";
import Stack from "@mui/material/Stack";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import StopIcon from "@mui/icons-material/Stop";

export type TripSessionStatus =
  | "scheduled"
  | "active"
  | "ended"
  | "loading"
  | "error";

export type TripSessionControlsProps = {
  status: TripSessionStatus;
  onStart: () => void;
  onEnd: () => void;
  error?: string | null;
  startLabel?: string;
  endLabel?: string;
  disableStart?: boolean;
  disableEnd?: boolean;
};

const STATUS_LABEL: Record<TripSessionStatus, string> = {
  scheduled: "Not started",
  active: "Session active",
  ended: "Session ended",
  loading: "Updating…",
  error: "Session error",
};

const STATUS_COLOR: Record<
  TripSessionStatus,
  "default" | "success" | "warning" | "error" | "info"
> = {
  scheduled: "default",
  active: "success",
  ended: "warning",
  loading: "info",
  error: "error",
};

export function TripSessionControls({
  status,
  onStart,
  onEnd,
  error = null,
  startLabel = "Start session",
  endLabel = "End session",
  disableStart = false,
  disableEnd = false,
}: TripSessionControlsProps) {
  const loading = status === "loading";
  const canStart = status === "scheduled" && !disableStart && !loading;
  const canEnd = status === "active" && !disableEnd && !loading;

  return (
    <Stack spacing={1.5}>
      <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
        <Chip
          size="small"
          label={STATUS_LABEL[status]}
          color={STATUS_COLOR[status]}
        />
        {loading ? <CircularProgress size={18} aria-label="Updating session" /> : null}
      </Stack>
      {error || status === "error" ? (
        <Alert severity="error">{error ?? "Could not update the trip session."}</Alert>
      ) : null}
      {status === "ended" ? (
        <Alert severity="info">
          This session has ended. QR boarding is closed and live location sharing has stopped.
        </Alert>
      ) : null}
      <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
        <Button
          variant="contained"
          color="primary"
          startIcon={<PlayArrowIcon />}
          disabled={!canStart}
          onClick={onStart}
        >
          {startLabel}
        </Button>
        <Button
          variant="outlined"
          color="warning"
          startIcon={<StopIcon />}
          disabled={!canEnd}
          onClick={onEnd}
        >
          {endLabel}
        </Button>
      </Stack>
    </Stack>
  );
}
