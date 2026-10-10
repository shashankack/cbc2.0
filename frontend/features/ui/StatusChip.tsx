"use client";

import Chip from "@mui/material/Chip";

const TONE: Record<
  string,
  "default" | "success" | "warning" | "error" | "info" | "primary"
> = {
  pending: "warning",
  proposed: "warning",
  processing: "warning",
  approved: "success",
  active: "success",
  completed: "success",
  confirmed: "success",
  locked: "success",
  imported: "info",
  allocated: "info",
  scheduled: "info",
  rejected: "error",
  failed: "error",
  unavailable: "error",
  ended: "default",
  cancelled: "default",
  needs_admin_review: "warning",
  snapped: "info",
  available: "success",
  in_service: "info",
  open: "warning",
  resolved: "success",
  assigned: "info",
};

/** Plain-language labels for API status codes. */
const FRIENDLY: Record<string, string> = {
  pending: "Waiting",
  proposed: "Draft",
  processing: "Working…",
  approved: "Approved",
  active: "Active",
  completed: "Done",
  confirmed: "Confirmed",
  locked: "Locked in",
  imported: "Imported",
  allocated: "Assigned",
  scheduled: "Scheduled",
  rejected: "Rejected",
  failed: "Failed",
  unavailable: "Not available",
  ended: "Ended",
  cancelled: "Cancelled",
  needs_admin_review: "Needs review",
  snapped: "On map",
  available: "Ready",
  in_service: "On a trip",
  open: "Open",
  resolved: "Resolved",
  assigned: "Assigned",
};

type StatusChipProps = {
  status: string;
  label?: string;
};

export default function StatusChip({ status, label }: StatusChipProps) {
  const key = status.toLowerCase();
  const color = TONE[key] ?? "default";
  const display =
    label ?? FRIENDLY[key] ?? status.replaceAll("_", " ");
  return (
    <Chip
      size="small"
      color={color}
      variant={color === "default" ? "outlined" : "filled"}
      label={display}
      sx={{ textTransform: "none", fontWeight: 600 }}
    />
  );
}
