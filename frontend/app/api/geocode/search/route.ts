import { NextRequest, NextResponse } from "next/server";

export type GeocodeHit = {
  label: string;
  lat: number;
  lng: number;
};

/** Bangalore metro viewbox: left, top, right, bottom (Nominatim order). */
const BLR_VIEWBOX = "77.35,13.20,77.85,12.80";

/**
 * Proxy Nominatim search so the browser avoids CORS and we send a proper User-Agent.
 * Biased toward Bangalore so "PES University" resolves to the Ring Road campus,
 * not a distant homonym.
 */
export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q")?.trim() ?? "";
  if (q.length < 2) {
    return NextResponse.json([] satisfies GeocodeHit[]);
  }

  const url = new URL("https://nominatim.openstreetmap.org/search");
  url.searchParams.set("q", q);
  url.searchParams.set("format", "jsonv2");
  url.searchParams.set("limit", "8");
  url.searchParams.set("addressdetails", "0");
  url.searchParams.set("countrycodes", "in");
  url.searchParams.set("viewbox", BLR_VIEWBOX);
  // Prefer in-viewbox hits but still allow nearby India results if needed.
  url.searchParams.set("bounded", "0");

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
      importance?: number;
    }>;

    // Soft preference: Bangalore Urban / Bengaluru labels first.
    const scored = rows
      .map((row) => {
        const lat = Number(row.lat);
        const lng = Number(row.lon);
        if (!Number.isFinite(lat) || !Number.isFinite(lng) || !row.display_name) {
          return null;
        }
        const label = row.display_name;
        const lower = label.toLowerCase();
        const inBlr =
          lower.includes("bengaluru") ||
          lower.includes("bangalore") ||
          (lat >= 12.7 && lat <= 13.25 && lng >= 77.35 && lng <= 77.85);
        return {
          label,
          lat,
          lng,
          rank: (inBlr ? 1000 : 0) + (row.importance ?? 0),
        };
      })
      .filter((h): h is GeocodeHit & { rank: number } => h != null)
      .sort((a, b) => b.rank - a.rank)
      .slice(0, 6)
      .map(({ label, lat, lng }) => ({ label, lat, lng }));

    return NextResponse.json(scored);
  } catch {
    return NextResponse.json(
      { error: "Geocode request failed." },
      { status: 502 },
    );
  }
}
