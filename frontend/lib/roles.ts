import type { MeResponse } from "@/types/api";

export function hasRole(user: MeResponse, role: string): boolean {
  return user.memberships.some((m) => m.role === role);
}
