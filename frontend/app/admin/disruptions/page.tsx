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
import { adminShellNav } from "@/features/admin/nav";
import PortalShell from "@/features/shell/PortalShell";
import { PageHeader, SectionCard, StatusChip } from "@/features/ui";
import { apiGet, apiPost, ApiError } from "@/lib/api";
import { primaryCollegeId, resolveHomePath, useAuth } from "@/lib/auth";
import { hasRole } from "@/lib/roles";

const { nav, navSections } = adminShellNav();

type EmergencyOut = {
  id: string;
  status: string;
  plan_json: {
    kind?: string;
    affected_count?: number;
    remaining_count?: number;
    note?: string;
    replacement_buses?: { registration_number?: string; capacity?: number; distance_m_approx?: number | null }[];
  };
  confirmed_at: string | null;
};

export default function AdminDisruptionsPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const collegeId = user ? primaryCollegeId(user) : null;
  const [rows, setRows] = useState<EmergencyOut[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!collegeId) return;
    const all = await apiGet<EmergencyOut[]>(
      `/colleges/${collegeId}/emergency-reallocations?status=proposed`,
    );
    setRows(all.filter((r) => r.plan_json.kind === "disruption"));
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
      await apiPost(
        `/colleges/${collegeId}/emergency-reallocations/${id}/confirm`,
      );
      setMessage("Disruption applied — students moved to replacement buses.");
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
      <PortalShell title="College admin" nav={nav} navSections={navSections}>
        <Alert severity="warning">No college membership on this account.</Alert>
      </PortalShell>
    );
  }

  return (
    <PortalShell title="College admin" nav={nav} navSections={navSections}>
      <PageHeader
        title="Bus problems"
        description="Review reassignment suggestions when a bus can’t run."
        actions={
          <Button href="/admin/buses" variant="outlined">
            Buses
          </Button>
        }
      />
      {error ? (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      ) : null}
      {message ? (
        <Alert severity="success" sx={{ mb: 2 }}>
          {message}
        </Alert>
      ) : null}
      <SectionCard title="Waiting for your decision">
        {rows.length === 0 ? (
          <Alert severity="info">
            Nothing waiting right now. On the Buses page, choose “Bus problem →
            reassign” when a vehicle can’t run.
          </Alert>
        ) : (
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Plan</TableCell>
                  <TableCell>Affected</TableCell>
                  <TableCell>Replacements</TableCell>
                  <TableCell>Status</TableCell>
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
                      {r.plan_json.affected_count ??
                        r.plan_json.remaining_count ??
                        "—"}
                    </TableCell>
                    <TableCell>
                      {(r.plan_json.replacement_buses ?? [])
                        .map(
                          (b) =>
                            `${b.registration_number ?? "?"} (cap ${b.capacity ?? "?"}${
                              b.distance_m_approx != null
                                ? `, ~${b.distance_m_approx}m`
                                : ""
                            })`,
                        )
                        .join(", ") || "—"}
                    </TableCell>
                    <TableCell>
                      <StatusChip status={r.status} />
                    </TableCell>
                    <TableCell align="right">
                      <Button
                        size="small"
                        variant="contained"
                        disabled={busyId === r.id}
                        onClick={() => void confirm(r.id)}
                      >
                        {busyId === r.id ? "Applying…" : "Confirm & reassign"}
                      </Button>
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
