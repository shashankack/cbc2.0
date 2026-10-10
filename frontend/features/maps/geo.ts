import { brand } from "@/theme/tokens";
import type { MapLatLng, RoutePathItem, StopMarkerItem } from "@/components/maps";

export const DEFAULT_MAP_CENTER: MapLatLng = { lat: 12.9716, lng: 77.5946 };

export function centerFromPoints(points: MapLatLng[]): MapLatLng {
  if (!points.length) return DEFAULT_MAP_CENTER;
  const lat =
    points.reduce((sum, p) => sum + p.lat, 0) / points.length;
  const lng =
    points.reduce((sum, p) => sum + p.lng, 0) / points.length;
  return { lat, lng };
}

export function routeColor(index: number): string {
  const palette = [brand.royal, brand.teal, brand.navy, "#C45C26"];
  return palette[index % palette.length]!;
}

export function stopsToMarkers(
  stops: { stop_id: string; sequence: number; name: string; lat: number; lng: number }[],
): StopMarkerItem[] {
  return stops.map((s) => ({
    id: s.stop_id,
    sequence: s.sequence,
    label: s.name,
    lat: s.lat,
    lng: s.lng,
  }));
}

export function routesToPolylines(
  routes: {
    id: string;
    name: string;
    route_stops: {
      sequence: number;
      lat: number | null;
      lng: number | null;
    }[];
  }[],
): RoutePathItem[] {
  return routes.map((route, index) => {
    const ordered = [...route.route_stops].sort(
      (a, b) => a.sequence - b.sequence,
    );
    return {
      id: route.id,
      label: route.name,
      color: routeColor(index),
      positions: ordered
        .filter(
          (s): s is { sequence: number; lat: number; lng: number } =>
            s.lat != null && s.lng != null,
        )
        .map((s) => ({ lat: s.lat, lng: s.lng })),
    };
  });
}
