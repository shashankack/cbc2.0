import { brand } from "@/theme/tokens";
import type {
  MapLatLng,
  RoutePathItem,
  StopMarkerItem,
} from "@/components/maps/types";

export const DEFAULT_MAP_CENTER: MapLatLng = { lat: 12.9716, lng: 77.5946 };

/** Assumed average bus speed for approx duration labels (not live traffic). */
const ASSUMED_BUS_KMH = 25;

export function roundCoord(n: number): number {
  return Math.round(n * 1e6) / 1e6;
}

export function haversineMeters(
  a: MapLatLng,
  b: MapLatLng,
): number {
  const R = 6371000;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(h)));
}

export function approxMinutesFromMeters(meters: number): number {
  return (meters / 1000 / ASSUMED_BUS_KMH) * 60;
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
  const ordered = [...stops].sort((a, b) => a.sequence - b.sequence);
  return ordered.map((s, i) => {
    const prev = i > 0 ? ordered[i - 1] : null;
    const dist =
      prev != null
        ? haversineMeters(
            { lat: prev.lat, lng: prev.lng },
            { lat: s.lat, lng: s.lng },
          )
        : undefined;
    return {
      // Sequence in id: campus depot can appear twice (start + end) with the same stop_id.
      id: `${s.stop_id}-${s.sequence}`,
      sequence: s.sequence,
      label: s.name,
      lat: s.lat,
      lng: s.lng,
      approxDistanceM: dist != null ? Math.round(dist) : undefined,
      approxDurationMin:
        dist != null ? Math.round(approxMinutesFromMeters(dist)) : undefined,
    };
  });
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
