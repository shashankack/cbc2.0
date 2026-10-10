"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Alert from "@mui/material/Alert";
import Button from "@mui/material/Button";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import {
  MapCanvas,
  MapLegend,
  RoutePolyline,
  StopMarkers,
} from "@/components/maps";
import {
  DistressButton,
  OrderedStopList,
  TripQrPanel,
  TripSessionControls,
} from "@/components/trips";
import { centerFromPoints, stopsToMarkers } from "@/features/maps";
import PortalShell from "@/features/shell/PortalShell";
import { PageHeader, SectionCard, StatusChip } from "@/features/ui";
import { apiPost, ApiError } from "@/lib/api";
import { primaryCollegeId, resolveHomePath, useAuth } from "@/lib/auth";
import { hasRole } from "@/lib/roles";
import { brand } from "@/theme/tokens";
import type { Trip } from "@/types/api";

type ItineraryStop = {
  sequence: number;
  stop_id: string;
  name: string;
  lat: number;
  lng: number;
};

export default function DriverPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const collegeId = user ? primaryCollegeId(user) : null;
  const [routeId, setRouteId] = useState("");
  const [busId, setBusId] = useState("");
  const [trip, setTrip] = useState<Trip | null>(null);
  const [qrToken, setQrToken] = useState<string | null>(null);
  const [itinerary, setItinerary] = useState<ItineraryStop[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [sessionStatus, setSessionStatus] = useState<
    "scheduled" | "active" | "ended" | "loading" | "error"
  >("scheduled");

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.replace("/login");
      return;
    }
    if (!hasRole(user, "driver") && !user.is_platform_operator) {
      router.replace(resolveHomePath(user));
    }
  }, [loading, user, router]);

  async function createTrip() {
    if (!collegeId) return;
    try {
      const created = await apiPost<Trip>(`/colleges/${collegeId}/trips`, {
        route_id: routeId,
        bus_id: busId,
      });
      setTrip(created);
      setSessionStatus("scheduled");
      setError(null);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Create trip failed.");
      setSessionStatus("error");
    }
  }

  async function start() {
    if (!collegeId || !trip) return;
    setSessionStatus("loading");
    try {
      const result = await apiPost<{
        trip: Trip;
        qr_token: string;
        itinerary: ItineraryStop[];
      }>(`/colleges/${collegeId}/trips/${trip.id}/start`);
      setTrip(result.trip);
      setQrToken(result.qr_token);
      setItinerary(result.itinerary);
      setSessionStatus("active");
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition((pos) => {
          void apiPost(`/colleges/${collegeId}/trips/${trip.id}/location`, {
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
          });
        });
      }
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Start failed.");
      setSessionStatus("error");
    }
  }

  async function end() {
    if (!collegeId || !trip) return;
    setSessionStatus("loading");
    try {
      const ended = await apiPost<Trip>(
        `/colleges/${collegeId}/trips/${trip.id}/end`,
      );
      setTrip(ended);
      setQrToken(null);
      setSessionStatus("ended");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "End failed.");
      setSessionStatus("error");
    }
  }

  async function distress() {
    if (!collegeId || !trip) return;
    const send = async (lat: number, lng: number) => {
      await apiPost(`/colleges/${collegeId}/trips/${trip.id}/distress`, {
        lat,
        lng,
      });
    };
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          void send(pos.coords.latitude, pos.coords.longitude).catch(
            (err: unknown) => {
              setError(err instanceof ApiError ? err.message : "Distress failed.");
            },
          );
        },
        () => {
          void send(0, 0);
        },
      );
    } else {
      await send(0, 0);
    }
  }

  if (loading || !user) return null;

  return (
    <PortalShell title="Driver" description="Trip session controls" nav={[{ href: "/driver", label: "Trip" }]}>
      <PageHeader
        title="Trip session"
        description="Start the session to show QR and share live location. End when the trip finishes."
        actions={
          trip ? <StatusChip status={sessionStatus === "loading" ? "processing" : sessionStatus} /> : null
        }
      />
      {error ? (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      ) : null}

      <Stack spacing={3} sx={{ maxWidth: 720 }}>
        {!trip ? (
          <SectionCard
            title="Create scheduled trip"
            description="Use a confirmed route ID and a bus assigned to your driver account."
          >
            <Stack spacing={2}>
              <TextField
                label="Route ID"
                value={routeId}
                onChange={(e) => setRouteId(e.target.value)}
                fullWidth
              />
              <TextField
                label="Bus ID"
                value={busId}
                onChange={(e) => setBusId(e.target.value)}
                fullWidth
              />
              <Button
                variant="contained"
                size="large"
                onClick={() => void createTrip()}
                sx={{ alignSelf: "flex-start" }}
              >
                Create scheduled trip
              </Button>
            </Stack>
          </SectionCard>
        ) : (
          <>
            <SectionCard title="Session">
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Trip {trip.id}
              </Typography>
              <TripSessionControls
                status={sessionStatus}
                onStart={() => void start()}
                onEnd={() => void end()}
                error={error}
              />
            </SectionCard>

            {qrToken ? (
              <SectionCard title="Boarding QR">
                <TripQrPanel status="active" qrValue={qrToken} />
              </SectionCard>
            ) : null}

            <SectionCard title="Ordered stops">
              <OrderedStopList
                stops={itinerary.map((s) => ({
                  id: s.stop_id,
                  sequence: s.sequence,
                  label: s.name,
                  subtitle: `${s.lat.toFixed(4)}, ${s.lng.toFixed(4)}`,
                }))}
              />
              {itinerary.length ? (
                <Stack sx={{ mt: 2 }}>
                  <MapCanvas
                    center={centerFromPoints(
                      itinerary.map((s) => ({ lat: s.lat, lng: s.lng })),
                    )}
                    zoom={13}
                    height={360}
                    legend={
                      <MapLegend
                        items={[
                          {
                            id: "stops",
                            color: brand.royal,
                            label: "Stops in visit order",
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
                          id: trip.route_id,
                          label: "Itinerary",
                          color: brand.teal,
                          positions: [...itinerary]
                            .sort((a, b) => a.sequence - b.sequence)
                            .map((s) => ({ lat: s.lat, lng: s.lng })),
                        },
                      ]}
                    />
                  </MapCanvas>
                </Stack>
              ) : null}
            </SectionCard>

            {sessionStatus === "active" ? (
              <SectionCard
                title="Emergency"
                description="Captures your current GPS and proposes replacement capacity."
              >
                <DistressButton onDistress={() => void distress()} />
              </SectionCard>
            ) : null}
          </>
        )}
      </Stack>
    </PortalShell>
  );
}
