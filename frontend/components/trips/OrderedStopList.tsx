"use client";

/**
 * OrderedStopList — sequential checklist of confirmed route stops.
 *
 * @example
 * ```tsx
 * <OrderedStopList
 *   stops={[
 *     { id: "1", sequence: 1, label: "PG cluster A", approxDistanceM: 0, visited: true },
 *     { id: "2", sequence: 2, label: "Campus gate", approxDurationMin: 18 },
 *   ]}
 * />
 * ```
 */

import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Checkbox from "@mui/material/Checkbox";
import CircularProgress from "@mui/material/CircularProgress";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import Typography from "@mui/material/Typography";
import {
  APPROX_DISCLAIMER,
  formatApproxDistance,
  formatApproxMinutes,
} from "../maps/approxLabels";

export type OrderedStopListItem = {
  id: string;
  sequence: number;
  label: string;
  subtitle?: string;
  visited?: boolean;
  approxDistanceM?: number;
  approxDurationMin?: number;
};

export type OrderedStopListProps = {
  stops: OrderedStopListItem[];
  loading?: boolean;
  error?: string | null;
  emptyMessage?: string;
  /** When true, checkboxes are display-only (driver cannot reorder/mark). */
  readOnly?: boolean;
  onToggleVisited?: (stopId: string, visited: boolean) => void;
};

export function OrderedStopList({
  stops,
  loading = false,
  error = null,
  emptyMessage = "No ordered stops yet. They appear after the plan is confirmed.",
  readOnly = true,
  onToggleVisited,
}: OrderedStopListProps) {
  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", py: 3 }}>
        <CircularProgress size={28} aria-label="Loading stops" />
      </Box>
    );
  }

  if (error) {
    return <Alert severity="error">{error}</Alert>;
  }

  if (!stops.length) {
    return <Alert severity="info">{emptyMessage}</Alert>;
  }

  const sorted = [...stops].sort((a, b) => a.sequence - b.sequence);

  return (
    <Box>
      <List dense aria-label="Ordered stop itinerary">
        {sorted.map((stop) => {
          const details = [
            stop.subtitle,
            stop.approxDistanceM != null
              ? formatApproxDistance(stop.approxDistanceM)
              : null,
            stop.approxDurationMin != null
              ? formatApproxMinutes(stop.approxDurationMin)
              : null,
          ]
            .filter(Boolean)
            .join(" · ");

          return (
            <ListItem key={stop.id} disableGutters>
              <ListItemIcon sx={{ minWidth: 40 }}>
                <Checkbox
                  edge="start"
                  checked={Boolean(stop.visited)}
                  disabled={readOnly || !onToggleVisited}
                  slotProps={{
                    input: {
                      "aria-label": `Stop ${stop.sequence} ${stop.label}${stop.visited ? " visited" : ""}`,
                    },
                  }}
                  onChange={(_, checked) => onToggleVisited?.(stop.id, checked)}
                />
              </ListItemIcon>
              <ListItemText
                primary={`${stop.sequence}. ${stop.label}`}
                secondary={details || undefined}
              />
            </ListItem>
          );
        })}
      </List>
      <Typography variant="caption" color="text.secondary">
        {APPROX_DISCLAIMER}
      </Typography>
    </Box>
  );
}
