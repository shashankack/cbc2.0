"use client";

import DirectionsBusIcon from "@mui/icons-material/DirectionsBus";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Container from "@mui/material/Container";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import ColorModeToggle from "@/theme/ColorModeToggle";

export default function Home() {
  return (
    <Box
      component="main"
      sx={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        position: "relative",
        background: (theme) =>
          theme.palette.mode === "light"
            ? "linear-gradient(155deg, #E8EEF7 0%, #F4F6F9 48%, #E6F4F1 100%)"
            : "linear-gradient(155deg, #0B1220 0%, #121A29 55%, #0F2430 100%)",
      }}
    >
      <Box sx={{ position: "absolute", top: 16, right: 16 }}>
        <ColorModeToggle />
      </Box>
      <Container maxWidth="md">
        <Stack spacing={3}>
          <Stack direction="row" spacing={1.5} sx={{ alignItems: "center" }}>
            <DirectionsBusIcon color="secondary" sx={{ fontSize: 44 }} />
            <Box>
              <Typography variant="h3" component="h1" sx={{ fontWeight: 700 }}>
                UniTransit
              </Typography>
              <Typography variant="subtitle1" color="text.secondary">
                Smarter Campus Transport, Better Seat Allocation.
              </Typography>
            </Box>
          </Stack>
          <Typography
            variant="h6"
            color="text.secondary"
            sx={{ maxWidth: 560, fontWeight: 400 }}
          >
            Excel-driven planning, locked pickups, QR boarding, and live driver
            position while a trip is active.
          </Typography>
          <Stack direction="row" spacing={2}>
            <Button href="/login" variant="contained" size="large">
              Sign in with email OTP
            </Button>
            <Button href="/app" variant="outlined" size="large">
              Open portal
            </Button>
          </Stack>
        </Stack>
      </Container>
    </Box>
  );
}
