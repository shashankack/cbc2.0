"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Alert from "@mui/material/Alert";
import Button from "@mui/material/Button";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { BoardingScanPanel } from "@/components/trips";
import { decodeBoardingQr } from "@/features/trips/boardingQr";
import QrCameraScanner from "@/features/trips/QrCameraScanner";
import PortalShell from "@/features/shell/PortalShell";
import { PageHeader, SectionCard } from "@/features/ui";
import { apiGet, apiPost, ApiError } from "@/lib/api";
import { primaryCollegeId, resolveHomePath, useAuth } from "@/lib/auth";
import { hasRole } from "@/lib/roles";
import type { Trip } from "@/types/api";

const NAV = [
  { href: "/student", label: "My ride" },
  { href: "/student/board", label: "Get on the bus" },
  { href: "/student/trip", label: "Live map" },
];

export default function StudentBoardPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const collegeId = user ? primaryCollegeId(user) : null;
  const [tripId, setTripId] = useState("");
  const [token, setToken] = useState("");
  const [payload, setPayload] = useState("");
  const [status, setStatus] = useState<
    "idle" | "scanning" | "success" | "error" | "duplicate" | "expired"
  >("idle");
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.replace("/login");
      return;
    }
    if (!hasRole(user, "student") && !user.is_platform_operator) {
      router.replace(resolveHomePath(user));
      return;
    }
    if (!collegeId) return;
    void apiGet<Trip | null>(`/colleges/${collegeId}/me/active-trip`)
      .then((trip) => {
        if (trip?.id) setTripId(trip.id);
      })
      .catch(() => {
        /* optional discovery */
      });
  }, [loading, user, collegeId, router]);

  const boardWith = useCallback(
    async (tid: string, qrToken: string) => {
      if (!collegeId) return;
      setStatus("scanning");
      try {
        await apiPost(`/colleges/${collegeId}/trips/${tid}/board`, {
          qr_token: qrToken,
        });
        setStatus("success");
        setMessage("You’re on the bus. Have a good ride.");
      } catch (err) {
        const msg = err instanceof ApiError ? err.message : "Could not check you in.";
        setStatus(msg.toLowerCase().includes("already") ? "duplicate" : "error");
        setMessage(msg);
      }
    },
    [collegeId],
  );

  const onCameraScan = useCallback(
    (raw: string) => {
      setPayload(raw);
      const decoded = decodeBoardingQr(raw);
      if (!decoded) {
        setStatus("error");
        setMessage(
          "That QR code doesn’t look like a boarding code from your driver. Try again or paste the code text below.",
        );
        return;
      }
      setTripId(decoded.trip_id);
      setToken(decoded.qr_token);
      void boardWith(decoded.trip_id, decoded.qr_token);
    },
    [boardWith],
  );

  async function board(event?: FormEvent) {
    event?.preventDefault();
    const fromPayload = payload.trim() ? decodeBoardingQr(payload) : null;
    const tid = fromPayload?.trip_id || tripId.trim();
    const qrToken = fromPayload?.qr_token || token.trim();
    if (!tid || !qrToken) {
      setStatus("error");
      setMessage(
        "Scan the driver’s QR, or paste the boarding code from their screen.",
      );
      return;
    }
    if (fromPayload) {
      setTripId(fromPayload.trip_id);
      setToken(fromPayload.qr_token);
    }
    await boardWith(tid, qrToken);
  }

  if (loading || !user) return null;

  return (
    <PortalShell title="Student" description="Check in when you board" nav={NAV}>
      <PageHeader
        title="Get on the bus"
        description="Point your camera at the QR code on the driver’s phone. If the camera doesn’t work, copy the boarding code from their screen and paste it below."
      />
      <SectionCard>
        <Stack spacing={2.5} sx={{ maxWidth: 560 }}>
          <Alert severity="info">
            Camera scan works best in Chrome or Edge. On other browsers, ask your
            driver for the boarding code text and paste it below.
          </Alert>
          <QrCameraScanner
            onScan={onCameraScan}
            active={status !== "success"}
          />
          <Stack spacing={2} component="form" onSubmit={board}>
            <TextField
              label="Paste boarding code"
              value={payload}
              onChange={(e) => setPayload(e.target.value)}
              placeholder="Paste the code from the driver’s screen"
              helperText="Use this if you can’t scan with the camera"
              fullWidth
            />
            <Typography variant="caption" color="text.secondary">
              Advanced: enter the two parts separately if your driver shares them
              that way
            </Typography>
            <TextField
              label="Trip reference"
              value={tripId}
              onChange={(e) => setTripId(e.target.value)}
              helperText="Filled automatically when your bus trip is running"
              fullWidth
            />
            <TextField
              label="Boarding key"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              helperText="Usually comes from scanning or pasting the full code"
              fullWidth
            />
            <Button type="submit" variant="contained" size="large">
              Check me in
            </Button>
          </Stack>
          <BoardingScanPanel
            status={status}
            message={message}
            onRetry={() => {
              setStatus("idle");
              setMessage(null);
            }}
          />
          {status === "error" && message ? (
            <Alert severity="error">{message}</Alert>
          ) : null}
        </Stack>
      </SectionCard>
    </PortalShell>
  );
}
