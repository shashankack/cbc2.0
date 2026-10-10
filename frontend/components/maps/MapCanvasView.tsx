"use client";

import Box from "@mui/material/Box";
import { useEffect } from "react";
import { MapContainer, TileLayer, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import type { MapCanvasProps } from "./MapCanvas";

function Recenter({
  lat,
  lng,
  zoom,
}: {
  lat: number;
  lng: number;
  zoom: number;
}) {
  const map = useMap();
  useEffect(() => {
    map.setView([lat, lng], zoom);
  }, [lat, lng, zoom, map]);
  return null;
}

/**
 * Leaflet MapContainer. Loaded only on the client via MapCanvas.
 */
export default function MapCanvasView({
  center,
  zoom = 13,
  children,
  minZoom = 3,
  maxZoom = 18,
  scrollWheelZoom = true,
}: MapCanvasProps) {
  return (
    <Box sx={{ height: "100%", width: "100%", "& .cbc-map-divicon": { background: "none", border: "none" } }}>
      <MapContainer
        center={[center.lat, center.lng]}
        zoom={zoom}
        minZoom={minZoom}
        maxZoom={maxZoom}
        scrollWheelZoom={scrollWheelZoom}
        style={{ height: "100%", width: "100%" }}
      >
        <Recenter lat={center.lat} lng={center.lng} zoom={zoom} />
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {children}
      </MapContainer>
    </Box>
  );
}
