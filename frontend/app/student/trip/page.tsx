"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Alert from "@mui/material/Alert";
import Button from "@mui/material/Button";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import {
  LiveBusMarker,
  MapCanvas,
  MapLegend,
  RoutePolyline,
  StopMarkers,
} from "@/components/maps";
import { centerFromPoints, stopsToMarkers } from "@/features/maps";
import PortalShell from "@/features/shell/PortalShell";
import { EmptyState, PageHeader, SectionCard, StatusChip } from "@/features/ui";
import { apiGet, ApiError } from "@/lib/api";
import { primaryCollegeId, resolveHomePath, useAuth } from "@/lib/auth";
import { hasRole } from "@/lib/roles";
import { brand } from "@/theme/tokens";
import type { TripLocation } from "@/types/api";

const NAV = [
  { href: "/student", label: "Assignment" },
  { href: "/student/board", label: "Board" },
  { href: "/student/trip", label: "Live map" },
];

type ItineraryStop = {
  sequence: number;
  stop_id: string;
  name: string;
  lat: number;
  lng: number;
};

export default function StudentTripPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const collegeId = user ? primaryCollegeId(user) : null;
  const [tripId, setTripId] = useState("");
  const [activeTripId, setActiveTripId] = useState<string | null>(null);
  const [itinerary, setItinerary] = useState<ItineraryStop[]>([]);
  const [location, setLocation] = useState<TripLocation | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [watching, setWatching] = useState(false);

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.replace("/login");
      return;
    }
    if (!hasRole(user, "student") && !user.is_platform_operator) {
      router.replace(resolveHomePath(user));
    }
  }, [loading, user, router]);

  useEffect(() => {
    if (!collegeId || !activeTripId || !watching) return;

    let cancelled = false;

    async function refresh() {
      try {
        const loc = await apiGet<TripLocation>(
          `/colleges/${collegeId}/trips/${activeTripId}/location`,
        );
        if (!cancelled) {
          setLocation(loc);
          setError(null);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof ApiError ? err.message : "Location failed.");
        }
      }
    }

    void refresh();
    const timer = window.setInterval(() => void refresh(), 5000);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, [collegeId, activeTripId, watching]);

  async function startWatch(event: FormEvent) {
    event.preventDefault();
    if (!collegeId || !tripId.trim()) {
      setError("Trip ID is required.");
      return;
    }
    setError(null);
    try {
      const stops = await apiGet<ItineraryStop[]>(
        `/colleges/${collegeId}/trips/${tripId.trim()}/itinerary`,
      );
      setItinerary(stops);
      setActiveTripId(tripId.trim());
      setWatching(true);
      const loc = await apiGet<TripLocation>(
        `/colleges/${collegeId}/trips/${tripId.trim()}/location`,
      );
      setLocation(loc);
    } catch (err) {
      setWatching(false);
      setActiveTripId(null);
      setItinerary([]);
      setLocation(null);
      setError(err instanceof ApiError ? err.message : "Could not load trip.");
    }
  }

  if (loading || !user) return null;

  const stopPoints = itinerary.map((s) => ({ lat: s.lat, lng: s.lng }));
  const busPoint =
    location?.lat != null && location.lng != null
      ? { lat: location.lat, lng: location.lng }
      : null;
  const center = centerFromPoints(
    busPoint ? [...stopPoints, busPoint] : stopPoints,
  );

  return (
    <PortalShell title="Student" description="Live bus position" nav={NAV}>
      <PageHeader
        title="Live bus map"
        description="Enter the active trip ID from your driver. Position updates while the session is active."
        actions={
          location ? (
            <StatusChip status={location.status} />
          ) : null
        }
      />
      {error ? (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      ) : null}

      <Stack spacing={3}>
        <SectionCard title="Track trip">
          <Stack
            component="form"
            spacing={2}
            onSubmit={startWatch}
            sx={{ maxWidth: 480 }}
          >
            <TextField
              label="Trip ID"
              value={tripId}
              onChange={(e) => setTripId(e.target.value)}
              fullWidth
            />
            <Button type="submit" variant="contained" sx={{ alignSelf: "flex-start" }}>
              {watching ? "Refresh itinerary" : "Start watching"}
            </Button>
          </Stack>
        </SectionCard>

        {!watching ? (
          <EmptyState
            title="No trip selected"
            description="Use the trip ID shown when your driver starts the session."
          />
        ) : (
          <SectionCard
            title="Route and bus"
            description={
              location?.recorded_at
                ? `Last ping ${new Date(location.recorded_at).toLocaleString()}`
                : "Waiting for the first driver GPS ping."
            }
          >
            {!itinerary.length && !busPoint ? (
              <Typography color="text.secondary">
                No stop or bus coordinates yet.
              </Typography>
            ) : (
              <MapCanvas
                center={center}
                zoom={13}
                height={420}
                legend={
                  <MapLegend
                    items={[
                      {
                        id: "stops",
                        color: brand.royal,
                        label: "Ordered stops",
                      },
                      {
                        id: "bus",
                        color: "#C45C26",
                        label: "Live bus (driver)",
                      },
                    ]}
                  />
                }
              >
                <StopMarkers
                  stops={stopsToMarkers(itinerary)}
                  color={brand.royal}
                />
                <RoutePolyline
                  routes={[
                    {
                      id: activeTripId ?? "route",
                      label: "Itinerary",
                      color: brand.teal,
                      positions: [...itinerary]
                        .sort((a, b) => a.sequence - b.sequence)
                        .map((s) => ({ lat: s.lat, lng: s.lng })),
                    },
                  ]}
                />
                <LiveBusMarker
                  position={
                    busPoint
                      ? {
                          ...busPoint,
                          recordedAt: location?.recorded_at ?? undefined,
                          label: "Your bus",
                        }
                      : null
                  }
                />
              </MapCanvas>
            )}
          </SectionCard>
        )}
      </Stack>
    </PortalShell>
  );
}
