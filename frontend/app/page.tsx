import DirectionsBusIcon from "@mui/icons-material/DirectionsBus";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Container from "@mui/material/Container";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import NextLink from "next/link";

export default function Home() {
  return (
    <Box
      component="main"
      sx={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        background:
          "linear-gradient(160deg, #E8EEF7 0%, #F5F7FA 45%, #F0E6DE 100%)",
      }}
    >
      <Container maxWidth="md">
        <Stack spacing={3}>
          <Stack direction="row" spacing={1.5} sx={{ alignItems: "center" }}>
            <DirectionsBusIcon color="primary" fontSize="large" />
            <Typography variant="h3" component="h1" sx={{ fontWeight: 700 }}>
              College Bus System
            </Typography>
          </Stack>
          <Typography
            variant="h6"
            color="text.secondary"
            sx={{ maxWidth: 560 }}
          >
            Excel planning, locked pickups, QR boarding, and live driver
            tracking — without heavy ML.
          </Typography>
          <Stack direction="row" spacing={2}>
            <Button
              component={NextLink}
              href="/login"
              variant="contained"
              size="large"
            >
              Sign in with email OTP
            </Button>
            <Button component={NextLink} href="/app" variant="outlined" size="large">
              Open portal
            </Button>
          </Stack>
        </Stack>
      </Container>
    </Box>
  );
}
