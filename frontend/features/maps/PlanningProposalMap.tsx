"use client";

import { CircleMarker, Popup } from "react-leaflet";
import {
  CentroidMarkers,
  DepotMarker,
  FitBounds,
  MapCanvas,
  MapClickCapture,
  MapLegend,
  RoutePolyline,
  StopMarkers,
  type MapLatLng,
  type RoutePathItem,
  type StopMarkerItem,
} from "@/components/maps/leaflet";
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
  /** When true, map clicks set the draft pin. */
  pickMode?: boolean;
  draftPoint?: MapLatLng | null;
  onMapPick?: (point: MapLatLng) => void;
};

export default function PlanningProposalMap({
  center,
  centroids,
  polylines,
  stopMarkers,
  depot = null,
  height = 420,
  pickMode = false,
  draftPoint = null,
  onMapPick,
}: PlanningProposalMapProps) {
  const fitPoints: MapLatLng[] = [
    ...polylines.flatMap((r) => r.positions),
    ...centroids.map((c) => ({ lat: c.lat, lng: c.lng })),
    ...(depot ? [{ lat: depot.lat, lng: depot.lng }] : []),
    ...(draftPoint ? [draftPoint] : []),
  ];

  return (
    <MapCanvas
      center={center ?? depot ?? DEFAULT_MAP_CENTER}
      zoom={12}
      height={height}
      autoRecenter={fitPoints.length < 2 && !draftPoint}
      emptyMessage="No stop coordinates in this proposal yet."
      legend={
        <MapLegend
          items={[
            { id: "depot", color: "#0B3D91", label: "Campus depot (C)" },
            { id: "centroids", color: "#C45C26", label: "Pickup stops" },
            { id: "stops", color: "#0B3D91", label: "Route order" },
            { id: "routes", color: "#1B4FBF", label: "Path (dashed = return)" },
            ...(pickMode || draftPoint
              ? [{ id: "draft", color: "#2E7D32", label: "New stop pin" }]
              : []),
          ]}
        />
      }
    >
      {fitPoints.length >= 2 && !draftPoint ? (
        <FitBounds points={fitPoints} />
      ) : null}
      {pickMode && onMapPick ? <MapClickCapture onPick={onMapPick} /> : null}
      {depot ? (
        <DepotMarker
          position={{ lat: depot.lat, lng: depot.lng }}
          label={depot.label ?? "Campus depot"}
        />
      ) : null}
      <CentroidMarkers centroids={centroids} />
      <RoutePolyline routes={polylines} />
      <StopMarkers stops={stopMarkers} />
      {draftPoint ? (
        <CircleMarker
          center={[draftPoint.lat, draftPoint.lng]}
          radius={10}
          pathOptions={{
            color: "#2E7D32",
            fillColor: "#2E7D32",
            fillOpacity: 0.85,
            weight: 2,
          }}
        >
          <Popup>New stop pin</Popup>
        </CircleMarker>
      ) : null}
    </MapCanvas>
  );
}
