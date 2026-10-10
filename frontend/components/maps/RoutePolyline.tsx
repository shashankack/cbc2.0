"use client";

/**
 * RoutePolyline — ordered path between stops. Length is geometric, not live traffic.
 *
 * When a path bookends the same depot (campus → pickups → campus), the return leg
 * is drawn dashed so the loop back to campus is obvious on the map.
 *
 * @example
 * ```tsx
 * <MapCanvas center={center} zoom={13}>
 *   <RoutePolyline routes={[{ id: "r1", positions: [{ lat: 12.97, lng: 77.59 }, { lat: 12.98, lng: 77.60 }] }]} />
 * </MapCanvas>
 * ```
 */

import { Fragment } from "react";
import { Polyline, Popup } from "react-leaflet";
import { APPROX_DISCLAIMER } from "./approxLabels";
import type { MapLatLng, RoutePathItem } from "./types";

export type RoutePolylineProps = {
  routes: RoutePathItem[];
  weight?: number;
};

function samePoint(a: MapLatLng, b: MapLatLng, eps = 1e-6): boolean {
  return Math.abs(a.lat - b.lat) < eps && Math.abs(a.lng - b.lng) < eps;
}

function toLatLngs(points: MapLatLng[]): [number, number][] {
  return points.map((p) => [p.lat, p.lng] as [number, number]);
}

export function RoutePolyline({ routes, weight = 4 }: RoutePolylineProps) {
  if (!routes.length) {
    return null;
  }

  return (
    <>
      {routes.map((route) => {
        const pts = route.positions;
        if (pts.length < 2) {
          return null;
        }
        const color = route.color ?? "#0B3D91";
        const closedDepot =
          pts.length >= 3 && samePoint(pts[0]!, pts[pts.length - 1]!);
        const outbound = closedDepot ? pts.slice(0, -1) : pts;
        const returnLeg = closedDepot
          ? [pts[pts.length - 2]!, pts[pts.length - 1]!]
          : null;

        return (
          <Fragment key={route.id}>
            <Polyline
              positions={toLatLngs(outbound)}
              pathOptions={{ color, weight }}
            >
              <Popup>
                {route.label ?? "Proposed route"}
                <div>{APPROX_DISCLAIMER}</div>
              </Popup>
            </Polyline>
            {returnLeg ? (
              <Polyline
                positions={toLatLngs(returnLeg)}
                pathOptions={{
                  color,
                  weight: weight + 1,
                  dashArray: "10 8",
                  opacity: 0.95,
                }}
              >
                <Popup>
                  {route.label ?? "Proposed route"} — return to campus
                  <div>{APPROX_DISCLAIMER}</div>
                </Popup>
              </Polyline>
            ) : null}
          </Fragment>
        );
      })}
    </>
  );
}
