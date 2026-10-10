"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { apiGet, apiPost, ApiError } from "@/lib/api";
import type { MeResponse, OtpRequestResponse } from "@/types/api";

type AuthContextValue = {
  user: MeResponse | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<MeResponse | null>;
  requestOtp: (email: string) => Promise<OtpRequestResponse>;
  verifyOtp: (email: string, code: string) => Promise<MeResponse>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<MeResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      const me = await apiGet<MeResponse>("/auth/me");
      setUser(me);
      setError(null);
      return me;
    } catch (err) {
      setUser(null);
      if (err instanceof ApiError && err.status === 401) {
        setError(null);
      } else if (err instanceof Error) {
        setError(err.message);
      }
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const requestOtp = useCallback(async (email: string) => {
    return apiPost<OtpRequestResponse>("/auth/otp/request", { email });
  }, []);

  const verifyOtp = useCallback(async (email: string, code: string) => {
    const me = await apiPost<MeResponse>("/auth/otp/verify", { email, code });
    setUser(me);
    setError(null);
    return me;
  }, []);

  const logout = useCallback(async () => {
    await apiPost("/auth/logout");
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({
      user,
      loading,
      error,
      refresh,
      requestOtp,
      verifyOtp,
      logout,
    }),
    [user, loading, error, refresh, requestOtp, verifyOtp, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return ctx;
}

export function resolveHomePath(user: MeResponse): string {
  if (user.is_platform_operator) {
    return "/operator";
  }
  const roles = new Set(user.memberships.map((m) => m.role));
  if (roles.has("college_admin")) {
    return "/admin";
  }
  if (roles.has("driver")) {
    return "/driver";
  }
  if (roles.has("student")) {
    return "/student";
  }
  return "/app";
}

export function primaryCollegeId(user: MeResponse): string | null {
  return user.memberships[0]?.college_id ?? null;
}
