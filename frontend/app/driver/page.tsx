"use client";

import { useCallback, useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import Alert from "@mui/material/Alert";
import CircularProgress from "@mui/material/CircularProgress";
import Stack from "@mui/material/Stack";
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
import type { DriverDuty, Trip } from "@/types/api";

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

function formatTime(iso: string | null | undefined): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleString();
}

export default function DriverPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const collegeId = user ? primaryCollegeId(user) : null;
  const [duty, setDuty] = useState<DriverDuty | null>(null);
  const [trip, setTrip] = useState<Trip | null>(null);
  const [qrToken, setQrToken] = useState<string | null>(null);
  const [itinerary, setItinerary] = useState<ItineraryStop[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [distressInfo, setDistressInfo] = useState<string | null>(null);
  const [sessionStatus, setSessionStatus] = useState<
    "scheduled" | "active" | "ended" | "loading" | "error"
  >("scheduled");
  const [busy, setBusy] = useState(false);

  const loadDuty = useCallback(async () => {
    if (!collegeId) return;
    try {
      const row = await apiGet<DriverDuty>(
        `/colleges/${collegeId}/me/driver-duty`,
      );
      setDuty(row);
      setTrip(row.trip);
      if (row.trip?.status === "active") {
        setSessionStatus("active");
      } else if (row.trip?.status === "ended") {
        setSessionStatus("ended");
      } else {
        setSessionStatus("scheduled");
      }
      setError(null);
    } catch (err) {
      setDuty(null);
      setTrip(null);
      setError(err instanceof ApiError ? err.message : "Could not load duty.");
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
    void loadDuty();
  }, [loading, user, router, loadDuty]);

  // If already active after refresh, restore QR + itinerary.
  useEffect(() => {
    if (!collegeId || !trip || trip.status !== "active" || qrToken) return;
    void apiPost<{
      trip: Trip;
      qr_token: string;
      itinerary: ItineraryStop[];
    }>(`/colleges/${collegeId}/me/driver-duty/start`)
      .then((result) => {
        setTrip(result.trip);
        setQrToken(result.qr_token);
        setItinerary(result.itinerary);
        setSessionStatus("active");
      })
      .catch(() => {
        /* keep duty loaded; driver can retry Start */
      });
  }, [collegeId, trip, qrToken]);

  async function start() {
    if (!collegeId) return;
    setBusy(true);
    setSessionStatus("loading");
    try {
      const result = await apiPost<{
        trip: Trip;
        qr_token: string;
        itinerary: ItineraryStop[];
      }>(`/colleges/${collegeId}/me/driver-duty/start`);
      setTrip(result.trip);
      setQrToken(result.qr_token);
      setItinerary(result.itinerary);
      setSessionStatus("active");
      setError(null);
      setDistressInfo(null);
      await loadDuty();
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition((pos) => {
          void apiPost(
            `/colleges/${collegeId}/trips/${result.trip.id}/location`,
            {
              lat: pos.coords.latitude,
              lng: pos.coords.longitude,
            },
          );
        });
      }
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Start failed.");
      setSessionStatus("error");
    } finally {
      setBusy(false);
    }
  }

  async function end() {
    if (!collegeId) return;
    setBusy(true);
    setSessionStatus("loading");
    try {
      const ended = await apiPost<Trip>(
        `/colleges/${collegeId}/me/driver-duty/end`,
      );
      setTrip(ended);
      setQrToken(null);
      setSessionStatus("ended");
      setError(null);
      await loadDuty();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "End failed.");
      setSessionStatus("error");
    } finally {
      setBusy(false);
    }
  }

  async function distress() {
    if (!collegeId || !trip) return;
    const send = async (lat: number, lng: number) => {
      const result = await apiPost<{
        emergency_reallocation: { id: string };
      }>(`/colleges/${collegeId}/trips/${trip.id}/distress`, { lat, lng });
      setDistressInfo(
        `Emergency plan ${result.emergency_reallocation.id.slice(0, 8)}… — college admin must confirm.`,
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
    <PortalShell
      title="Driver"
      description="Start / end trip"
      nav={[{ href: "/driver", label: "Trip" }]}
    >
      <PageHeader
        title="Today's trip"
        description="Your bus and route are assigned automatically. Start, end, or raise emergency — start and end times are logged for admin."
        actions={
          <StatusChip
            status={sessionStatus === "loading" ? "processing" : sessionStatus}
          />
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
        {!duty ? (
          <SectionCard title="Assignment">
            <EmptyState
              title="No duty yet"
              description="Ask college admin to assign you a bus and confirm a planning run."
            />
          </SectionCard>
        ) : (
          <>
            <SectionCard title="Assignment">
              <Stack spacing={0.75}>
                <Typography variant="body1" sx={{ fontWeight: 600 }}>
                  {duty.route_name}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Bus {duty.bus_registration}
                </Typography>
                {trip?.started_at ? (
                  <Typography variant="body2" color="text.secondary">
                    Started: {formatTime(trip.started_at)}
                  </Typography>
                ) : null}
                {trip?.ended_at ? (
                  <Typography variant="body2" color="text.secondary">
                    Ended: {formatTime(trip.ended_at)}
                    {trip.duration_seconds != null
                      ? ` · ${Math.round(trip.duration_seconds / 60)} min`
                      : ""}
                  </Typography>
                ) : null}
              </Stack>
            </SectionCard>

            <SectionCard title="Session">
              <TripSessionControls
                status={busy ? "loading" : sessionStatus}
                onStart={() => void start()}
                onEnd={() => void end()}
                startLabel="Start trip"
                endLabel="End trip"
                error={null}
              />
            </SectionCard>

            {qrToken && sessionStatus === "active" ? (
              <SectionCard title="Boarding QR">
                <TripQrPanel status="active" qrValue={qrToken} />
              </SectionCard>
            ) : null}

            {itinerary.length > 0 ? (
              <SectionCard title="Ordered stops">
                <OrderedStopList
                  stops={itinerary.map((s) => ({
                    id: `${s.stop_id}-${s.sequence}`,
                    sequence: s.sequence,
                    label: s.name,
                    subtitle: `${s.lat.toFixed(4)}, ${s.lng.toFixed(4)}`,
                  }))}
                />
                <Stack sx={{ mt: 2 }}>
                  <TripItineraryMap
                    routeId={duty.route_id}
                    stops={itinerary}
                  />
                </Stack>
              </SectionCard>
            ) : null}

            {sessionStatus === "active" ? (
              <SectionCard
                title="Emergency"
                description="Captures GPS and proposes replacement capacity for admin confirm."
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
