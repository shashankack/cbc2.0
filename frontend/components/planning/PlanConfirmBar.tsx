"use client";

/**
 * PlanConfirmBar — confirm / reject a planning proposal (atomic apply is owner/API).
 *
 * @example
 * ```tsx
 * <PlanConfirmBar
 *   routeCount={6}
 *   stopCount={22}
 *   busCount={8}
 *   onConfirm={() => {}}
 *   onReject={() => {}}
 * />
 * ```
 */

import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import CircularProgress from "@mui/material/CircularProgress";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import CheckIcon from "@mui/icons-material/Check";
import CloseIcon from "@mui/icons-material/Close";

export type PlanConfirmBarProps = {
  routeCount?: number;
  stopCount?: number;
  busCount?: number;
  studentCount?: number;
  loading?: boolean;
  error?: string | null;
  disabled?: boolean;
  onConfirm: () => void;
  onReject: () => void;
};

export function PlanConfirmBar({
  routeCount,
  stopCount,
  busCount,
  studentCount,
  loading = false,
  error = null,
  disabled = false,
  onConfirm,
  onReject,
}: PlanConfirmBarProps) {
  const summary = [
    studentCount != null ? `${studentCount} students` : null,
    stopCount != null ? `${stopCount} stops` : null,
    routeCount != null ? `${routeCount} routes` : null,
    busCount != null ? `${busCount} buses` : null,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <Paper
      elevation={4}
      sx={{
        p: 2,
        position: "sticky",
        bottom: 0,
        zIndex: 10,
        borderTop: 1,
        borderColor: "divider",
      }}
    >
      <Stack
        direction={{ xs: "column", sm: "row" }}
        spacing={2}
        sx={{ alignItems: { sm: "center" }, justifyContent: "space-between" }}
      >
        <Box>
          <Typography variant="subtitle1">Ready to lock this plan?</Typography>
          <Typography variant="body2" color="text.secondary">
            {summary || "Review the routes above."} Confirming locks each student’s
            pickup and bus until the next planning cycle.
          </Typography>
        </Box>
        <Stack direction="row" spacing={1}>
          <Button
            variant="outlined"
            color="inherit"
            startIcon={<CloseIcon />}
            onClick={onReject}
            disabled={disabled || loading}
          >
            Discard draft
          </Button>
          <Button
            variant="contained"
            color="primary"
            startIcon={loading ? <CircularProgress size={16} color="inherit" /> : <CheckIcon />}
            onClick={onConfirm}
            disabled={disabled || loading}
          >
            Lock in routes
          </Button>
        </Stack>
      </Stack>
      {error ? (
        <Alert severity="error" sx={{ mt: 1.5 }}>
          {error}
        </Alert>
      ) : null}
    </Paper>
  );
}
