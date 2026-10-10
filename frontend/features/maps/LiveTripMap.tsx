"use client";

import {
  LiveBusMarker,
  MapCanvas,
  MapLegend,
  RoutePolyline,
  StopMarkers,
} from "@/components/maps";
import { brand } from "@/theme/tokens";
import { centerFromPoints, stopsToMarkers } from "./geo";

type Stop = {
  sequence: number;
  stop_id: string;
  name: string;
  lat: number;
  lng: number;
};

type LiveTripMapProps = {
  tripId: string;
  stops: Stop[];
  bus: { lat: number; lng: number; recordedAt?: string | null } | null;
  height?: number;
};

export default function LiveTripMap({
  tripId,
  stops,
  bus,
  height = 420,
}: LiveTripMapProps) {
  const ordered = [...stops].sort((a, b) => a.sequence - b.sequence);
  const stopPoints = ordered.map((s) => ({ lat: s.lat, lng: s.lng }));
  const points = bus ? [...stopPoints, bus] : stopPoints;

  if (!points.length) return null;

  return (
    <MapCanvas
      center={centerFromPoints(points)}
      zoom={13}
      height={height}
      legend={
        <MapLegend
          items={[
            { id: "stops", color: brand.royal, label: "Ordered stops" },
            { id: "bus", color: "#C45C26", label: "Live bus (driver)" },
          ]}
        />
      }
    >
      <StopMarkers stops={stopsToMarkers(ordered)} color={brand.royal} />
      <RoutePolyline
        routes={[
          {
            id: tripId,
            label: "Itinerary",
            color: brand.teal,
            positions: ordered.map((s) => ({ lat: s.lat, lng: s.lng })),
          },
        ]}
      />
      <LiveBusMarker
        position={
          bus
            ? {
                lat: bus.lat,
                lng: bus.lng,
                recordedAt: bus.recordedAt ?? undefined,
                label: "Your bus",
              }
            : null
        }
      />
    </MapCanvas>
  );
}
