/** Distance/time copy must stay approximate — never live traffic. */

export function formatApproxDistance(meters: number): string {
  if (!Number.isFinite(meters) || meters < 0) {
    return "Approx. distance unavailable";
  }
  if (meters >= 1000) {
    return `Approx. ${(meters / 1000).toFixed(1)} km`;
  }
  return `Approx. ${Math.round(meters)} m`;
}

export function formatApproxMinutes(minutes: number): string {
  if (!Number.isFinite(minutes) || minutes < 0) {
    return "Approx. time unavailable";
  }
  if (minutes < 1) {
    return "Approx. under 1 min";
  }
  return `Approx. ${Math.round(minutes)} min`;
}

export const APPROX_DISCLAIMER =
  "Distances and times are approximate (straight-line / schedule estimates). Not live traffic.";
