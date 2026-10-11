"use client";

import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import NextLink from "next/link";

type Stat = {
  label: string;
  value: string | number;
};

type AdminDashboardHeroProps = {
  collegeLabel?: string;
  stats: Stat[];
};

const QUICK = [
  { href: "/admin/buses", label: "Buses" },
  { href: "/admin/drivers", label: "Drivers" },
  { href: "/admin/disruptions", label: "Bus problems" },
  { href: "/admin/analytics", label: "Who boarded" },
] as const;

export default function AdminDashboardHero({
  collegeLabel,
  stats,
}: AdminDashboardHeroProps) {
  return (
    <Box
      sx={{
        mb: 2.5,
        p: { xs: 2, sm: 2.25 },
        borderRadius: 2,
        border: "1px solid",
        borderColor: "divider",
        bgcolor: "background.paper",
      }}
    >
      <Stack
        direction={{ xs: "column", md: "row" }}
        spacing={2}
        sx={{
          alignItems: { md: "center" },
          justifyContent: "space-between",
        }}
      >
        <Box sx={{ minWidth: 0 }}>
          <Typography variant="h6" sx={{ fontWeight: 750 }}>
            {collegeLabel ? `Hi, ${collegeLabel}` : "College dashboard"}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.35 }}>
            Pin campuses, upload students, then plan routes.
          </Typography>
          <Stack direction="row" spacing={1} useFlexGap sx={{ flexWrap: "wrap", mt: 1.5 }}>
            {stats.map((s) => (
              <Box
                key={s.label}
                sx={{
                  px: 1.25,
                  py: 0.75,
                  borderRadius: 1.5,
                  border: "1px solid",
                  borderColor: "divider",
                  bgcolor: "rgba(241, 245, 249, 0.8)",
                  minWidth: 88,
                }}
              >
                <Typography variant="subtitle1" sx={{ fontWeight: 800, lineHeight: 1.1 }}>
                  {s.value}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {s.label}
                </Typography>
              </Box>
            ))}
          </Stack>
        </Box>

        <Stack spacing={1.25} sx={{ flexShrink: 0 }}>
          <Stack direction="row" spacing={1}>
            <Button
              component={NextLink}
              href="/admin/planning"
              variant="contained"
              endIcon={<ArrowForwardIcon />}
            >
              Plan routes
            </Button>
            <Button component={NextLink} href="/admin/import" variant="outlined">
              Upload students
            </Button>
          </Stack>
          <Stack direction="row" spacing={0.75} useFlexGap sx={{ flexWrap: "wrap" }}>
            {QUICK.map((q) => (
              <Chip
                key={q.href}
                component={NextLink}
                href={q.href}
                clickable
                size="small"
                label={q.label}
                variant="outlined"
              />
            ))}
          </Stack>
        </Stack>
      </Stack>
    </Box>
  );
}
