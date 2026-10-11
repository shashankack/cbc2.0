/**
 * SSR-safe maps exports only (no react-leaflet / leaflet).
 *
 * For map layers and MapCanvas, import from `@/components/maps/leaflet`
 * inside modules loaded with `next/dynamic({ ssr: false })`.
 */

export {
  APPROX_DISCLAIMER,
  formatApproxDistance,
  formatApproxMinutes,
} from "./approxLabels";
export { MapLegend } from "./MapLegend";
export type { MapLegendProps } from "./MapLegend";
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
