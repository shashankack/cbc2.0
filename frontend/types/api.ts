/** Shared API types — keep aligned with docs/api/API_CONTRACT.md */

export type ApiError = {
  error: {
    code: string;
    message: string;
  };
};

export type HealthResponse = {
  status: string;
};
