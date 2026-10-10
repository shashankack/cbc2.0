"use client";

/**
 * LiveBusMarker — driver-phone position while a trip session is active.
 * Does not estimate traffic-based arrival.
 *
 * @example
 * ```tsx
 * <MapCanvas center={center} zoom={14}>
 *   <LiveBusMarker position={{ lat: 12.97, lng: 77.59, recordedAt: "2026-10-10T10:00:00Z" }} />
 * </MapCanvas>
 * ```
 */

import { Marker, Popup } from "react-leaflet";
import { liveBusIcon } from "./leafletIcons";
import type { LiveBusPosition } from "./types";

export type LiveBusMarkerProps = {
  position: LiveBusPosition | null;
  color?: string;
};

export function LiveBusMarker({
  position,
  color = "#C45C26",
}: LiveBusMarkerProps) {
  if (!position) {
    return null;
  }

  return (
    <Marker position={[position.lat, position.lng]} icon={liveBusIcon(color)}>
      <Popup>
        <strong>{position.label ?? "Bus (driver position)"}</strong>
        {position.recordedAt ? (
          <div>Last update: {new Date(position.recordedAt).toLocaleString()}</div>
        ) : null}
        <div>Position only — no live-traffic ETA.</div>
      </Popup>
    </Marker>
  );
}
