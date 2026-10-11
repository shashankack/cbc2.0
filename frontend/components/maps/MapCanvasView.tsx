"use client";

import Box from "@mui/material/Box";
import type { Map as LeafletMap } from "leaflet";
import { useEffect, useRef, useState } from "react";
import { MapContainer, TileLayer, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import type { MapCanvasProps } from "./MapCanvas";

function mapIsUsable(map: LeafletMap): boolean {
  try {
    const container = map.getContainer();
    if (!container?.isConnected) return false;
    // Leaflet sets _loaded once tiles/panes are ready.
    return Boolean((map as unknown as { _loaded?: boolean })._loaded);
  } catch {
    return false;
  }
}

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
    let cancelled = false;

    const apply = () => {
      if (cancelled || !mapIsUsable(map)) return;
      try {
        const current = map.getCenter();
        const same =
          Math.abs(current.lat - lat) < 1e-7 &&
          Math.abs(current.lng - lng) < 1e-7 &&
          map.getZoom() === zoom;
        if (same) return;
        map.setView([lat, lng], zoom, { animate: false });
      } catch {
        // Ignore races while the map is tearing down (Strict Mode / dialog close).
      }
    };

    // whenReady fires immediately if already loaded.
    map.whenReady(apply);

    return () => {
      cancelled = true;
    };
  }, [lat, lng, zoom, map]);

  return null;
}

/**
 * Leaflet MapContainer. Loaded only on the client via MapCanvas.
 *
 * Remounts with a fresh instance id so React Strict Mode / dialog open-close
 * cannot reuse a DOM node that still has a stale Leaflet `_leaflet_id`.
 */
export default function MapCanvasView({
  center,
  zoom = 13,
  children,
  minZoom = 3,
  maxZoom = 18,
  scrollWheelZoom = true,
  autoRecenter = true,
}: MapCanvasProps) {
  const mountSeq = useRef(0);
  const [instanceId, setInstanceId] = useState<number | null>(null);

  useEffect(() => {
    mountSeq.current += 1;
    const id = mountSeq.current;
    // Defer one frame so Strict Mode's immediate unmount/remount gets a clean node.
    const raf = window.requestAnimationFrame(() => {
      setInstanceId(id);
    });
    return () => {
      window.cancelAnimationFrame(raf);
      setInstanceId((current) => (current === id ? null : current));
    };
  }, []);

  if (instanceId == null) {
    return <Box sx={{ height: "100%", width: "100%" }} />;
  }

  return (
    <Box
      sx={{
        height: "100%",
        width: "100%",
        "& .cbc-map-divicon": { background: "none", border: "none" },
      }}
    >
      <MapContainer
        key={instanceId}
        center={[center.lat, center.lng]}
        zoom={zoom}
        minZoom={minZoom}
        maxZoom={maxZoom}
        scrollWheelZoom={scrollWheelZoom}
        style={{ height: "100%", width: "100%" }}
      >
        {autoRecenter ? (
          <Recenter lat={center.lat} lng={center.lng} zoom={zoom} />
        ) : null}
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {children}
      </MapContainer>
    </Box>
  );
}
