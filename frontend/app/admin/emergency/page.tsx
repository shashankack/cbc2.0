"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Alert from "@mui/material/Alert";
import Button from "@mui/material/Button";
import Stack from "@mui/material/Stack";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Typography from "@mui/material/Typography";
import { EmergencyReallocationCard } from "@/components/planning";
import { ADMIN_NAV } from "@/features/admin/nav";
import PortalShell from "@/features/shell/PortalShell";
import { PageHeader, SectionCard, StatusChip } from "@/features/ui";
import { apiGet, apiPost, ApiError } from "@/lib/api";
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
    kind?: string;
    note?: string;
    students_reassigned?: number;
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
  const [rows, setRows] = useState<EmergencyOut[]>([]);
  const [result, setResult] = useState<EmergencyOut | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!collegeId) return;
    const proposed = await apiGet<EmergencyOut[]>(
      `/colleges/${collegeId}/emergency-reallocations?status=proposed`,
    );
    setRows(proposed);
  }, [collegeId]);

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
    void load().catch((err: unknown) => {
      setError(err instanceof ApiError ? err.message : "Load failed.");
    });
  }, [loading, user, router, load]);

  async function confirm(id: string) {
    if (!collegeId) return;
    setBusyId(id);
    setError(null);
    try {
      const row = await apiPost<EmergencyOut>(
        `/colleges/${collegeId}/emergency-reallocations/${id}/confirm`,
      );
      setResult(row);
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Confirm failed.");
    } finally {
      setBusyId(null);
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
    <PortalShell title="College admin" description="Urgent bus replacement" nav={nav}>
      <PageHeader
        title="Emergencies"
        description="When a driver raises an emergency, review the suggested replacement buses and confirm so remaining students get a new ride."
        actions={result ? <StatusChip status={result.status} /> : null}
      />
      {error ? (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      ) : null}

      <Stack spacing={3}>
        <SectionCard title="Needs your decision">
          {rows.length === 0 ? (
            <Alert severity="info">No emergencies waiting for a decision.</Alert>
          ) : (
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Reference</TableCell>
                    <TableCell>Type</TableCell>
                    <TableCell align="right">Students left</TableCell>
                    <TableCell align="right">Replacement buses</TableCell>
                    <TableCell align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {rows.map((r) => (
                    <TableRow key={r.id} hover>
                      <TableCell sx={{ fontFamily: "monospace", fontSize: 12 }}>
                        {r.id.slice(0, 8)}…
                      </TableCell>
                      <TableCell>
                        {r.plan_json.kind === "disruption"
                          ? "Disruption"
                          : "Distress"}
                      </TableCell>
                      <TableCell align="right">
                        {r.plan_json.remaining_count ?? "—"}
                      </TableCell>
                      <TableCell align="right">
                        {r.plan_json.replacement_buses?.length ?? 0}
                      </TableCell>
                      <TableCell align="right">
                        <Button
                          size="small"
                          variant="contained"
                          disabled={busyId === r.id}
                          onClick={() => void confirm(r.id)}
                        >
                          {busyId === r.id ? "Applying…" : "Confirm & apply"}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </SectionCard>

        {result ? (
          <SectionCard title="Last plan you confirmed">
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Plan {result.id}
              {result.confirmed_at
                ? ` · ${new Date(result.confirmed_at).toLocaleString()}`
                : ""}
              {typeof plan?.students_reassigned === "number"
                ? ` · reassigned ${plan.students_reassigned}`
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
