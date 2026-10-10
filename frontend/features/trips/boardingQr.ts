/** Encode/decode boarding QR payloads shared by driver + student portals. */

export type BoardingQrPayload = {
  trip_id: string;
  qr_token: string;
};

const PREFIX = "CBC1:";

export function encodeBoardingQr(payload: BoardingQrPayload): string {
  return `${PREFIX}${payload.trip_id}|${payload.qr_token}`;
}

export function decodeBoardingQr(raw: string): BoardingQrPayload | null {
  const text = raw.trim();
  if (text.startsWith(PREFIX)) {
    const rest = text.slice(PREFIX.length);
    const bar = rest.indexOf("|");
    if (bar <= 0) return null;
    const trip_id = rest.slice(0, bar).trim();
    const qr_token = rest.slice(bar + 1).trim();
    if (!trip_id || qr_token.length < 8) return null;
    return { trip_id, qr_token };
  }
  try {
    const obj = JSON.parse(text) as Partial<BoardingQrPayload>;
    if (obj.trip_id && obj.qr_token && String(obj.qr_token).length >= 8) {
      return { trip_id: String(obj.trip_id), qr_token: String(obj.qr_token) };
    }
  } catch {
    /* not JSON */
  }
  return null;
}

/** Public QR image URL (no extra npm dep; fine for local demo). */
export function boardingQrImageUrl(payload: BoardingQrPayload, size = 220): string {
  const data = encodeURIComponent(encodeBoardingQr(payload));
  return `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${data}`;
}
