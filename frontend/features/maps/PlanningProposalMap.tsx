"use client";

import {
  CentroidMarkers,
  MapCanvas,
  MapLegend,
  RoutePolyline,
  StopMarkers,
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
  height?: number;
};

export default function PlanningProposalMap({
  center,
  centroids,
  polylines,
  stopMarkers,
  height = 420,
}: PlanningProposalMapProps) {
  return (
    <MapCanvas
      center={center ?? DEFAULT_MAP_CENTER}
      zoom={12}
      height={height}
      emptyMessage="No stop coordinates in this proposal yet."
      legend={
        <MapLegend
          items={[
            { id: "centroids", color: "#C45C26", label: "Proposed stops" },
            { id: "stops", color: "#0B3D91", label: "Route order" },
            { id: "routes", color: "#1B4FBF", label: "Route path" },
          ]}
        />
      }
    >
      <CentroidMarkers centroids={centroids} />
      <RoutePolyline routes={polylines} />
      <StopMarkers stops={stopMarkers} />
    </MapCanvas>
  );
}
