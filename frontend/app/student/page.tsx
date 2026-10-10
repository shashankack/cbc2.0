"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Alert from "@mui/material/Alert";
import Button from "@mui/material/Button";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import PortalShell from "@/features/shell/PortalShell";
import { EmptyState, PageHeader, SectionCard, StatusChip } from "@/features/ui";
import { apiGet, ApiError } from "@/lib/api";
import { primaryCollegeId, resolveHomePath, useAuth } from "@/lib/auth";
import { hasRole } from "@/lib/roles";
import type { Allocation } from "@/types/api";

const NAV = [
  { href: "/student", label: "Assignment" },
  { href: "/student/board", label: "Board" },
  { href: "/student/trip", label: "Live map" },
];

function Field({
  label,
  value,
  mono = false,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <Stack spacing={0.5}>
      <Typography variant="body2" color="text.secondary">
        {label}
      </Typography>
      <Typography sx={mono ? { fontFamily: "monospace", fontSize: 13 } : undefined}>
        {value}
      </Typography>
    </Stack>
  );
}

export default function StudentPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const collegeId = user ? primaryCollegeId(user) : null;
  const [allocation, setAllocation] = useState<Allocation | null>(null);
  const [error, setError] = useState<string | null>(null);

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
    void apiGet<Allocation | null>(`/colleges/${collegeId}/me/allocation`)
      .then(setAllocation)
      .catch((err: unknown) => {
        setError(err instanceof ApiError ? err.message : "Load failed.");
      });
  }, [loading, user, collegeId, router]);

  if (loading || !user) return null;

  return (
    <PortalShell title="Student" description="Your locked pickup" nav={NAV}>
      <PageHeader
        title="My assignment"
        description="Pick/drop is locked after your college admin confirms a planning run."
        actions={
          <Stack direction="row" spacing={1}>
            <Button href="/student/trip" variant="outlined">
              Live map
            </Button>
            <Button href="/student/board" variant="contained">
              Board with QR
            </Button>
          </Stack>
        }
      />
      {error ? (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      ) : null}

      {!allocation ? (
        <EmptyState
          title="No locked assignment yet"
          description="When planning is confirmed, your stop, route, and bus will appear here."
        />
      ) : (
        <SectionCard
          title="Confirmed allocation"
          actions={<StatusChip status="locked" />}
        >
          <Stack spacing={2}>
            <Field
              label="Pickup stop"
              value={allocation.stop_name ?? allocation.stop_id}
            />
            {allocation.stop_lat != null && allocation.stop_lng != null ? (
              <Field
                label="Stop coordinates"
                value={`${allocation.stop_lat.toFixed(5)}, ${allocation.stop_lng.toFixed(5)}`}
                mono
              />
            ) : null}
            <Field
              label="Route"
              value={allocation.route_name ?? allocation.route_id}
            />
            <Field
              label="Bus"
              value={
                allocation.bus_registration_number ?? allocation.bus_id
              }
            />
            <Typography variant="caption" color="text.secondary">
              IDs — stop {allocation.stop_id.slice(0, 8)}… · route{" "}
              {allocation.route_id.slice(0, 8)}… · bus{" "}
              {allocation.bus_id.slice(0, 8)}…
            </Typography>
          </Stack>
        </SectionCard>
      )}
    </PortalShell>
  );
}
