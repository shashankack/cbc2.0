import type { ApiErrorBody } from "@/types/api";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000/api/v1";

const DEFAULT_TIMEOUT_MS = 12_000;

export function getApiBaseUrl(): string {
  return API_BASE_URL;
}

export class ApiError extends Error {
  code: string;
  status: number;

  constructor(status: number, code: string, message: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
  }
}

async function parseError(response: Response): Promise<ApiError> {
  try {
    const body = (await response.json()) as ApiErrorBody;
    return new ApiError(
      response.status,
      body.error?.code ?? "UNKNOWN",
      body.error?.message ?? `Request failed (${response.status})`,
    );
  } catch {
    return new ApiError(
      response.status,
      "UNKNOWN",
      `Request failed (${response.status})`,
    );
  }
}

type RequestOptions = {
  method?: string;
  body?: unknown;
  formData?: FormData;
  timeoutMs?: number;
};

export async function apiRequest<T>(
  path: string,
  options: RequestOptions = {},
): Promise<T> {
  const headers: HeadersInit = {
    Accept: "application/json",
  };
  let body: BodyInit | undefined;
  if (options.formData) {
    body = options.formData;
  } else if (options.body !== undefined) {
    headers["Content-Type"] = "application/json";
    body = JSON.stringify(options.body);
  }

  const controller = new AbortController();
  const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const timeout =
    typeof window !== "undefined"
      ? window.setTimeout(() => controller.abort(), timeoutMs)
      : setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(`${API_BASE_URL}${path}`, {
      method: options.method ?? "GET",
      headers,
      body,
      credentials: "include",
      cache: "no-store",
      signal: controller.signal,
    });

    if (!response.ok) {
      throw await parseError(response);
    }

    if (response.status === 204) {
      return undefined as T;
    }

    return response.json() as Promise<T>;
  } catch (err) {
    if (err instanceof Error && err.name === "AbortError") {
      throw new ApiError(0, "TIMEOUT", "Request timed out. Is the API running?");
    }
    throw err;
  } finally {
    clearTimeout(timeout);
  }
}

export async function apiGet<T>(path: string): Promise<T> {
  return apiRequest<T>(path);
}

export async function apiPost<T>(path: string, body?: unknown): Promise<T> {
  return apiRequest<T>(path, { method: "POST", body: body ?? {} });
}

export async function apiPut<T>(path: string, body: unknown): Promise<T> {
  return apiRequest<T>(path, { method: "PUT", body });
}

export async function apiPatch<T>(path: string, body: unknown): Promise<T> {
  return apiRequest<T>(path, { method: "PATCH", body });
}
