"use client";

import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import DirectionsBusIcon from "@mui/icons-material/DirectionsBus";
import MapOutlinedIcon from "@mui/icons-material/MapOutlined";
import QrCodeScannerIcon from "@mui/icons-material/QrCodeScanner";
import UploadFileIcon from "@mui/icons-material/UploadFile";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import NextLink from "next/link";
import type { ReactNode } from "react";

type Stat = {
  label: string;
  value: string | number;
};

type QuickLink = {
  href: string;
  label: string;
  description: string;
  icon: ReactNode;
};

const LINKS: QuickLink[] = [
  {
    href: "/admin/import",
    label: "Upload students",
    description: "Spreadsheet of home addresses",
    icon: <UploadFileIcon fontSize="small" />,
  },
  {
    href: "/admin/planning",
    label: "Plan routes",
    description: "Build stops, assign buses, lock in",
    icon: <MapOutlinedIcon fontSize="small" />,
  },
  {
    href: "/admin/buses",
    label: "Buses",
    description: "Seats, drivers, and availability",
    icon: <DirectionsBusIcon fontSize="small" />,
  },
  {
    href: "/admin/disruptions",
    label: "Bus problems",
    description: "Move students when a bus is out",
    icon: <WarningAmberIcon fontSize="small" />,
  },
  {
    href: "/admin/analytics",
    label: "Who boarded",
    description: "See who got on vs who was assigned",
    icon: <QrCodeScannerIcon fontSize="small" />,
  },
];

type AdminDashboardHeroProps = {
  collegeLabel?: string;
  stats: Stat[];
};

export default function AdminDashboardHero({
  collegeLabel,
  stats,
}: AdminDashboardHeroProps) {
  return (
    <Stack spacing={2.5} sx={{ mb: 3.5 }}>
      <Box
        sx={{
          position: "relative",
          overflow: "hidden",
          borderRadius: 3,
          border: "1px solid",
          borderColor: "divider",
          p: { xs: 2.5, sm: 3.5 },
          background:
            "linear-gradient(135deg, #FFFFFF 0%, #F1F5F9 50%, rgba(20,184,166,0.12) 100%)",
        }}
      >
        <Box
          aria-hidden
          sx={{
            pointerEvents: "none",
            position: "absolute",
            right: -40,
            top: -40,
            width: 200,
            height: 200,
            borderRadius: "50%",
            bgcolor: "rgba(20, 184, 166, 0.12)",
            filter: "blur(40px)",
          }}
        />
        <Stack
          direction={{ xs: "column", md: "row" }}
          spacing={2.5}
          sx={{
            position: "relative",
            alignItems: { md: "flex-end" },
            justifyContent: "space-between",
          }}
        >
          <Box sx={{ maxWidth: 520 }}>
            <Typography
              variant="caption"
              sx={{ color: "primary.main", fontWeight: 700, letterSpacing: "0.04em" }}
            >
              COLLEGE ADMIN
            </Typography>
            <Typography variant="h4" sx={{ mt: 0.5, fontWeight: 800 }}>
              Your college dashboard
            </Typography>
            <Typography color="text.secondary" sx={{ mt: 1, lineHeight: 1.6 }}>
              {collegeLabel ? (
                <>
                  Signed in as <strong>{collegeLabel}</strong>.{" "}
                </>
              ) : null}
              Pin each campus on the map, upload students, plan bus routes, then
              follow boarding and any bus problems from here.
            </Typography>
            <Stack direction="row" spacing={1.25} sx={{ mt: 2.5 }}>
              <Button
                component={NextLink}
                href="/admin/planning"
                variant="contained"
                endIcon={<ArrowForwardIcon />}
              >
                Plan routes
              </Button>
              <Button
                component={NextLink}
                href="/admin/import"
                variant="outlined"
              >
                Upload students
              </Button>
            </Stack>
          </Box>

          <Stack
            direction="row"
            spacing={1.25}
            useFlexGap
            sx={{ flexWrap: "wrap" }}
          >
            {stats.map((s) => (
              <Box
                key={s.label}
                sx={{
                  minWidth: 108,
                  px: 1.75,
                  py: 1.25,
                  borderRadius: 2,
                  border: "1px solid",
                  borderColor: "divider",
                  bgcolor: "rgba(255,255,255,0.85)",
                }}
              >
                <Typography variant="h5" sx={{ fontWeight: 800, lineHeight: 1.1 }}>
                  {s.value}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {s.label}
                </Typography>
              </Box>
            ))}
          </Stack>
        </Stack>
      </Box>

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: {
            xs: "1fr",
            sm: "repeat(2, 1fr)",
            lg: "repeat(5, 1fr)",
          },
          gap: 1.5,
        }}
      >
        {LINKS.map((link) => (
          <Box
            key={link.href}
            component={NextLink}
            href={link.href}
            sx={{
              textDecoration: "none",
              color: "inherit",
              p: 2,
              borderRadius: 2.5,
              border: "1px solid",
              borderColor: "divider",
              bgcolor: "background.paper",
              display: "flex",
              flexDirection: "column",
              gap: 1,
              minHeight: 118,
              transition:
                "border-color 160ms ease, transform 160ms ease, box-shadow 160ms ease",
              "&:hover": {
                borderColor: "primary.main",
                transform: "translateY(-2px)",
                boxShadow: "0 12px 24px -14px rgba(13,148,136,0.35)",
              },
              "@media (prefers-reduced-motion: reduce)": {
                transition: "border-color 160ms ease",
                "&:hover": { transform: "none" },
              },
            }}
          >
            <Box
              sx={{
                width: 32,
                height: 32,
                borderRadius: 1.5,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                bgcolor: "rgba(20, 184, 166, 0.12)",
                color: "primary.main",
              }}
            >
              {link.icon}
            </Box>
            <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
              {link.label}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {link.description}
            </Typography>
          </Box>
        ))}
      </Box>
    </Stack>
  );
}
