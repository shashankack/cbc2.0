"use client";

/**
 * RoutePolyline — ordered path between stops. Length is geometric, not live traffic.
 *
 * @example
 * ```tsx
 * <MapCanvas center={center} zoom={13}>
 *   <RoutePolyline routes={[{ id: "r1", positions: [{ lat: 12.97, lng: 77.59 }, { lat: 12.98, lng: 77.60 }] }]} />
 * </MapCanvas>
 * ```
 */

import { Polyline, Popup } from "react-leaflet";
import { APPROX_DISCLAIMER } from "./approxLabels";
import type { RoutePathItem } from "./types";

export type RoutePolylineProps = {
  routes: RoutePathItem[];
  weight?: number;
};

export function RoutePolyline({ routes, weight = 4 }: RoutePolylineProps) {
  if (!routes.length) {
    return null;
  }

  return (
    <>
      {routes.map((route) => {
        if (route.positions.length < 2) {
          return null;
        }
        return (
          <Polyline
            key={route.id}
            positions={route.positions.map((p) => [p.lat, p.lng] as [number, number])}
            pathOptions={{ color: route.color ?? "#0B3D91", weight }}
          >
            <Popup>
              {route.label ?? "Proposed route"}
              <div>{APPROX_DISCLAIMER}</div>
            </Popup>
          </Polyline>
        );
      })}
    </>
  );
}
