"use client";

/**
 * MapClickCapture — call onPick when the user clicks the map.
 * Must be rendered as a child of MapCanvas / MapContainer.
 */

import { useEffect } from "react";
import { useMap, useMapEvents } from "react-leaflet";
import type { MapLatLng } from "./types";

export type MapClickCaptureProps = {
  onPick: (point: MapLatLng) => void;
  /** Invalidate size after mount (e.g. dialog open). */
  invalidateOnMount?: boolean;
};

export function MapClickCapture({
  onPick,
  invalidateOnMount = false,
}: MapClickCaptureProps) {
  const map = useMap();

  useEffect(() => {
    if (!invalidateOnMount) return;
    let cancelled = false;
    const t = window.setTimeout(() => {
      if (cancelled) return;
      try {
        const container = map.getContainer();
        if (!container?.isConnected) return;
        map.invalidateSize();
      } catch {
        // Map may already be disposed (dialog close / Strict Mode).
      }
    }, 120);
    return () => {
      cancelled = true;
      window.clearTimeout(t);
    };
  }, [invalidateOnMount, map]);

  useMapEvents({
    click(e) {
      onPick({ lat: e.latlng.lat, lng: e.latlng.lng });
    },
  });

  return null;
}
