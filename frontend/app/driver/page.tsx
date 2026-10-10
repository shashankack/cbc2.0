"use client";

import { useCallback, useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import Alert from "@mui/material/Alert";
import Button from "@mui/material/Button";
import CircularProgress from "@mui/material/CircularProgress";
import Stack from "@mui/material/Stack";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import {
  DistressButton,
  OrderedStopList,
  TripQrPanel,
  TripSessionControls,
} from "@/components/trips";
import PortalShell from "@/features/shell/PortalShell";
import { EmptyState, PageHeader, SectionCard, StatusChip } from "@/features/ui";
import { apiGet, apiPost, ApiError } from "@/lib/api";
import { primaryCollegeId, resolveHomePath, useAuth } from "@/lib/auth";
import { hasRole } from "@/lib/roles";
import type { Trip } from "@/types/api";

const TripItineraryMap = dynamic(
  () => import("@/features/maps/TripItineraryMap"),
  {
    ssr: false,
    loading: () => (
      <Stack sx={{ height: 360, alignItems: "center", justifyContent: "center" }}>
        <CircularProgress size={28} aria-label="Loading map" />
      </Stack>
    ),
  },
);

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
  const [scheduled, setScheduled] = useState<Trip[]>([]);
  const [trip, setTrip] = useState<Trip | null>(null);
  const [qrToken, setQrToken] = useState<string | null>(null);
  const [itinerary, setItinerary] = useState<ItineraryStop[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [distressInfo, setDistressInfo] = useState<string | null>(null);
  const [sessionStatus, setSessionStatus] = useState<
    "scheduled" | "active" | "ended" | "loading" | "error"
  >("scheduled");

  const loadScheduled = useCallback(async () => {
    if (!collegeId) return;
    try {
      const rows = await apiGet<Trip[]>(
        `/colleges/${collegeId}/trips?status=scheduled`,
      );
      setScheduled(rows);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not load trips.");
    }
  }, [collegeId]);

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.replace("/login");
      return;
    }
    if (!hasRole(user, "driver") && !user.is_platform_operator) {
      router.replace(resolveHomePath(user));
      return;
    }
    void loadScheduled();
  }, [loading, user, router, loadScheduled]);

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
      await loadScheduled();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Create trip failed.");
      setSessionStatus("error");
    }
  }

  function selectTrip(row: Trip) {
    setTrip(row);
    setSessionStatus(
      row.status === "active"
        ? "active"
        : row.status === "ended"
          ? "ended"
          : "scheduled",
    );
    setQrToken(null);
    setItinerary([]);
    setError(null);
    setDistressInfo(null);
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
      setError(null);
      await loadScheduled();
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
      const result = await apiPost<{
        emergency_reallocation: { id: string };
      }>(`/colleges/${collegeId}/trips/${trip.id}/distress`, { lat, lng });
      setDistressInfo(
        `Emergency plan ${result.emergency_reallocation.id} — give this ID to college admin to confirm.`,
      );
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
        description="Pick a scheduled trip to start, or create one from a confirmed route and your bus."
        actions={
          trip ? (
            <StatusChip
              status={sessionStatus === "loading" ? "processing" : sessionStatus}
            />
          ) : null
        }
      />
      {error ? (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      ) : null}
      {distressInfo ? (
        <Alert severity="warning" sx={{ mb: 2 }}>
          {distressInfo}
        </Alert>
      ) : null}

      <Stack spacing={3} sx={{ maxWidth: 800 }}>
        {!trip ? (
          <>
            <SectionCard
              title="Your scheduled trips"
              description="Select a trip created for your bus, then start the session."
            >
              {scheduled.length === 0 ? (
                <EmptyState
                  title="No scheduled trips"
                  description="Create one below with a confirmed route ID and your bus ID."
                />
              ) : (
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Trip</TableCell>
                        <TableCell>Route</TableCell>
                        <TableCell>Bus</TableCell>
                        <TableCell align="right">Action</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {scheduled.map((row) => (
                        <TableRow key={row.id} hover>
                          <TableCell sx={{ fontFamily: "monospace", fontSize: 12 }}>
                            {row.id.slice(0, 8)}…
                          </TableCell>
                          <TableCell sx={{ fontFamily: "monospace", fontSize: 12 }}>
                            {row.route_id.slice(0, 8)}…
                          </TableCell>
                          <TableCell sx={{ fontFamily: "monospace", fontSize: 12 }}>
                            {row.bus_id.slice(0, 8)}…
                          </TableCell>
                          <TableCell align="right">
                            <Button size="small" variant="contained" onClick={() => selectTrip(row)}>
                              Open
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </SectionCard>

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
                  variant="outlined"
                  size="large"
                  onClick={() => void createTrip()}
                  sx={{ alignSelf: "flex-start" }}
                >
                  Create scheduled trip
                </Button>
              </Stack>
            </SectionCard>
          </>
        ) : (
          <>
            <SectionCard title="Session">
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                Trip {trip.id}
              </Typography>
              <Button
                size="small"
                sx={{ mb: 2 }}
                onClick={() => {
                  setTrip(null);
                  setQrToken(null);
                  setItinerary([]);
                  void loadScheduled();
                }}
              >
                Back to trip list
              </Button>
              <TripSessionControls
                status={sessionStatus}
                onStart={() => void start()}
                onEnd={() => void end()}
                error={error}
              />
            </SectionCard>

            {qrToken ? (
              <SectionCard title="Boarding QR">
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                  Students need this trip ID plus the token below.
                </Typography>
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
                  <TripItineraryMap routeId={trip.route_id} stops={itinerary} />
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
