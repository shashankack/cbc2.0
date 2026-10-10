/** Geo helpers only — do not re-export Leaflet maps from this barrel (breaks SSR). */
export {
  DEFAULT_MAP_CENTER,
  centerFromPoints,
  roundCoord,
  routeColor,
  routesToPolylines,
  stopsToMarkers,
} from "./geo";
