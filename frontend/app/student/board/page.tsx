"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Alert from "@mui/material/Alert";
import Button from "@mui/material/Button";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { BoardingScanPanel } from "@/components/trips";
import PortalShell from "@/features/shell/PortalShell";
import { apiPost, ApiError } from "@/lib/api";
import { primaryCollegeId, resolveHomePath, useAuth } from "@/lib/auth";
import { hasRole } from "@/lib/roles";

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
    <PortalShell
      title="Student"
      nav={[
        { href: "/student", label: "Assignment" },
        { href: "/student/board", label: "Board" },
      ]}
    >
      <Stack
        spacing={3}
        component="form"
        onSubmit={board}
        sx={{ maxWidth: 520 }}
      >
        <Typography variant="h5" sx={{ fontWeight: 700 }}>
          Board with QR token
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
        <Button type="submit" variant="contained">
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
    </PortalShell>
  );
}
