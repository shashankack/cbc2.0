"use client";

/**
 * StopMarkers — numbered markers for an ordered itinerary.
 *
 * @example
 * ```tsx
 * <MapCanvas center={center} zoom={13}>
 *   <StopMarkers stops={[{ id: "s1", sequence: 1, label: "Gate A", lat: 12.97, lng: 77.59, approxDistanceM: 400 }]} />
 * </MapCanvas>
 * ```
 */

import { Marker, Popup } from "react-leaflet";
import { formatApproxDistance, formatApproxMinutes } from "./approxLabels";
import { numberedStopIcon } from "./leafletIcons";
import type { StopMarkerItem } from "./types";

export type StopMarkersProps = {
  stops: StopMarkerItem[];
  color?: string;
};

export function StopMarkers({ stops, color = "#0B3D91" }: StopMarkersProps) {
  if (!stops.length) {
    return null;
  }

  return (
    <>
      {stops.map((stop) => (
        <Marker
          key={stop.id}
          position={[stop.lat, stop.lng]}
          icon={numberedStopIcon(stop.sequence, color)}
        >
          <Popup>
            <strong>
              {stop.sequence}. {stop.label}
            </strong>
            {stop.approxDistanceM != null ? (
              <div>{formatApproxDistance(stop.approxDistanceM)}</div>
            ) : null}
            {stop.approxDurationMin != null ? (
              <div>{formatApproxMinutes(stop.approxDurationMin)}</div>
            ) : null}
          </Popup>
        </Marker>
      ))}
    </>
  );
}
