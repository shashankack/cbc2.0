"use client";

import {
  CentroidMarkers,
  DepotMarker,
  FitBounds,
  MapCanvas,
  MapLegend,
  RoutePolyline,
  StopMarkers,
  type MapLatLng,
  type RoutePathItem,
  type StopMarkerItem,
} from "@/components/maps";
import { DEFAULT_MAP_CENTER } from "./geo";

type Centroid = {
  id: string;
  label: string;
  lat: number;
  lng: number;
};

type PlanningProposalMapProps = {
  center: { lat: number; lng: number } | null;
  centroids: Centroid[];
  polylines: RoutePathItem[];
  stopMarkers: StopMarkerItem[];
  depot?: { lat: number; lng: number; label?: string } | null;
  height?: number;
};

export default function PlanningProposalMap({
  center,
  centroids,
  polylines,
  stopMarkers,
  depot = null,
  height = 420,
}: PlanningProposalMapProps) {
  const fitPoints: MapLatLng[] = [
    ...polylines.flatMap((r) => r.positions),
    ...centroids.map((c) => ({ lat: c.lat, lng: c.lng })),
    ...(depot ? [{ lat: depot.lat, lng: depot.lng }] : []),
  ];

  return (
    <MapCanvas
      center={center ?? depot ?? DEFAULT_MAP_CENTER}
      zoom={12}
      height={height}
      autoRecenter={fitPoints.length < 2}
      emptyMessage="No stop coordinates in this proposal yet."
      legend={
        <MapLegend
          items={[
            { id: "depot", color: "#0B3D91", label: "Campus depot (C)" },
            { id: "centroids", color: "#C45C26", label: "Pickup stops" },
            { id: "stops", color: "#0B3D91", label: "Route order" },
            { id: "routes", color: "#1B4FBF", label: "Path (dashed = return)" },
          ]}
        />
      }
    >
      {fitPoints.length >= 2 ? <FitBounds points={fitPoints} /> : null}
      {depot ? (
        <DepotMarker
          position={{ lat: depot.lat, lng: depot.lng }}
          label={depot.label ?? "Campus depot"}
        />
      ) : null}
      <CentroidMarkers centroids={centroids} />
      <RoutePolyline routes={polylines} />
      <StopMarkers stops={stopMarkers} />
    </MapCanvas>
  );
}
