import DirectionsBusIcon from "@mui/icons-material/DirectionsBus";
import Box from "@mui/material/Box";
import Container from "@mui/material/Container";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";

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
        <Stack spacing={2}>
          <Stack direction="row" spacing={1.5} alignItems="center">
            <DirectionsBusIcon color="primary" fontSize="large" />
            <Typography variant="h3" component="h1" fontWeight={700}>
              College Bus System
            </Typography>
          </Stack>
          <Typography variant="h6" color="text.secondary" maxWidth={560}>
            Multi-college route management, seat allocation, and QR boarding —
            scaffold ready for Stage 2+.
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Portals: Student · College Admin · Platform Operator · Driver
          </Typography>
        </Stack>
      </Container>
    </Box>
  );
}
