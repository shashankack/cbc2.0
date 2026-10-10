"use client";

/**
 * EmergencyReallocationCard — boarded, remaining, suggested buses (all via props).
 *
 * @example
 * ```tsx
 * <EmergencyReallocationCard
 *   boardedCount={12}
 *   remainingCount={9}
 *   suggestedBuses={[{ id: "b2", label: "KA-01-1234", capacity: 40, availableSeats: 11, approxDistanceM: 800 }]}
 *   onConfirm={() => {}}
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
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemText from "@mui/material/ListItemText";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import {
  APPROX_DISCLAIMER,
  formatApproxDistance,
} from "../maps/approxLabels";

export type SuggestedBus = {
  id: string;
  label: string;
  capacity: number;
  availableSeats: number;
  /** Approximate distance to distress coords. Never live traffic. */
  approxDistanceM?: number;
};

export type EmergencyReallocationCardProps = {
  boardedCount: number;
  remainingCount: number;
  suggestedBuses: SuggestedBus[];
  loading?: boolean;
  error?: string | null;
  emptyMessage?: string;
  onConfirm?: () => void;
  onDismiss?: () => void;
};

export function EmergencyReallocationCard({
  boardedCount,
  remainingCount,
  suggestedBuses,
  loading = false,
  error = null,
  emptyMessage = "No available buses were suggested.",
  onConfirm,
  onDismiss,
}: EmergencyReallocationCardProps) {
  return (
    <Card variant="outlined">
      <CardContent>
        <Stack spacing={2}>
          <Typography variant="subtitle1">Emergency reallocation</Typography>
          <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
            <Chip label={`Boarded: ${boardedCount}`} color="success" variant="outlined" />
            <Chip label={`Remaining pickups: ${remainingCount}`} color="warning" variant="outlined" />
          </Stack>
          <Typography variant="body2" color="text.secondary">
            Rule-based suggestion from headcount vs capacity. Not an ML prediction.
          </Typography>
          {loading ? (
            <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
              <CircularProgress size={18} aria-label="Loading reallocation" />
              <Typography variant="body2">Loading suggestion…</Typography>
            </Stack>
          ) : null}
          {error ? <Alert severity="error">{error}</Alert> : null}
          {!loading && suggestedBuses.length === 0 ? (
            <Alert severity="info">{emptyMessage}</Alert>
          ) : (
            <List dense aria-label="Suggested buses">
              {suggestedBuses.map((bus) => (
                <ListItem key={bus.id} disableGutters>
                  <ListItemText
                    primary={bus.label}
                    secondary={[
                      `Capacity ${bus.capacity}`,
                      `${bus.availableSeats} seats free`,
                      bus.approxDistanceM != null
                        ? formatApproxDistance(bus.approxDistanceM)
                        : null,
                    ]
                      .filter(Boolean)
                      .join(" · ")}
                  />
                </ListItem>
              ))}
            </List>
          )}
          <Typography variant="caption" color="text.secondary">
            {APPROX_DISCLAIMER}
          </Typography>
        </Stack>
      </CardContent>
      <CardActions sx={{ px: 2, pb: 2 }}>
        <Button
          variant="contained"
          color="error"
          onClick={onConfirm}
          disabled={loading || !onConfirm || suggestedBuses.length === 0}
        >
          Quick-confirm
        </Button>
        <Button onClick={onDismiss} disabled={loading || !onDismiss}>
          Dismiss
        </Button>
      </CardActions>
    </Card>
  );
}
