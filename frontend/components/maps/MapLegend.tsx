"use client";

/**
 * MapLegend — overlay key for planning / live trip maps.
 *
 * @example
 * ```tsx
 * <MapCanvas center={center} zoom={13} legend={<MapLegend />} />
 * ```
 */

import Box from "@mui/material/Box";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { APPROX_DISCLAIMER } from "./approxLabels";
import type { MapLegendItem } from "./types";

const DEFAULT_ITEMS: MapLegendItem[] = [
  { id: "stops", color: "#0B3D91", label: "Ordered stops" },
  { id: "centroids", color: "#C45C26", label: "Centroids" },
  { id: "clusters", color: "#2E7D32", label: "Cluster points" },
  { id: "bus", color: "#C45C26", label: "Live bus (driver)" },
  { id: "distress", color: "#D32F2F", label: "Distress" },
];

export type MapLegendProps = {
  items?: MapLegendItem[];
  title?: string;
};

export function MapLegend({
  items = DEFAULT_ITEMS,
  title = "Map key",
}: MapLegendProps) {
  return (
    <Paper elevation={3} sx={{ p: 1.25, maxWidth: 240 }}>
      <Typography variant="subtitle2" sx={{ mb: 1 }}>
        {title}
      </Typography>
      <Stack spacing={0.75}>
        {items.map((item) => (
          <Stack key={item.id} direction="row" spacing={1} sx={{ alignItems: "center" }}>
            <Box
              sx={{
                width: 12,
                height: 12,
                borderRadius: "50%",
                bgcolor: item.color,
                flexShrink: 0,
              }}
              aria-hidden
            />
            <Typography variant="caption">{item.label}</Typography>
          </Stack>
        ))}
      </Stack>
      <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 1 }}>
        {APPROX_DISCLAIMER}
      </Typography>
    </Paper>
  );
}
