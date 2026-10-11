"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Alert from "@mui/material/Alert";
import MenuItem from "@mui/material/MenuItem";
import Stack from "@mui/material/Stack";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { adminShellNav } from "@/features/admin/nav";
import PortalShell from "@/features/shell/PortalShell";
import {
  EmptyState,
  PageHeader,
  SectionCard,
  StatusChip,
} from "@/features/ui";
import { apiGet, ApiError } from "@/lib/api";
import { primaryCollegeId, resolveHomePath, useAuth } from "@/lib/auth";
import { hasRole } from "@/lib/roles";
import type { Trip } from "@/types/api";

const { nav, navSections } = adminShellNav();

function formatTime(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleString();
}

function formatDuration(seconds: number | null | undefined): string {
  if (seconds == null) return "—";
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  if (m >= 60) {
    const h = Math.floor(m / 60);
    const rm = m % 60;
    return `${h}h ${rm}m`;
  }
  return `${m}m ${s}s`;
}

export default function AdminTripsPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const collegeId = user ? primaryCollegeId(user) : null;
  const [trips, setTrips] = useState<Trip[]>([]);
  const [statusFilter, setStatusFilter] = useState("all");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.replace("/login");
      return;
    }
    if (!hasRole(user, "college_admin") && !user.is_platform_operator) {
      router.replace(resolveHomePath(user));
      return;
    }
    if (!collegeId) return;
    const q =
      statusFilter === "all"
        ? ""
        : `?status=${encodeURIComponent(statusFilter)}`;
    void apiGet<Trip[]>(`/colleges/${collegeId}/trips${q}`)
      .then((rows) => {
        setTrips(rows);
        setError(null);
      })
      .catch((err: unknown) => {
        setError(err instanceof ApiError ? err.message : "Load failed.");
      });
  }, [loading, user, collegeId, router, statusFilter]);

  const summary = useMemo(() => {
    const ended = trips.filter((t) => t.status === "ended" && t.duration_seconds != null);
    const totalMin = ended.reduce(
      (sum, t) => sum + (t.duration_seconds ?? 0),
      0,
    );
    return {
      total: trips.length,
      active: trips.filter((t) => t.status === "active").length,
      ended: ended.length,
      avgMin:
        ended.length > 0
          ? Math.round(totalMin / ended.length / 60)
          : null,
    };
  }, [trips]);

  if (loading || !user) return null;
  if (!collegeId) {
    return (
      <PortalShell title="College admin" nav={nav} navSections={navSections}>
        <Alert severity="warning">No college membership on this account.</Alert>
      </PortalShell>
    );
  }

  return (
    <PortalShell title="College admin" nav={nav} navSections={navSections}>
      <PageHeader
        title="Trip history"
        description="Start and end times after drivers run their trips."
      />
      {error ? (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      ) : null}

      <SectionCard title="Trip list">
        <Stack
          direction={{ xs: "column", sm: "row" }}
          spacing={1.5}
          sx={{
            mb: 2,
            alignItems: { sm: "center" },
            justifyContent: "space-between",
          }}
        >
          <Typography variant="body2" color="text.secondary">
            {summary.total} trips · {summary.active} running · {summary.ended}{" "}
            finished
            {summary.avgMin != null ? ` · avg ${summary.avgMin} min` : ""}
          </Typography>
          <TextField
            select
            size="small"
            label="Show"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            sx={{ minWidth: 180 }}
          >
            <MenuItem value="all">All trips</MenuItem>
            <MenuItem value="scheduled">Not started yet</MenuItem>
            <MenuItem value="active">Running now</MenuItem>
            <MenuItem value="ended">Finished</MenuItem>
          </TextField>
        </Stack>
        {trips.length === 0 ? (
          <EmptyState
            title="No trips yet"
            description="Confirm a route plan with drivers assigned to buses, then have drivers start their trip."
          />
        ) : (
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Driver</TableCell>
                  <TableCell>Bus</TableCell>
                  <TableCell>Route</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Started</TableCell>
                  <TableCell>Ended</TableCell>
                  <TableCell>Duration</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {trips.map((t) => (
                  <TableRow key={t.id} hover>
                    <TableCell>
                      {t.driver_email ?? t.driver_user_id.slice(0, 8)}
                    </TableCell>
                    <TableCell>
                      {t.bus_registration ?? t.bus_id.slice(0, 8)}
                    </TableCell>
                    <TableCell>
                      {t.route_name ?? t.route_id.slice(0, 8)}
                    </TableCell>
                    <TableCell>
                      <StatusChip status={t.status} />
                    </TableCell>
                    <TableCell>{formatTime(t.started_at)}</TableCell>
                    <TableCell>{formatTime(t.ended_at)}</TableCell>
                    <TableCell>
                      {formatDuration(t.duration_seconds)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </SectionCard>
    </PortalShell>
  );
}
