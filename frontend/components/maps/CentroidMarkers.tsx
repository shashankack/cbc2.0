"use client";

/**
 * CentroidMarkers — proposed pick/drop stop centroids.
 *
 * @example
 * ```tsx
 * <MapCanvas center={center} zoom={13}>
 *   <CentroidMarkers centroids={[{ id: "c1", label: "Cluster 1 centroid", lat: 12.97, lng: 77.59, studentCount: 18 }]} />
 * </MapCanvas>
 * ```
 */

import { Marker, Popup } from "react-leaflet";
import { centroidIcon } from "./leafletIcons";
import type { CentroidMarkerItem } from "./types";

export type CentroidMarkersProps = {
  centroids: CentroidMarkerItem[];
  color?: string;
};

export function CentroidMarkers({
  centroids,
  color = "#C45C26",
}: CentroidMarkersProps) {
  if (!centroids.length) {
    return null;
  }

  return (
    <>
      {centroids.map((centroid) => (
        <Marker
          key={centroid.id}
          position={[centroid.lat, centroid.lng]}
          icon={centroidIcon(color)}
        >
          <Popup>
            <strong>{centroid.label}</strong>
            {centroid.studentCount != null ? (
              <div>{centroid.studentCount} students (count via props)</div>
            ) : null}
          </Popup>
        </Marker>
      ))}
    </>
  );
}
