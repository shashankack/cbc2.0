"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Alert from "@mui/material/Alert";
import Button from "@mui/material/Button";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import { BoardingScanPanel } from "@/components/trips";
import PortalShell from "@/features/shell/PortalShell";
import { PageHeader, SectionCard } from "@/features/ui";
import { apiPost, ApiError } from "@/lib/api";
import { primaryCollegeId, resolveHomePath, useAuth } from "@/lib/auth";
import { hasRole } from "@/lib/roles";

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
    }
  }, [loading, user, router]);

  async function board(event?: FormEvent) {
    event?.preventDefault();
    if (!collegeId || !tripId) {
      setStatus("error");
      setMessage("Trip ID required.");
      return;
    }
    setStatus("scanning");
    try {
      await apiPost(`/colleges/${collegeId}/trips/${tripId}/board`, {
        qr_token: token,
      });
      setStatus("success");
      setMessage("Boarded successfully.");
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : "Boarding failed.";
      setStatus(msg.toLowerCase().includes("already") ? "duplicate" : "error");
      setMessage(msg);
    }
  }

  if (loading || !user) return null;

  return (
    <PortalShell title="Student" description="QR boarding" nav={NAV}>
      <PageHeader
        title="Board with QR"
        description="Enter the active trip ID and the token shown on the driver’s panel."
      />
      <SectionCard>
        <Stack spacing={2.5} component="form" onSubmit={board} sx={{ maxWidth: 520 }}>
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
            Submit token
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
