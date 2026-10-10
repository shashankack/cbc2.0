"use client";

/**
 * OutlierReviewCard — snap vs needs_admin_review (no micro-routes for 1–2 students).
 *
 * @example
 * ```tsx
 * <OutlierReviewCard
 *   studentLabel="Student 1042"
 *   status="needs_admin_review"
 *   approxDistanceM={1400}
 *   nearestStopLabel="Cluster 3 centroid"
 *   onSnap={() => {}}
 *   onNeedsReview={() => {}}
 * />
 * ```
 */

import Alert from "@mui/material/Alert";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import CardActions from "@mui/material/CardActions";
import CardContent from "@mui/material/CardContent";
import Chip from "@mui/material/Chip";
import CircularProgress from "@mui/material/CircularProgress";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import {
  APPROX_DISCLAIMER,
  formatApproxDistance,
} from "../maps/approxLabels";

export type OutlierStatus = "snap" | "needs_admin_review";

export type OutlierReviewCardProps = {
  studentLabel: string;
  status: OutlierStatus;
  approxDistanceM?: number;
  nearestStopLabel?: string;
  loading?: boolean;
  error?: string | null;
  onSnap?: () => void;
  onNeedsReview?: () => void;
  onAssignStop?: () => void;
};

const STATUS_CHIP: Record<OutlierStatus, { label: string; color: "success" | "warning" }> = {
  snap: { label: "Snap to nearest stop", color: "success" },
  needs_admin_review: { label: "Needs admin review", color: "warning" },
};

export function OutlierReviewCard({
  studentLabel,
  status,
  approxDistanceM,
  nearestStopLabel,
  loading = false,
  error = null,
  onSnap,
  onNeedsReview,
  onAssignStop,
}: OutlierReviewCardProps) {
  const chip = STATUS_CHIP[status];

  return (
    <Card variant="outlined">
      <CardContent>
        <Stack spacing={1}>
          <Stack direction="row" spacing={1} sx={{ alignItems: "center", justifyContent: "space-between" }}>
            <Typography variant="subtitle1">{studentLabel}</Typography>
            {loading ? (
              <CircularProgress size={18} aria-label="Updating outlier" />
            ) : (
              <Chip size="small" label={chip.label} color={chip.color} />
            )}
          </Stack>
          {nearestStopLabel ? (
            <Typography variant="body2" color="text.secondary">
              Nearest centroid: {nearestStopLabel}
            </Typography>
          ) : null}
          {approxDistanceM != null ? (
            <Typography variant="body2">
              {formatApproxDistance(approxDistanceM)} from nearest centroid
            </Typography>
          ) : null}
          <Typography variant="caption" color="text.secondary">
            {APPROX_DISCLAIMER} Sparse 1–2 student groups are not auto-routed.
          </Typography>
          {error ? <Alert severity="error">{error}</Alert> : null}
        </Stack>
      </CardContent>
      <CardActions sx={{ px: 2, pb: 2 }}>
        <Button size="small" onClick={onSnap} disabled={loading || !onSnap}>
          Snap to stop
        </Button>
        <Button size="small" onClick={onNeedsReview} disabled={loading || !onNeedsReview}>
          Keep for review
        </Button>
        <Button size="small" onClick={onAssignStop} disabled={loading || !onAssignStop}>
          Assign stop
        </Button>
      </CardActions>
    </Card>
  );
}
