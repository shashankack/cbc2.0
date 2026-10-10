"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Alert from "@mui/material/Alert";
import Button from "@mui/material/Button";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { EmergencyReallocationCard } from "@/components/planning";
import { ADMIN_NAV } from "@/features/admin/nav";
import PortalShell from "@/features/shell/PortalShell";
import { PageHeader, SectionCard, StatusChip } from "@/features/ui";
import { apiPost, ApiError } from "@/lib/api";
import { primaryCollegeId, resolveHomePath, useAuth } from "@/lib/auth";
import { hasRole } from "@/lib/roles";

const nav = [...ADMIN_NAV];

type EmergencyOut = {
  id: string;
  distress_event_id: string;
  status: string;
  plan_json: {
    boarded_count?: number;
    remaining_count?: number;
    replacement_buses?: {
      bus_id: string;
      registration_number?: string;
      capacity?: number;
      distance_m_approx?: number | null;
    }[];
  };
  confirmed_at: string | null;
};

export default function AdminEmergencyPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const collegeId = user ? primaryCollegeId(user) : null;
  const [reallocId, setReallocId] = useState("");
  const [result, setResult] = useState<EmergencyOut | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [confirming, setConfirming] = useState(false);

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.replace("/login");
      return;
    }
    if (!hasRole(user, "college_admin") && !user.is_platform_operator) {
      router.replace(resolveHomePath(user));
    }
  }, [loading, user, router]);

  async function confirm(event: FormEvent) {
    event.preventDefault();
    if (!collegeId || !reallocId.trim()) {
      setError("Emergency reallocation ID is required.");
      return;
    }
    setConfirming(true);
    setError(null);
    try {
      const row = await apiPost<EmergencyOut>(
        `/colleges/${collegeId}/emergency-reallocations/${reallocId.trim()}/confirm`,
      );
      setResult(row);
    } catch (err) {
      setResult(null);
      setError(err instanceof ApiError ? err.message : "Confirm failed.");
    } finally {
      setConfirming(false);
    }
  }

  if (loading || !user) return null;
  if (!collegeId) {
    return (
      <PortalShell title="College admin" nav={nav}>
        <Alert severity="warning">No college membership on this account.</Alert>
      </PortalShell>
    );
  }

  const plan = result?.plan_json;
  const suggested =
    plan?.replacement_buses?.map((b) => ({
      id: b.bus_id,
      label: b.registration_number ?? b.bus_id.slice(0, 8),
      capacity: b.capacity ?? 0,
      availableSeats: b.capacity ?? 0,
      approxDistanceM: b.distance_m_approx ?? undefined,
    })) ?? [];

  return (
    <PortalShell title="College admin" description="Distress follow-up" nav={nav}>
      <PageHeader
        title="Emergency reallocation"
        description="Paste the reallocation ID from the driver’s distress alert, review the suggestion, and confirm."
        actions={result ? <StatusChip status={result.status} /> : null}
      />
      {error ? (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      ) : null}

      <Stack spacing={3} sx={{ maxWidth: 720 }}>
        <SectionCard title="Confirm plan">
          <Stack component="form" spacing={2} onSubmit={confirm}>
            <TextField
              label="Emergency reallocation ID"
              value={reallocId}
              onChange={(e) => setReallocId(e.target.value)}
              fullWidth
              required
            />
            <Button
              type="submit"
              variant="contained"
              disabled={confirming}
              sx={{ alignSelf: "flex-start" }}
            >
              {confirming ? "Confirming…" : "Confirm reallocation"}
            </Button>
          </Stack>
        </SectionCard>

        {result ? (
          <SectionCard title="Confirmed plan">
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Plan {result.id}
              {result.confirmed_at
                ? ` · ${new Date(result.confirmed_at).toLocaleString()}`
                : ""}
            </Typography>
            <EmergencyReallocationCard
              boardedCount={plan?.boarded_count ?? 0}
              remainingCount={plan?.remaining_count ?? 0}
              suggestedBuses={suggested}
            />
          </SectionCard>
        ) : null}
      </Stack>
    </PortalShell>
  );
}
