"use client";

import type { LatLngBoundsExpression } from "leaflet";
import { useEffect, useMemo } from "react";
import { useMap } from "react-leaflet";
import type { MapLatLng } from "./types";

export type FitBoundsProps = {
  points: MapLatLng[];
  /** Padding in pixels around the fitted bounds. */
  padding?: number;
  maxZoom?: number;
};

/**
 * Fit the map viewport to the given points (e.g. full route including depot return).
 */
export function FitBounds({
  points,
  padding = 48,
  maxZoom = 15,
}: FitBoundsProps) {
  const map = useMap();
  const key = useMemo(
    () => points.map((p) => `${p.lat.toFixed(5)},${p.lng.toFixed(5)}`).join("|"),
    [points],
  );

  useEffect(() => {
    if (points.length < 2) return;
    const bounds: LatLngBoundsExpression = points.map(
      (p) => [p.lat, p.lng] as [number, number],
    );
    try {
      map.fitBounds(bounds, { padding: [padding, padding], maxZoom, animate: false });
    } catch {
      // Ignore races while the map is tearing down.
    }
    // key captures coordinate identity without depending on array reference.
    // eslint-disable-next-line react-hooks/exhaustive-deps -- points mirrored by key
  }, [map, key, padding, maxZoom]);

  return null;
}
