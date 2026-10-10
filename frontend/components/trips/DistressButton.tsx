"use client";

/**
 * DistressButton — prominent control; confirm dialog before firing onDistress.
 *
 * @example
 * ```tsx
 * <DistressButton onDistress={() => {}} disabled={session !== "active"} />
 * ```
 */

import Button from "@mui/material/Button";
import CircularProgress from "@mui/material/CircularProgress";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogContentText from "@mui/material/DialogContentText";
import DialogTitle from "@mui/material/DialogTitle";
import ReportProblemIcon from "@mui/icons-material/ReportProblem";
import { useState } from "react";

export type DistressButtonProps = {
  onDistress: () => void;
  disabled?: boolean;
  loading?: boolean;
  label?: string;
};

export function DistressButton({
  onDistress,
  disabled = false,
  loading = false,
  label = "Distress",
}: DistressButtonProps) {
  const [open, setOpen] = useState(false);

  const handleConfirm = () => {
    setOpen(false);
    onDistress();
  };

  return (
    <>
      <Button
        variant="contained"
        color="error"
        size="large"
        fullWidth
        startIcon={
          loading ? (
            <CircularProgress size={18} color="inherit" />
          ) : (
            <ReportProblemIcon />
          )
        }
        disabled={disabled || loading}
        onClick={() => setOpen(true)}
        aria-haspopup="dialog"
      >
        {label}
      </Button>
      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        aria-labelledby="distress-confirm-title"
        aria-describedby="distress-confirm-desc"
      >
        <DialogTitle id="distress-confirm-title">Send distress alert?</DialogTitle>
        <DialogContent>
          <DialogContentText id="distress-confirm-desc">
            This records the current driver location and asks admin to confirm an emergency
            reallocation of remaining pickups. Only continue if this is a real emergency.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Cancel</Button>
          <Button color="error" variant="contained" onClick={handleConfirm} autoFocus>
            Confirm distress
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
