export type MapLatLng = {
  lat: number;
  lng: number;
};

export type StopMarkerItem = {
  id: string;
  sequence: number;
  label: string;
  lat: number;
  lng: number;
  /** Approximate meters from previous stop. Never live traffic. */
  approxDistanceM?: number;
  /** Approximate minutes from previous stop. Never live traffic. */
  approxDurationMin?: number;
};

export type ClusterPointItem = {
  id: string;
  clusterId: string;
  lat: number;
  lng: number;
};

export type CentroidMarkerItem = {
  id: string;
  label: string;
  lat: number;
  lng: number;
  studentCount?: number;
};

export type RoutePathItem = {
  id: string;
  positions: MapLatLng[];
  color?: string;
  label?: string;
};

export type LiveBusPosition = {
  lat: number;
  lng: number;
  headingDeg?: number;
  /** Last driver-phone ping time (ISO). Not a traffic ETA. */
  recordedAt?: string;
  label?: string;
};

export type DistressPosition = {
  lat: number;
  lng: number;
  recordedAt?: string;
  label?: string;
};

export type MapLegendItem = {
  id: string;
  color: string;
  label: string;
};
