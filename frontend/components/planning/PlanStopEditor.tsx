"use client";

/**
 * PlanStopEditor — one clear admin action at a time for proposed runs.
 *
 * Modes: place (map click), combine, split. No raw lat/lng typing.
 */

import Alert from "@mui/material/Alert";
import Button from "@mui/material/Button";
import Checkbox from "@mui/material/Checkbox";
import FormControlLabel from "@mui/material/FormControlLabel";
import FormGroup from "@mui/material/FormGroup";
import MenuItem from "@mui/material/MenuItem";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import ToggleButton from "@mui/material/ToggleButton";
import ToggleButtonGroup from "@mui/material/ToggleButtonGroup";
import Typography from "@mui/material/Typography";

export type PlanEditMode = "place" | "combine" | "split" | null;

export type PlanEditorStop = {
  id: string;
  name: string;
  studentCount: number;
};

export type PlanEditorRoute = {
  id: string;
  name: string;
};

export type PlanEditorStudent = {
  id: string;
  label: string;
};

export type PlanStopEditorProps = {
  mode: PlanEditMode;
  onModeChange: (mode: PlanEditMode) => void;
  stops: PlanEditorStop[];
  routes: PlanEditorRoute[];
  studentsOnSplitStop: PlanEditorStudent[];
  draftLabel?: string | null;
  busy?: boolean;
  // place
  stopName: string;
  onStopNameChange: (v: string) => void;
  routeId: string;
  onRouteIdChange: (v: string) => void;
  onCreateStop: () => void;
  // combine
  absorbStopId: string;
  intoStopId: string;
  onAbsorbStopIdChange: (v: string) => void;
  onIntoStopIdChange: (v: string) => void;
  onCombine: () => void;
  // split
  splitStopId: string;
  onSplitStopIdChange: (v: string) => void;
  splitStudentIds: string[];
  onSplitStudentIdsChange: (ids: string[]) => void;
  onSplit: () => void;
};

