"use client";

/**
 * ClusterLayer — student/home points colored by clusterId (no clustering plugin).
 *
 * @example
 * ```tsx
 * <MapCanvas center={center} zoom={13}>
 *   <ClusterLayer points={[{ id: "p1", clusterId: "c1", lat: 12.97, lng: 77.59 }]} />
 * </MapCanvas>
 * ```
 */

import { CircleMarker, Popup, Tooltip } from "react-leaflet";
import type { ClusterPointItem } from "./types";

const CLUSTER_COLORS = [
  "#0B3D91",
  "#C45C26",
  "#2E7D32",
  "#6A1B9A",
  "#00838F",
  "#F9A825",
  "#AD1457",
  "#37474F",
];

export type ClusterLayerProps = {
  points: ClusterPointItem[];
  radius?: number;
  colors?: string[];
};

export function colorForClusterId(
  clusterId: string,
  colors: string[] = CLUSTER_COLORS,
): string {
  let hash = 0;
  for (let i = 0; i < clusterId.length; i += 1) {
    hash = (hash * 31 + clusterId.charCodeAt(i)) | 0;
  }
  return colors[Math.abs(hash) % colors.length] ?? colors[0];
}

export function ClusterLayer({
  points,
  radius = 6,
  colors = CLUSTER_COLORS,
}: ClusterLayerProps) {
  if (!points.length) {
    return null;
  }

  return (
    <>
      {points.map((point) => {
        const color = colorForClusterId(point.clusterId, colors);
        return (
          <CircleMarker
            key={point.id}
            center={[point.lat, point.lng]}
            radius={radius}
            pathOptions={{ color, fillColor: color, fillOpacity: 0.7, weight: 1 }}
          >
            <Tooltip>{`Cluster ${point.clusterId}`}</Tooltip>
            <Popup>Cluster {point.clusterId}</Popup>
          </CircleMarker>
        );
      })}
    </>
  );
}
