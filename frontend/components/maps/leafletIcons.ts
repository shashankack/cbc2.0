import L from "leaflet";

function safeHex(color: string): string {
  return /^#[0-9A-Fa-f]{6}$/.test(color) ? color : "#0B3D91";
}

function circleHtml(color: string, inner: string, size: number): string {
  const hex = safeHex(color);
  return `<div style="width:${size}px;height:${size}px;border-radius:50%;background:${hex};color:#fff;display:flex;align-items:center;justify-content:center;font:700 12px/1 sans-serif;border:2px solid #fff;box-shadow:0 1px 4px rgba(0,0,0,.35);">${inner}</div>`;
}

export function numberedStopIcon(sequence: number, color = "#0B3D91"): L.DivIcon {
  return L.divIcon({
    className: "cbc-map-divicon",
    html: circleHtml(color, String(sequence), 28),
    iconSize: [28, 28],
    iconAnchor: [14, 14],
    popupAnchor: [0, -14],
  });
}

export function centroidIcon(color = "#C45C26"): L.DivIcon {
  return L.divIcon({
    className: "cbc-map-divicon",
    html: `<div style="width:18px;height:18px;background:${safeHex(color)};transform:rotate(45deg);border:2px solid #fff;box-shadow:0 1px 4px rgba(0,0,0,.35);"></div>`,
    iconSize: [18, 18],
    iconAnchor: [9, 9],
    popupAnchor: [0, -10],
  });
}

export function liveBusIcon(color = "#C45C26"): L.DivIcon {
  return L.divIcon({
    className: "cbc-map-divicon",
    html: circleHtml(color, "B", 32),
    iconSize: [32, 32],
    iconAnchor: [16, 16],
    popupAnchor: [0, -16],
  });
}

export function distressIcon(color = "#D32F2F"): L.DivIcon {
  return L.divIcon({
    className: "cbc-map-divicon",
    html: circleHtml(color, "!", 32),
    iconSize: [32, 32],
    iconAnchor: [16, 16],
    popupAnchor: [0, -16],
  });
}

export function depotIcon(color = "#0B3D91"): L.DivIcon {
  return L.divIcon({
    className: "cbc-map-divicon",
    html: circleHtml(color, "C", 32),
    iconSize: [32, 32],
    iconAnchor: [16, 16],
    popupAnchor: [0, -16],
  });
}
