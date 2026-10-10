"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Alert from "@mui/material/Alert";
import Button from "@mui/material/Button";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { PlanConfirmBar } from "@/components/planning";
import PortalShell from "@/features/shell/PortalShell";
import { PageHeader, SectionCard, StatusChip } from "@/features/ui";
import { apiGet, apiPost, ApiError } from "@/lib/api";
import { primaryCollegeId, resolveHomePath, useAuth } from "@/lib/auth";
import { hasRole } from "@/lib/roles";
import type { Campus } from "@/types/api";

const nav = [
  { href: "/admin", label: "Campuses" },
  { href: "/admin/buses", label: "Buses" },
  { href: "/admin/import", label: "Import" },
  { href: "/admin/planning", label: "Planning" },
];

type PlanningRun = {
  id: string;
  status: string;
  campus_id: string;
  import_batch_id: string | null;
  routes: { id: string; name: string }[];
  items: { id: string; status: string }[];
};

export default function AdminPlanningPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const collegeId = user ? primaryCollegeId(user) : null;
  const [campusId, setCampusId] = useState("");
  const [batchId, setBatchId] = useState("");
  const [run, setRun] = useState<PlanningRun | null>(null);
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
      return;
    }
    if (!collegeId) return;
    void apiGet<Campus[]>(`/colleges/${collegeId}/campuses`).then((rows) => {
      if (rows[0]) setCampusId(rows[0].id);
    });
  }, [loading, user, collegeId, router]);

  async function runPlanning() {
    if (!collegeId || !campusId) return;
    try {
      const result = await apiPost<PlanningRun>(
        `/colleges/${collegeId}/planning-runs`,
        {
          campus_id: campusId,
          import_batch_id: batchId || null,
        },
      );
      setRun(result);
      setError(null);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Planning failed.");
    }
  }

  async function confirm() {
    if (!collegeId || !run) return;
    setConfirming(true);
    try {
      const result = await apiPost<PlanningRun>(
        `/colleges/${collegeId}/planning-runs/${run.id}/confirm`,
      );
      setRun(result);
    } catch (err) {
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

  const proposed = run?.items.filter((i) =>
    ["proposed", "snapped"].includes(i.status),
  ).length;
  const review = run?.items.filter((i) => i.status === "needs_admin_review")
    .length;

  return (
    <PortalShell title="College admin" description="Cluster and confirm" nav={nav}>
      <PageHeader
        title="Planning"
        description="Run clustering to propose stops, routes, and buses. Confirm locks student assignments."
      />
      {error ? (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      ) : null}
      <Stack spacing={3}>
        <SectionCard title="Run proposal">
          <Stack spacing={2}>
            <TextField
              label="Campus ID"
              value={campusId}
              onChange={(e) => setCampusId(e.target.value)}
              fullWidth
            />
            <TextField
              label="Import batch ID (optional)"
              value={batchId}
              onChange={(e) => setBatchId(e.target.value)}
              fullWidth
            />
            <Button
              variant="contained"
              onClick={() => void runPlanning()}
              sx={{ alignSelf: "flex-start" }}
            >
              Run clustering / assignment
            </Button>
          </Stack>
        </SectionCard>
        {run ? (
          <SectionCard
            title="Proposal result"
            actions={<StatusChip status={run.status} />}
          >
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Run {run.id} · routes {run.routes.length} · items {run.items.length}
              {typeof review === "number" ? ` · review ${review}` : ""}
            </Typography>
            {run.status === "proposed" ? (
              <PlanConfirmBar
                routeCount={run.routes.length}
                studentCount={proposed ?? 0}
                stopCount={review ?? 0}
                busCount={
                  new Set(
                    run.items
                      .map((i) => (i as { bus_id?: string }).bus_id)
                      .filter(Boolean),
                  ).size
                }
                loading={confirming}
                onConfirm={() => void confirm()}
                onReject={() => setRun(null)}
              />
            ) : null}
          </SectionCard>
        ) : null}
      </Stack>
    </PortalShell>
  );
}
