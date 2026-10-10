/** Geo helpers only — do not re-export Leaflet maps from this barrel (breaks SSR). */
export {
  DEFAULT_MAP_CENTER,
  centerFromPoints,
  routeColor,
  routesToPolylines,
  stopsToMarkers,
} from "./geo";
