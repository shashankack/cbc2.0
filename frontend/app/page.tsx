"use client";

import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import DirectionsBusIcon from "@mui/icons-material/DirectionsBus";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import Container from "@mui/material/Container";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import HeroRouteArt from "@/features/landing/HeroRouteArt";

const ROLES = ["Student", "Driver", "Admin", "Operator"] as const;

export default function Home() {
  return (
    <Box
      component="main"
      sx={{
        minHeight: "100vh",
        width: "100%",
        bgcolor: "background.default",
        color: "text.primary",
        display: "flex",
        flexDirection: "column",
        position: "relative",
        overflow: "hidden",
      }}
    >
      <Box
        component="svg"
        xmlns="http://www.w3.org/2000/svg"
        preserveAspectRatio="none"
        aria-hidden
        sx={{
          pointerEvents: "none",
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          opacity: 0.05,
        }}
      >
        <defs>
          <pattern
            id="cbc-iso-grid"
            width="160"
            height="92.376"
            patternUnits="userSpaceOnUse"
          >
            <path
              d="M 80 0 L 160 46.188 L 80 92.376 L 0 46.188 Z"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
            />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#cbc-iso-grid)" />
      </Box>

      <Box
        aria-hidden
        sx={{
          pointerEvents: "none",
          position: "absolute",
          top: "42%",
          right: { xs: "-10%", lg: "6%" },
          transform: "translateY(-50%)",
          width: { xs: 320, md: 520 },
          height: { xs: 320, md: 520 },
          borderRadius: "50%",
          bgcolor: "rgba(13, 148, 136, 0.1)",
          filter: "blur(110px)",
        }}
      />
      <Box
        aria-hidden
        sx={{
          pointerEvents: "none",
          position: "absolute",
          bottom: "-8%",
          left: "8%",
          width: 360,
          height: 360,
          borderRadius: "50%",
          bgcolor: "rgba(245, 158, 11, 0.08)",
          filter: "blur(100px)",
        }}
      />

      <Container
        maxWidth="xl"
        component="header"
        sx={{
          position: "relative",
          zIndex: 2,
          pt: 3,
          pb: 1,
          px: { xs: 2.5, sm: 4, lg: 8 },
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 2,
        }}
      >
        <Stack direction="row" spacing={1.5} sx={{ alignItems: "center" }}>
          <Box
            sx={{
              width: 40,
              height: 40,
              borderRadius: 2.5,
              bgcolor: "rgba(20, 184, 166, 0.14)",
              border: "1px solid rgba(20, 184, 166, 0.32)",
              color: "primary.light",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <DirectionsBusIcon fontSize="small" />
          </Box>
          <Typography
            variant="h6"
            sx={{ fontWeight: 750, letterSpacing: "-0.02em" }}
          >
            Uni
            <Box component="span" sx={{ color: "primary.main" }}>
              Transit
            </Box>
          </Typography>
        </Stack>

        <Button href="/login" variant="contained" color="primary">
          Sign in
        </Button>
      </Container>

      <Container
        maxWidth="xl"
        sx={{
          position: "relative",
          zIndex: 2,
          flex: 1,
          px: { xs: 2.5, sm: 4, lg: 8 },
          py: { xs: 4, md: 6 },
          display: "grid",
          gridTemplateColumns: { xs: "1fr", lg: "repeat(12, 1fr)" },
          alignItems: "center",
          gap: { xs: 5, lg: 4 },
        }}
      >
        <Box sx={{ gridColumn: { lg: "span 6" } }}>
          <Stack spacing={3} sx={{ alignItems: "flex-start", maxWidth: 560 }}>
            <Chip
              label="College buses · seat planning · QR check-in"
              sx={{
                bgcolor: "rgba(255,255,255,0.9)",
                border: "1px solid",
                borderColor: "divider",
                fontWeight: 500,
                height: 32,
              }}
            />

            <Typography
              variant="h1"
              sx={{
                fontSize: { xs: "2.35rem", sm: "3.25rem", xl: "3.75rem" },
              }}
            >
              Campus transit that{" "}
              <Box component="span" sx={{ color: "primary.main" }}>
                actually plans
              </Box>
            </Typography>

            <Typography
              variant="body1"
              color="text.secondary"
              sx={{ fontSize: { sm: "1.1rem" }, lineHeight: 1.7 }}
            >
              Upload where students live, group nearby homes into pickup stops,
              fill buses by seat count, lock the plan, then check in with the
              driver’s QR — and follow the bus live on the map.
            </Typography>

            <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5}>
              <Button
                href="/login"
                variant="contained"
                size="large"
                endIcon={<ArrowForwardIcon />}
              >
                Get started
              </Button>
              <Button href="/app" variant="outlined" size="large">
                Open portal
              </Button>
            </Stack>
          </Stack>
        </Box>

        <Box
          sx={{
            gridColumn: { lg: "span 6" },
            display: "flex",
            justifyContent: "center",
            "@keyframes utFadeUp": {
              from: { opacity: 0, transform: "translateY(12px)" },
              to: { opacity: 1, transform: "none" },
            },
            animation: "utFadeUp 500ms ease",
            "@media (prefers-reduced-motion: reduce)": {
              animation: "none",
            },
          }}
        >
          <HeroRouteArt />
        </Box>
      </Container>

      <Container
        maxWidth="xl"
        component="footer"
        sx={{
          position: "relative",
          zIndex: 2,
          py: 2.5,
          px: { xs: 2.5, sm: 4, lg: 8 },
          display: "flex",
          justifyContent: "space-between",
          gap: 2,
          flexWrap: "wrap",
        }}
      >
        <Typography variant="caption" color="text.secondary">
          UniTransit · College bus routes & seats
        </Typography>
        <Typography variant="caption" color="text.secondary">
          Spreadsheet planning · QR check-in · many colleges
        </Typography>
      </Container>
    </Box>
  );
}
