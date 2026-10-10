"use client";

/**
 * MapCanvas — Leaflet + OSM container.
 *
 * Distances/times shown by child layers must be labeled approximate (not live traffic).
 *
 * @example
 * ```tsx
 * <MapCanvas center={{ lat: 12.97, lng: 77.59 }} zoom={13} height={420} legend={<MapLegend />}>
 *   <StopMarkers stops={stops} />
 *   <RoutePolyline routes={routes} />
 * </MapCanvas>
 * ```
 *
 * Owner should import via next/dynamic `{ ssr: false }` if this file is pulled into a server page.
 */

import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import CircularProgress from "@mui/material/CircularProgress";
import Typography from "@mui/material/Typography";
import dynamic from "next/dynamic";
import type { ReactNode } from "react";
import { APPROX_DISCLAIMER } from "./approxLabels";
import type { MapLatLng } from "./types";

const MapCanvasView = dynamic(() => import("./MapCanvasView"), {
  ssr: false,
  loading: () => (
    <Box
      sx={{
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <CircularProgress size={28} aria-label="Loading map" />
    </Box>
  ),
});

export type MapCanvasProps = {
  center: MapLatLng;
  zoom?: number;
  height?: number | string;
  minZoom?: number;
  maxZoom?: number;
  scrollWheelZoom?: boolean;
  loading?: boolean;
  error?: string | null;
  emptyMessage?: string;
  legend?: ReactNode;
  children?: ReactNode;
  showApproxDisclaimer?: boolean;
};

export function MapCanvas({
  center,
  zoom = 13,
  height = 400,
  loading = false,
  error = null,
  emptyMessage,
  legend,
  children,
  showApproxDisclaimer = true,
  ...viewProps
}: MapCanvasProps) {
  const invalidCenter =
    !Number.isFinite(center?.lat) || !Number.isFinite(center?.lng);

  return (
    <Box>
      <Box
        sx={{
          position: "relative",
          height,
          width: "100%",
          borderRadius: 1,
          overflow: "hidden",
          bgcolor: "background.default",
          border: 1,
          borderColor: "divider",
        }}
      >
        {loading ? (
          <Box
            sx={{
              height: "100%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <CircularProgress size={28} aria-label="Loading map" />
          </Box>
        ) : error ? (
          <Box sx={{ p: 2 }}>
            <Alert severity="error">{error}</Alert>
          </Box>
        ) : invalidCenter ? (
          <Box sx={{ p: 2 }}>
            <Alert severity="info">
              {emptyMessage ?? "Map center is required to render the canvas."}
            </Alert>
          </Box>
        ) : (
          <MapCanvasView center={center} zoom={zoom} {...viewProps}>
            {children}
          </MapCanvasView>
        )}
        {legend ? (
          <Box sx={{ position: "absolute", top: 8, right: 8, zIndex: 1000 }}>
            {legend}
          </Box>
        ) : null}
      </Box>
      {showApproxDisclaimer ? (
        <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 0.75 }}>
          {APPROX_DISCLAIMER}
        </Typography>
      ) : null}
    </Box>
  );
}
