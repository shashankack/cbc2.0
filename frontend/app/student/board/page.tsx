"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Alert from "@mui/material/Alert";
import Button from "@mui/material/Button";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { BoardingScanPanel } from "@/components/trips";
import { decodeBoardingQr } from "@/features/trips/boardingQr";
import PortalShell from "@/features/shell/PortalShell";
import { PageHeader, SectionCard } from "@/features/ui";
import { apiGet, apiPost, ApiError } from "@/lib/api";
import { primaryCollegeId, resolveHomePath, useAuth } from "@/lib/auth";
import { hasRole } from "@/lib/roles";
import type { Trip } from "@/types/api";

const NAV = [
  { href: "/student", label: "Assignment" },
  { href: "/student/board", label: "Board" },
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

  async function boardWith(tid: string, qrToken: string) {
    if (!collegeId) return;
    setStatus("scanning");
    try {
      await apiPost(`/colleges/${collegeId}/trips/${tid}/board`, {
        qr_token: qrToken,
      });
      setStatus("success");
      setMessage("Boarded successfully.");
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : "Boarding failed.";
      setStatus(msg.toLowerCase().includes("already") ? "duplicate" : "error");
      setMessage(msg);
    }
  }

  async function board(event?: FormEvent) {
    event?.preventDefault();
    const fromPayload = payload.trim() ? decodeBoardingQr(payload) : null;
    const tid = fromPayload?.trip_id || tripId.trim();
    const qrToken = fromPayload?.qr_token || token.trim();
    if (!tid || !qrToken) {
      setStatus("error");
      setMessage("Trip ID and QR token required (or paste a CBC1: payload).");
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
    <PortalShell title="Student" description="QR boarding" nav={NAV}>
      <PageHeader
        title="Board with QR"
        description="Scan or paste the driver’s boarding QR payload. Active trip is prefilled when your bus is running."
      />
      <SectionCard>
        <Stack spacing={2.5} component="form" onSubmit={board} sx={{ maxWidth: 520 }}>
          <TextField
            label="Paste QR payload"
            value={payload}
            onChange={(e) => setPayload(e.target.value)}
            placeholder="CBC1:<trip-id>|<token>"
            fullWidth
            helperText="From scanning the driver QR or copying the payload text under the image."
          />
          <Typography variant="caption" color="text.secondary">
            Or enter fields manually
          </Typography>
          <TextField
            label="Trip ID"
            value={tripId}
            onChange={(e) => setTripId(e.target.value)}
            fullWidth
          />
          <TextField
            label="QR token"
            value={token}
            onChange={(e) => setToken(e.target.value)}
            fullWidth
          />
          <Button type="submit" variant="contained" size="large">
            Submit boarding
          </Button>
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
