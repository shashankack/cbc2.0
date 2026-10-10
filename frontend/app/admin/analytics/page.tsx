"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Alert from "@mui/material/Alert";
import Stack from "@mui/material/Stack";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import { ADMIN_NAV } from "@/features/admin/nav";
import PortalShell from "@/features/shell/PortalShell";
import { PageHeader, SectionCard, StatusChip } from "@/features/ui";
import { apiGet, ApiError } from "@/lib/api";
import { primaryCollegeId, resolveHomePath, useAuth } from "@/lib/auth";
import { hasRole } from "@/lib/roles";

const nav = [...ADMIN_NAV];

type AttendanceRow = {
  trip_id: string;
  status: string;
  route_name: string | null;
  bus_registration: string | null;
  started_at: string | null;
  ended_at: string | null;
  assigned_count: number;
  boarded_count: number;
  no_show_count: number;
};

export default function AdminAnalyticsPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const collegeId = user ? primaryCollegeId(user) : null;
  const [rows, setRows] = useState<AttendanceRow[]>([]);
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
    void apiGet<AttendanceRow[]>(
      `/colleges/${collegeId}/analytics/attendance`,
    )
      .then(setRows)
      .catch((err: unknown) => {
        setError(err instanceof ApiError ? err.message : "Load failed.");
      });
  }, [loading, user, collegeId, router]);

  if (loading || !user) return null;
  if (!collegeId) {
    return (
      <PortalShell title="College admin" nav={nav}>
        <Alert severity="warning">No college membership on this account.</Alert>
      </PortalShell>
    );
  }

  return (
    <PortalShell title="College admin" description="Boarding analytics" nav={nav}>
      <PageHeader
        title="Attendance analytics"
        description="Rule-based boarded vs assigned counts per trip (not ML / not traffic)."
      />
      {error ? (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      ) : null}
      <SectionCard title="Recent trips">
        {rows.length === 0 ? (
          <Alert severity="info">No trips yet.</Alert>
        ) : (
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Started</TableCell>
                  <TableCell>Route</TableCell>
                  <TableCell>Bus</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell align="right">Assigned</TableCell>
                  <TableCell align="right">Boarded</TableCell>
                  <TableCell align="right">No-show</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {rows.map((r) => (
                  <TableRow key={r.trip_id} hover>
                    <TableCell>
                      {r.started_at
                        ? new Date(r.started_at).toLocaleString()
                        : "—"}
                    </TableCell>
                    <TableCell>{r.route_name ?? "—"}</TableCell>
                    <TableCell>{r.bus_registration ?? "—"}</TableCell>
                    <TableCell>
                      <StatusChip status={r.status} />
                    </TableCell>
                    <TableCell align="right">{r.assigned_count}</TableCell>
                    <TableCell align="right">{r.boarded_count}</TableCell>
                    <TableCell align="right">{r.no_show_count}</TableCell>
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
