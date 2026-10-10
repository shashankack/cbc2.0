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
};

type StatusChipProps = {
  status: string;
  label?: string;
};

export default function StatusChip({ status, label }: StatusChipProps) {
  const key = status.toLowerCase();
  const color = TONE[key] ?? "default";
  return (
    <Chip
      size="small"
      color={color}
      variant={color === "default" ? "outlined" : "filled"}
      label={label ?? status.replaceAll("_", " ")}
      sx={{ textTransform: "capitalize", fontWeight: 600 }}
    />
  );
}
