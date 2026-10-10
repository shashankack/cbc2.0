"use client";

/**
 * ImportResultSummary — Excel/CSV validation counts (props only).
 *
 * @example
 * ```tsx
 * <ImportResultSummary validCount={120} invalidCount={4} totalCount={124} />
 * ```
 */

import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import CircularProgress from "@mui/material/CircularProgress";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";

export type ImportIssue = {
  rowNumber: number;
  message: string;
};

export type ImportResultSummaryProps = {
  validCount: number;
  invalidCount: number;
  totalCount?: number;
  loading?: boolean;
  error?: string | null;
  issues?: ImportIssue[];
  emptyMessage?: string;
};

export function ImportResultSummary({
  validCount,
  invalidCount,
  totalCount,
  loading = false,
  error = null,
  issues = [],
  emptyMessage = "No import results yet.",
}: ImportResultSummaryProps) {
  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", py: 3 }}>
        <CircularProgress size={28} aria-label="Loading import results" />
      </Box>
    );
  }

  if (error) {
    return <Alert severity="error">{error}</Alert>;
  }

  const total = totalCount ?? validCount + invalidCount;

  if (total === 0) {
    return <Alert severity="info">{emptyMessage}</Alert>;
  }

  return (
    <Stack spacing={2}>
      <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
        <Card variant="outlined" sx={{ flex: 1 }}>
          <CardContent>
            <Typography color="text.secondary" variant="body2">
              Valid rows
            </Typography>
            <Typography variant="h4" color="success.main">
              {validCount}
            </Typography>
          </CardContent>
        </Card>
        <Card variant="outlined" sx={{ flex: 1 }}>
          <CardContent>
            <Typography color="text.secondary" variant="body2">
              Invalid rows
            </Typography>
            <Typography variant="h4" color={invalidCount ? "error.main" : "text.primary"}>
              {invalidCount}
            </Typography>
          </CardContent>
        </Card>
        <Card variant="outlined" sx={{ flex: 1 }}>
          <CardContent>
            <Typography color="text.secondary" variant="body2">
              Total rows
            </Typography>
            <Typography variant="h4">{total}</Typography>
          </CardContent>
        </Card>
      </Stack>
      {invalidCount > 0 ? (
        <Alert severity="warning">
          {invalidCount} row{invalidCount === 1 ? "" : "s"} failed validation. Fix the file and
          re-import. No student accounts are created from invalid rows.
        </Alert>
      ) : (
        <Alert severity="success">All rows passed validation.</Alert>
      )}
      {issues.length > 0 ? (
        <Alert severity="info">
          {issues.slice(0, 8).map((issue) => (
            <div key={`${issue.rowNumber}-${issue.message}`}>
              Row {issue.rowNumber}: {issue.message}
            </div>
          ))}
          {issues.length > 8 ? <div>…and {issues.length - 8} more</div> : null}
        </Alert>
      ) : null}
    </Stack>
  );
}
