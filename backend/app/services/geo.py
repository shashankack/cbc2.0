"""Distance and simple DBSCAN clustering (Haversine metres)."""

from __future__ import annotations

import math
from dataclasses import dataclass


EARTH_RADIUS_M = 6_371_000.0
DEFAULT_BUS_SPEED_M_S = 8.33  # ~30 km/h approx


def haversine_m(lat1: float, lng1: float, lat2: float, lng2: float) -> float:
    rlat1, rlng1, rlat2, rlng2 = map(math.radians, (lat1, lng1, lat2, lng2))
    dlat = rlat2 - rlat1
    dlng = rlng2 - rlng1
    a = (
        math.sin(dlat / 2) ** 2
        + math.cos(rlat1) * math.cos(rlat2) * math.sin(dlng / 2) ** 2
    )
    return 2 * EARTH_RADIUS_M * math.asin(math.sqrt(a))


def approx_travel_seconds(
    distance_m: float, speed_m_s: float = DEFAULT_BUS_SPEED_M_S
) -> float:
    return distance_m / speed_m_s if speed_m_s > 0 else 0.0


@dataclass
class Point:
    id: object
    lat: float
    lng: float


def dbscan(
    points: list[Point],
    *,
    eps_m: float,
    min_samples: int,
) -> tuple[dict[int, list[Point]], list[Point]]:
    """Return cluster_id -> members, and noise points."""
    n = len(points)
    labels = [-1] * n
    visited = [False] * n

    def region_query(i: int) -> list[int]:
        return [
            j
            for j in range(n)
            if haversine_m(
                points[i].lat, points[i].lng, points[j].lat, points[j].lng
            )
            <= eps_m
        ]

    cluster_id = 0
    for i in range(n):
        if visited[i]:
            continue
        visited[i] = True
        neighbors = region_query(i)
        if len(neighbors) < min_samples:
            continue
        labels[i] = cluster_id
        queue = [j for j in neighbors if j != i]
        qi = 0
        while qi < len(queue):
            j = queue[qi]
            qi += 1
            if not visited[j]:
                visited[j] = True
                j_neighbors = region_query(j)
                if len(j_neighbors) >= min_samples:
                    for nb in j_neighbors:
                        if nb not in queue:
                            queue.append(nb)
            if labels[j] == -1:
                labels[j] = cluster_id
        cluster_id += 1

    clusters: dict[int, list[Point]] = {}
    noise: list[Point] = []
    for idx, label in enumerate(labels):
        if label == -1:
            noise.append(points[idx])
        else:
            clusters.setdefault(label, []).append(points[idx])
    return clusters, noise


def centroid(points: list[Point]) -> tuple[float, float]:
    lat = sum(p.lat for p in points) / len(points)
    lng = sum(p.lng for p in points) / len(points)
    return lat, lng


def nearest_neighbor_order(
    stops: list[Point],
    depot: Point | None = None,
) -> list[Point]:
    if not stops:
        return []
    remaining = stops[:]
    if depot is not None:
        remaining.sort(
            key=lambda p: haversine_m(depot.lat, depot.lng, p.lat, p.lng)
        )
    ordered = [remaining.pop(0)]
    while remaining:
        last = ordered[-1]
        remaining.sort(
            key=lambda p: haversine_m(last.lat, last.lng, p.lat, p.lng)
        )
        ordered.append(remaining.pop(0))
    return ordered
