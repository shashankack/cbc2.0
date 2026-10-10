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
  { href: "/student", label: "My ride" },
  { href: "/student/board", label: "Get on the bus" },
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
    <PortalShell title="Student" description="Your pickup and bus" nav={NAV}>
      <PageHeader
        title="My ride"
        description="Once your college locks in the routes, you’ll see your pickup stop and bus here. Those don’t change until the next planning cycle."
        actions={
          <Stack direction="row" spacing={1}>
            <Button href="/student/trip" variant="outlined">
              See bus on map
            </Button>
            <Button href="/student/board" variant="contained">
              Get on the bus
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
          title="No ride assigned yet"
          description="When your college finishes planning, your pickup stop, route, and bus will show up here."
        />
      ) : (
        <SectionCard
          title="Your assigned ride"
          actions={<StatusChip status="locked" label="Locked in" />}
        >
          <Stack spacing={2}>
            <Field
              label="Pickup stop"
              value={allocation.stop_name ?? "Assigned stop"}
            />
            {allocation.stop_lat != null && allocation.stop_lng != null ? (
              <Field
                label="Stop on the map"
                value={`${allocation.stop_lat.toFixed(5)}, ${allocation.stop_lng.toFixed(5)}`}
                mono
              />
            ) : null}
            <Field
              label="Bus route"
              value={allocation.route_name ?? "Assigned route"}
            />
            <Field
              label="Bus number plate"
              value={
                allocation.bus_registration_number ?? "Assigned bus"
              }
            />
          </Stack>
        </SectionCard>
      )}
    </PortalShell>
  );
}
