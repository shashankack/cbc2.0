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
];

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
          <Button href="/student/board" variant="contained">
            Board with QR
          </Button>
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
          <Stack spacing={1.25}>
            <Typography variant="body2" color="text.secondary">
              Stop ID
            </Typography>
            <Typography sx={{ fontFamily: "monospace" }}>
              {allocation.stop_id}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Route ID
            </Typography>
            <Typography sx={{ fontFamily: "monospace" }}>
              {allocation.route_id}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Bus ID
            </Typography>
            <Typography sx={{ fontFamily: "monospace" }}>
              {allocation.bus_id}
            </Typography>
          </Stack>
        </SectionCard>
      )}
    </PortalShell>
  );
}
