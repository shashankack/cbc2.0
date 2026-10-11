"use client";

import { Marker, Popup } from "react-leaflet";
import { depotIcon } from "./leafletIcons";
import type { MapLatLng } from "./types";

export type DepotMarkerProps = {
  position: MapLatLng;
  label?: string;
  color?: string;
};

/** Campus depot — every route should start and end here. */
export function DepotMarker({
  position,
  label = "Campus depot",
  color = "#0B3D91",
}: DepotMarkerProps) {
  return (
    <Marker position={[position.lat, position.lng]} icon={depotIcon(color)}>
      <Popup>
        <strong>{label}</strong>
        <div>Routes start and return here</div>
      </Popup>
    </Marker>
  );
}
