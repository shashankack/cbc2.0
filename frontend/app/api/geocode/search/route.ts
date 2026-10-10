import { NextRequest, NextResponse } from "next/server";

export type GeocodeHit = {
  label: string;
  lat: number;
  lng: number;
};

/**
 * Proxy Nominatim search so the browser avoids CORS and we send a proper User-Agent.
 * OSM usage policy: identify the app; do not hammer the public endpoint.
 */
export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q")?.trim() ?? "";
  if (q.length < 2) {
    return NextResponse.json([] satisfies GeocodeHit[]);
  }

  const url = new URL("https://nominatim.openstreetmap.org/search");
  url.searchParams.set("q", q);
  url.searchParams.set("format", "jsonv2");
  url.searchParams.set("limit", "6");
  url.searchParams.set("addressdetails", "0");

  try {
    const upstream = await fetch(url.toString(), {
      headers: {
        Accept: "application/json",
        "User-Agent": "UniTransit-CBC/1.0 (campus-depot-picker; local-dev)",
      },
      cache: "no-store",
    });
    if (!upstream.ok) {
      return NextResponse.json(
        { error: "Geocode upstream failed." },
        { status: 502 },
      );
    }
    const rows = (await upstream.json()) as Array<{
      display_name?: string;
      lat?: string;
      lon?: string;
    }>;
    const hits: GeocodeHit[] = rows
      .map((row) => {
        const lat = Number(row.lat);
        const lng = Number(row.lon);
        if (!Number.isFinite(lat) || !Number.isFinite(lng) || !row.display_name) {
          return null;
        }
        return { label: row.display_name, lat, lng };
      })
      .filter((h): h is GeocodeHit => h != null);
    return NextResponse.json(hits);
  } catch {
    return NextResponse.json(
      { error: "Geocode request failed." },
      { status: 502 },
    );
  }
}