export function PlanStopEditor({
  mode,
  onModeChange,
  stops,
  routes,
  studentsOnSplitStop,
  draftLabel = null,
  busy = false,
  stopName,
  onStopNameChange,
  routeId,
  onRouteIdChange,
  onCreateStop,
  absorbStopId,
  intoStopId,
  onAbsorbStopIdChange,
  onIntoStopIdChange,
  onCombine,
  splitStopId,
  onSplitStopIdChange,
  splitStudentIds,
  onSplitStudentIdsChange,
  onSplit,
}: PlanStopEditorProps) {
  return (
    <Stack spacing={2}>
      <Stack spacing={0.5}>
        <Typography variant="subtitle2">Adjust this draft</Typography>
        <Typography variant="body2" color="text.secondary">
          Pick one change at a time. To reorder pickups, use ↑ ↓ on each bus
          below.
        </Typography>
      </Stack>

      <ToggleButtonGroup
        exclusive
        size="small"
        value={mode ?? ""}
        onChange={(_, next: PlanEditMode | "") =>
          onModeChange(next === "" ? null : next)
        }
        aria-label="How to change the draft plan"
      >
        <ToggleButton value="place">Add a pickup</ToggleButton>
        <ToggleButton value="combine">Merge pickups</ToggleButton>
        <ToggleButton value="split">Split a pickup</ToggleButton>
      </ToggleButtonGroup>

      {mode === "place" ? (
        <Stack spacing={1.5}>
          <Alert severity="info">
            Tap the map to place the new pickup
            {draftLabel ? ` · pin set at ${draftLabel}` : " · no pin yet"}.
          </Alert>
          <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5}>
            <TextField
              label="Pickup name"
              size="small"
              value={stopName}
              onChange={(e) => onStopNameChange(e.target.value)}
              placeholder="e.g. Ring Road gate"
              fullWidth
            />
            <TextField
              select
              size="small"
              label="Which bus route?"
              value={routeId}
              onChange={(e) => onRouteIdChange(e.target.value)}
              fullWidth
              helperText="The new stop is added to the end of this route"
            >
              {routes.map((r) => (
                <MenuItem key={r.id} value={r.id}>
                  {r.name}
                </MenuItem>
              ))}
            </TextField>
            <Button
              variant="contained"
              disabled={busy || !stopName.trim() || !draftLabel || !routeId}
              onClick={onCreateStop}
              sx={{ whiteSpace: "nowrap", alignSelf: { sm: "flex-start" } }}
            >
              Add pickup
            </Button>
          </Stack>
        </Stack>
      ) : null}

      {mode === "combine" ? (
        <Stack spacing={1.5}>
          <Alert severity="info">
            Move everyone from the first pickup to the second, then remove the
            empty stop from the routes.
          </Alert>
          <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5}>
            <TextField
              select
              size="small"
              label="Close this pickup"
              value={absorbStopId}
              onChange={(e) => onAbsorbStopIdChange(e.target.value)}
              fullWidth
            >
              {stops.map((s) => (
                <MenuItem key={s.id} value={s.id}>
                  {s.name} ({s.studentCount} students)
                </MenuItem>
              ))}
            </TextField>
            <TextField
              select
              size="small"
              label="Move everyone to"
              value={intoStopId}
              onChange={(e) => onIntoStopIdChange(e.target.value)}
              fullWidth
            >
              {stops
                .filter((s) => s.id !== absorbStopId)
                .map((s) => (
                  <MenuItem key={s.id} value={s.id}>
                    {s.name} ({s.studentCount} students)
                  </MenuItem>
                ))}
            </TextField>
            <Button
              variant="contained"
              disabled={busy || !absorbStopId || !intoStopId}
              onClick={onCombine}
              sx={{ whiteSpace: "nowrap", alignSelf: { sm: "flex-start" } }}
            >
              Merge pickups
            </Button>
          </Stack>
        </Stack>
      ) : null}

      {mode === "split" ? (
        <Stack spacing={1.5}>
          <Alert severity="info">
            Move some students from a busy pickup to a new stop nearby (placed
            next to the original unless you tap the map).
          </Alert>
          <TextField
            select
            size="small"
            label="Busy pickup"
            value={splitStopId}
            onChange={(e) => onSplitStopIdChange(e.target.value)}
            fullWidth
          >
            {stops.map((s) => (
              <MenuItem key={s.id} value={s.id}>
                {s.name} ({s.studentCount} students)
              </MenuItem>
            ))}
          </TextField>
          {splitStopId ? (
            studentsOnSplitStop.length === 0 ? (
              <Typography variant="body2" color="text.secondary">
                No students at this pickup.
              </Typography>
            ) : (
              <FormGroup>
                <Typography variant="caption" color="text.secondary" sx={{ mb: 0.5 }}>
                  Students who should use the new pickup
                </Typography>
                {studentsOnSplitStop.map((st) => (
                  <FormControlLabel
                    key={st.id}
                    control={
                      <Checkbox
                        size="small"
                        checked={splitStudentIds.includes(st.id)}
                        onChange={(e) => {
                          onSplitStudentIdsChange(
                            e.target.checked
                              ? [...splitStudentIds, st.id]
                              : splitStudentIds.filter((id) => id !== st.id),
                          );
                        }}
                      />
                    }
                    label={st.label}
                  />
                ))}
              </FormGroup>
            )
          ) : null}
          <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5}>
            <TextField
              label="Name for the new pickup"
              size="small"
              value={stopName}
              onChange={(e) => onStopNameChange(e.target.value)}
              fullWidth
            />
            <Button
              variant="contained"
              disabled={
                busy ||
                !splitStopId ||
                !stopName.trim() ||
                !splitStudentIds.length
              }
              onClick={onSplit}
              sx={{ whiteSpace: "nowrap", alignSelf: { sm: "flex-start" } }}
            >
              Create new pickup
            </Button>
          </Stack>
          {draftLabel ? (
            <Typography variant="caption" color="text.secondary">
              New pin: {draftLabel} (click map to move)
            </Typography>
          ) : (
            <Typography variant="caption" color="text.secondary">
              No map pin — new stop will sit slightly beside the crowded stop.
            </Typography>
          )}
        </Stack>
      ) : null}
    </Stack>
  );
}
