import type { MapLatLng } from "@/components/maps/types";

export type PlaceHit = {
  label: string;
  lat: number;
  lng: number;
};

export async function searchPlaces(query: string): Promise<PlaceHit[]> {
  const q = query.trim();
  if (q.length < 2) return [];
  const res = await fetch(`/api/geocode/search?q=${encodeURIComponent(q)}`);
  if (!res.ok) {
    throw new Error("Place search failed.");
  }
  const data = (await res.json()) as PlaceHit[] | { error: string };
  if (!Array.isArray(data)) {
    throw new Error("Place search failed.");
  }
  return data;
}

export function hitToPoint(hit: PlaceHit): MapLatLng {
  return { lat: hit.lat, lng: hit.lng };
}
