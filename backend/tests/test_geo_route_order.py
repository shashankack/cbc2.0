"""Unit tests for route-chain helpers (no DB / no Nominatim)."""

from app.services.geo import (
    Point,
    nearest_neighbor_order,
    path_length_m,
    split_ordered_by_gap,
    two_opt_order,
)


def test_split_ordered_by_gap_keeps_nearby_chain():
    # ~100 m steps along a corridor, then a far jump.
    a = Point(id="a", lat=12.9000, lng=77.6000)
    b = Point(id="b", lat=12.9008, lng=77.6000)  # ~90 m north
    c = Point(id="c", lat=12.9016, lng=77.6000)
    far = Point(id="d", lat=12.9500, lng=77.6500)  # kilometres away
    chains = split_ordered_by_gap([a, b, c, far], max_gap_m=500)
    assert len(chains) == 2
    assert [p.id for p in chains[0]] == ["a", "b", "c"]
    assert [p.id for p in chains[1]] == ["d"]


def test_two_opt_shortens_crossed_path():
    depot = Point(id="depot", lat=12.90, lng=77.60)
    # Intentionally crossed order: A → C → B is longer than A → B → C
    a = Point(id="a", lat=12.91, lng=77.60)
    b = Point(id="b", lat=12.92, lng=77.60)
    c = Point(id="c", lat=12.93, lng=77.60)
    crossed = [a, c, b]
    improved = two_opt_order(crossed, depot=depot)
    assert path_length_m(improved, depot) <= path_length_m(crossed, depot) + 1e-6
    assert {p.id for p in improved} == {"a", "b", "c"}


def test_nearest_neighbor_starts_near_depot():
    depot = Point(id="depot", lat=12.90, lng=77.60)
    near = Point(id="near", lat=12.905, lng=77.60)
    far = Point(id="far", lat=12.95, lng=77.65)
    ordered = nearest_neighbor_order([far, near], depot=depot)
    assert ordered[0].id == "near"
