"use client";

import { useEffect, useRef, useState } from "react";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";

type QrCameraScannerProps = {
  onScan: (raw: string) => void;
  active?: boolean;
};

type BarcodeDetectorLike = {
  detect: (source: ImageBitmapSource) => Promise<Array<{ rawValue?: string }>>;
};

/**
 * Uses the BarcodeDetector API when available (Chromium). Falls back to a
 * clear message so paste still works on unsupported browsers.
 */
export default function QrCameraScanner({
  onScan,
  active = true,
}: QrCameraScannerProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [supported, setSupported] = useState<boolean | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [running, setRunning] = useState(false);
  const lastRef = useRef("");

  useEffect(() => {
    const BD = (
      window as unknown as { BarcodeDetector?: new (opts: { formats: string[] }) => BarcodeDetectorLike }
    ).BarcodeDetector;
    setSupported(Boolean(BD));
  }, []);

  useEffect(() => {
    if (!active || !supported || !running) return;
    const BD = (
      window as unknown as { BarcodeDetector?: new (opts: { formats: string[] }) => BarcodeDetectorLike }
    ).BarcodeDetector;
    if (!BD) return;

    let stream: MediaStream | null = null;
    let cancelled = false;
    let raf = 0;
    const detector = new BD({ formats: ["qr_code"] });

    async function start() {
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "environment" },
          audio: false,
        });
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        const video = videoRef.current;
        if (!video) return;
        video.srcObject = stream;
        await video.play();
        setError(null);

        const tick = async () => {
          if (cancelled || !videoRef.current) return;
          try {
            const codes = await detector.detect(videoRef.current);
            const raw = codes[0]?.rawValue?.trim();
            if (raw && raw !== lastRef.current) {
              lastRef.current = raw;
              onScan(raw);
            }
          } catch {
            /* frame skip */
          }
          raf = window.requestAnimationFrame(() => void tick());
        };
        raf = window.requestAnimationFrame(() => void tick());
      } catch {
        setError("Camera permission denied or unavailable.");
        setRunning(false);
      }
    }

    void start();
    return () => {
      cancelled = true;
      window.cancelAnimationFrame(raf);
      stream?.getTracks().forEach((t) => t.stop());
    };
  }, [active, supported, running, onScan]);

  if (supported === false) {
    return (
      <Alert severity="info">
        This browser can’t scan QR codes with the camera. Use Chrome or Edge, or
        paste the boarding code from the driver’s screen below.
      </Alert>
    );
  }

  return (
    <Stack spacing={1.5}>
      <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
        <Typography variant="subtitle2">Camera scan</Typography>
        <Button
          size="small"
          variant={running ? "outlined" : "contained"}
          onClick={() => setRunning((v) => !v)}
        >
          {running ? "Stop camera" : "Start camera"}
        </Button>
      </Stack>
      {error ? <Alert severity="warning">{error}</Alert> : null}
      <Box
        sx={{
          position: "relative",
          minHeight: 220,
          borderRadius: 1,
          overflow: "hidden",
          bgcolor: "grey.900",
        }}
      >
        <Box
          component="video"
          ref={videoRef}
          muted
          playsInline
          sx={{ width: "100%", height: 220, objectFit: "cover" }}
        />
        {!running ? (
          <Typography
            variant="body2"
            sx={{
              position: "absolute",
              inset: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "grey.400",
              px: 2,
              textAlign: "center",
            }}
          >
            Start the camera and point it at the driver’s boarding QR.
          </Typography>
        ) : null}
      </Box>
    </Stack>
  );
}
