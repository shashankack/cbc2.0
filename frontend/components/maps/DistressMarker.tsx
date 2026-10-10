"use client";

/**
 * DistressMarker — GPS captured at driver distress.
 *
 * @example
 * ```tsx
 * <MapCanvas center={center} zoom={14}>
 *   <DistressMarker position={{ lat: 12.97, lng: 77.59, recordedAt: "2026-10-10T10:05:00Z" }} />
 * </MapCanvas>
 * ```
 */

import { Marker, Popup } from "react-leaflet";
import { distressIcon } from "./leafletIcons";
import type { DistressPosition } from "./types";

export type DistressMarkerProps = {
  position: DistressPosition | null;
  color?: string;
};

export function DistressMarker({
  position,
  color = "#D32F2F",
}: DistressMarkerProps) {
  if (!position) {
    return null;
  }

  return (
    <Marker position={[position.lat, position.lng]} icon={distressIcon(color)}>
      <Popup>
        <strong>{position.label ?? "Distress location"}</strong>
        {position.recordedAt ? (
          <div>Recorded: {new Date(position.recordedAt).toLocaleString()}</div>
        ) : null}
      </Popup>
    </Marker>
  );
}
