"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Accordion from "@mui/material/Accordion";
import AccordionDetails from "@mui/material/AccordionDetails";
import AccordionSummary from "@mui/material/AccordionSummary";
import Alert from "@mui/material/Alert";
import Button from "@mui/material/Button";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
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
import { ImportResultSummary } from "@/components/planning";
import { adminShellNav } from "@/features/admin/nav";
import PortalShell from "@/features/shell/PortalShell";
import { PageHeader, SectionCard, StatusChip } from "@/features/ui";
import { apiGet, apiRequest, ApiError } from "@/lib/api";
import { primaryCollegeId, resolveHomePath, useAuth } from "@/lib/auth";
import { hasRole } from "@/lib/roles";
import type { Campus, ImportBatch } from "@/types/api";

const { nav, navSections } = adminShellNav();

export default function AdminImportPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const collegeId = user ? primaryCollegeId(user) : null;
  const [campusId, setCampusId] = useState("");
  const [campuses, setCampuses] = useState<Campus[]>([]);
  const [batches, setBatches] = useState<ImportBatch[]>([]);
  const [batch, setBatch] = useState<ImportBatch | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [activeOnly, setActiveOnly] = useState(true);

  const loadBatches = useCallback(async () => {
    if (!collegeId) return;
    const q = activeOnly ? "?active_only=true" : "";
    const rows = await apiGet<ImportBatch[]>(
      `/colleges/${collegeId}/imports/students${q}`,
    );
    setBatches(rows);
  }, [collegeId, activeOnly]);

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
    void apiGet<Campus[]>(`/colleges/${collegeId}/campuses`)
      .then((rows) => {
        setCampuses(rows);
        setCampusId((prev) => prev || rows[0]?.id || "");
      })
      .catch((err: unknown) => {
        setError(err instanceof ApiError ? err.message : "Load failed.");
      });
  }, [loading, user, collegeId, router]);

  useEffect(() => {
    if (!collegeId || loading) return;
    void loadBatches()
      .then(() => setError(null))
      .catch((err: unknown) => {
        setError(err instanceof ApiError ? err.message : "Could not load batches.");
      });
  }, [collegeId, loading, loadBatches]);

  async function upload() {
    if (!collegeId || !campusId || !file) return;
    const form = new FormData();
    form.append("campus_id", campusId);
    form.append("file", file);
    try {
      const result = await apiRequest<ImportBatch>(
        `/colleges/${collegeId}/imports/students`,
        { method: "POST", formData: form },
      );
      setBatch(result);
      setError(null);
      await loadBatches();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Import failed.");
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
        title="Upload students"
        description="Spreadsheet with name, student ID, email, and home location — then plan routes."
      />
      {error ? (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      ) : null}
      <Stack spacing={2.5}>
        <SectionCard title="Upload a spreadsheet">
          <Stack
            direction={{ xs: "column", sm: "row" }}
            spacing={1.5}
            sx={{ alignItems: { sm: "flex-end" } }}
          >
            <TextField
              select
              label="Campus"
              size="small"
              value={campusId}
              onChange={(e) => setCampusId(e.target.value)}
              fullWidth
              helperText={
                campuses.length ? undefined : "Add a campus on Home first"
              }
            >
              {campuses.map((c) => (
                <MenuItem key={c.id} value={c.id}>
                  {c.name} ({c.code})
                </MenuItem>
              ))}
            </TextField>
            <Button variant="outlined" component="label" sx={{ whiteSpace: "nowrap" }}>
              Choose file
              <input
                hidden
                type="file"
                accept=".csv,.xlsx,.xlsm"
                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              />
            </Button>
            <Button
              variant="contained"
              onClick={() => void upload()}
              disabled={!file || !campusId}
              sx={{ whiteSpace: "nowrap" }}
            >
              Upload
            </Button>
          </Stack>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            {file?.name ?? "No file chosen yet"}
          </Typography>
        </SectionCard>
        {batch ? (
          <SectionCard title="Upload result">
            <ImportResultSummary
              validCount={batch.valid_count}
              invalidCount={batch.error_count}
              totalCount={batch.row_count}
            />
            <Button
              sx={{ mt: 2 }}
              variant="contained"
              href={`/admin/planning?campusId=${batch.campus_id}&batchId=${batch.id}`}
            >
              Continue to plan routes
            </Button>
          </SectionCard>
        ) : null}

        <Accordion
          defaultExpanded={batches.length > 0 && !batch}
          disableGutters
          elevation={0}
          sx={{
            border: "1px solid",
            borderColor: "divider",
            borderRadius: 2,
            "&:before": { display: "none" },
          }}
        >
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Stack
              direction="row"
              spacing={2}
              sx={{ width: "100%", alignItems: "center", pr: 1 }}
            >
              <Typography variant="subtitle2" sx={{ flexGrow: 1 }}>
                Upload history ({batches.length})
              </Typography>
              <TextField
                select
                size="small"
                label="Show"
                value={activeOnly ? "active" : "all"}
                onChange={(e) => {
                  e.stopPropagation();
                  setActiveOnly(e.target.value === "active");
                }}
                onClick={(e) => e.stopPropagation()}
                sx={{ minWidth: 140 }}
              >
                <MenuItem value="active">Ready to plan</MenuItem>
                <MenuItem value="all">Everything</MenuItem>
              </TextField>
            </Stack>
          </AccordionSummary>
          <AccordionDetails>
            {batches.length === 0 ? (
              <Alert severity="info">
                {activeOnly
                  ? "No lists ready to plan yet."
                  : "No student uploads yet."}
              </Alert>
            ) : (
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Uploaded</TableCell>
                      <TableCell>File</TableCell>
                      <TableCell>Campus</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell align="right">OK</TableCell>
                      <TableCell align="right">Open</TableCell>
                      <TableCell align="right">Locked</TableCell>
                      <TableCell align="right">Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {batches.map((b) => (
                      <TableRow key={b.id} hover>
                        <TableCell>
                          {new Date(b.created_at).toLocaleString()}
                        </TableCell>
                        <TableCell>{b.filename}</TableCell>
                        <TableCell>
                          {b.campus_code
                            ? `${b.campus_name ?? ""} (${b.campus_code})`.trim()
                            : b.campus_id.slice(0, 8)}
                        </TableCell>
                        <TableCell>
                          <Stack spacing={0.5}>
                            <StatusChip status={b.status} />
                            {b.is_active ? (
                              <StatusChip status="available" label="Ready to plan" />
                            ) : b.status === "completed" ? (
                              <StatusChip status="confirmed" label="Routes locked" />
                            ) : null}
                          </Stack>
                        </TableCell>
                        <TableCell align="right">{b.valid_count}</TableCell>
                        <TableCell align="right">
                          {b.active_student_count ?? "—"}
                        </TableCell>
                        <TableCell align="right">
                          {b.locked_student_count ?? "—"}
                        </TableCell>
                        <TableCell align="right">
                          <Button
                            size="small"
                            href={`/admin/planning?campusId=${b.campus_id}&batchId=${b.id}`}
                          >
                            Plan
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </AccordionDetails>
        </Accordion>
      </Stack>
    </PortalShell>
  );
}
