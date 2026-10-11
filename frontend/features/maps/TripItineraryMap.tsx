"use client";

/**
 * Client-only itinerary map. Leaflet must not be imported from route modules
 * (SSR/prefetch will throw and Next reports a segment validation failure).
 */

import {
  MapCanvas,
  MapLegend,
  RoutePolyline,
  StopMarkers,
} from "@/components/maps/leaflet";
import { brand } from "@/theme/tokens";
import { centerFromPoints, stopsToMarkers } from "./geo";

type Stop = {
  sequence: number;
  stop_id: string;
  name: string;
  lat: number;
  lng: number;
};

type TripItineraryMapProps = {
  routeId: string;
  stops: Stop[];
  height?: number;
};

export default function TripItineraryMap({
  routeId,
  stops,
  height = 360,
}: TripItineraryMapProps) {
  if (!stops.length) return null;

  const ordered = [...stops].sort((a, b) => a.sequence - b.sequence);

  return (
    <MapCanvas
      center={centerFromPoints(ordered.map((s) => ({ lat: s.lat, lng: s.lng })))}
      zoom={13}
      height={height}
      legend={
        <MapLegend
          items={[
            {
              id: "stops",
              color: brand.royal,
              label: "Stops in visit order",
            },
          ]}
        />
      }
    >
      <StopMarkers stops={stopsToMarkers(ordered)} color={brand.royal} />
      <RoutePolyline
        routes={[
          {
            id: routeId,
            label: "Itinerary",
            color: brand.teal,
            positions: ordered.map((s) => ({ lat: s.lat, lng: s.lng })),
          },
        ]}
      />
    </MapCanvas>
  );
}
