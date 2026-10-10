/**
 * Leaflet / react-leaflet map modules — client-only.
 * Import only from `next/dynamic({ ssr: false })` map features.
 */

export { MapCanvas } from "./MapCanvas";
export type { MapCanvasProps } from "./MapCanvas";
export { StopMarkers } from "./StopMarkers";
export type { StopMarkersProps } from "./StopMarkers";
export { ClusterLayer, colorForClusterId } from "./ClusterLayer";
export type { ClusterLayerProps } from "./ClusterLayer";
export { CentroidMarkers } from "./CentroidMarkers";
export type { CentroidMarkersProps } from "./CentroidMarkers";
export { RoutePolyline } from "./RoutePolyline";
export type { RoutePolylineProps } from "./RoutePolyline";
export { LiveBusMarker } from "./LiveBusMarker";
export type { LiveBusMarkerProps } from "./LiveBusMarker";
export { DistressMarker } from "./DistressMarker";
export type { DistressMarkerProps } from "./DistressMarker";
export { DepotMarker } from "./DepotMarker";
export type { DepotMarkerProps } from "./DepotMarker";
export { FitBounds } from "./FitBounds";
export type { FitBoundsProps } from "./FitBounds";
export { MapClickCapture } from "./MapClickCapture";
export type { MapClickCaptureProps } from "./MapClickCapture";
export { MapLegend } from "./MapLegend";
export type { MapLegendProps } from "./MapLegend";
export {
  APPROX_DISCLAIMER,
  formatApproxDistance,
  formatApproxMinutes,
} from "./approxLabels";
export type {
  MapLatLng,
  StopMarkerItem,
  ClusterPointItem,
  CentroidMarkerItem,
  RoutePathItem,
  LiveBusPosition,
  DistressPosition,
  MapLegendItem,
} from "./types";
