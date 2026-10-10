import { brand } from "@/theme/tokens";
import type { MapLatLng, RoutePathItem, StopMarkerItem } from "@/components/maps";

export const DEFAULT_MAP_CENTER: MapLatLng = { lat: 12.9716, lng: 77.5946 };

export function roundCoord(n: number): number {
  return Math.round(n * 1e6) / 1e6;
}

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
    // Sequence in id: campus depot can appear twice (start + end) with the same stop_id.
    id: `${s.stop_id}-${s.sequence}`,
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
      stop_id?: string;
      lat: number | null;
      lng: number | null;
    }[];
  }[],
): RoutePathItem[] {
  return routes.map((route, index) => {
    const ordered = [...route.route_stops].sort(
      (a, b) => a.sequence - b.sequence,
    );
    const positions = ordered
      .filter(
        (s): s is { sequence: number; lat: number; lng: number; stop_id?: string } =>
          s.lat != null && s.lng != null,
      )
      .map((s) => ({ lat: s.lat, lng: s.lng }));

    // Defensive close: if API omitted the final campus bookend but the first
    // stop is the depot (same stop_id at seq 1 only once), keep path as-is;
    // if first≠last by coordinates, append depot so the map always returns.
    if (positions.length >= 2) {
      const first = positions[0]!;
      const last = positions[positions.length - 1]!;
      const firstStop = ordered.find((s) => s.lat != null);
      const lastStop = [...ordered].reverse().find((s) => s.lat != null);
      const bookendedByStopId =
        firstStop?.stop_id != null &&
        lastStop?.stop_id != null &&
        firstStop.stop_id === lastStop.stop_id;
      const bookendedByCoords =
        Math.abs(first.lat - last.lat) < 1e-6 &&
        Math.abs(first.lng - last.lng) < 1e-6;
      if (!bookendedByStopId && !bookendedByCoords) {
        positions.push({ lat: first.lat, lng: first.lng });
      }
    }

    return {
      id: route.id,
      label: route.name,
      color: routeColor(index),
      positions,
    };
  });
}
