"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Alert from "@mui/material/Alert";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import PortalShell from "@/features/shell/PortalShell";
import { apiGet, ApiError } from "@/lib/api";
import { primaryCollegeId, resolveHomePath, useAuth } from "@/lib/auth";
import { hasRole } from "@/lib/roles";
import type { Allocation } from "@/types/api";

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
    <PortalShell
      title="Student"
      nav={[
        { href: "/student", label: "Assignment" },
        { href: "/student/board", label: "Board" },
      ]}
    >
      <Stack spacing={2}>
        <Typography variant="h5" sx={{ fontWeight: 700 }}>
          My locked assignment
        </Typography>
        {error ? <Alert severity="error">{error}</Alert> : null}
        {!allocation ? (
          <Alert severity="info">No locked allocation yet.</Alert>
        ) : (
          <Stack spacing={1}>
            <Typography>Stop: {allocation.stop_id}</Typography>
            <Typography>Route: {allocation.route_id}</Typography>
            <Typography>Bus: {allocation.bus_id}</Typography>
          </Stack>
        )}
      </Stack>
    </PortalShell>
  );
}
