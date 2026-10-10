/** Shared API types — keep aligned with docs/api/API_CONTRACT.md */

export type ApiErrorBody = {
  error: {
    code: string;
    message: string;
  };
};

export type HealthResponse = {
  status: string;
};

export type ReadyResponse = {
  status: string;
  database: boolean;
};

export type Membership = {
  college_id: string;
  role: "college_admin" | "student" | "driver" | string;
};

export type MeResponse = {
  id: string;
  email: string;
  full_name: string | null;
  is_platform_operator: boolean;
  memberships: Membership[];
};

export type OtpRequestResponse = {
  status: string;
  expires_in_seconds: number;
};

export type CollegeApplication = {
  id: string;
  college_name: string;
  slug: string;
  applicant_email: string;
  applicant_full_name: string | null;
  status: string;
  reviewed_at: string | null;
  review_notes: string | null;
  created_at: string;
};

export type College = {
  id: string;
  name: string;
  slug: string;
  status: string;
  created_at: string;
};

export type Campus = {
  id: string;
  college_id: string;
  name: string;
  code: string;
  created_at: string;
  settings: CampusSettings | null;
};

export type CampusSettings = {
  max_walk_to_stop_m: number;
  cluster_eps_m: number;
  cluster_min_samples: number;
  min_students_per_route: number;
};

export type Bus = {
  id: string;
  college_id: string;
  campus_id: string;
  registration_number: string;
  capacity: number;
  status: string;
  driver_user_id: string | null;
  created_at: string;
};

export type ImportBatch = {
  id: string;
  college_id: string;
  campus_id: string;
  filename: string;
  status: string;
  row_count: number;
  valid_count: number;
  error_count: number;
  created_at: string;
};

export type Student = {
  id: string;
  college_id: string;
  campus_id: string;
  srn: string;
  email: string;
  full_name: string;
  home_lat: number;
  home_lng: number;
  status: string;
  import_batch_id: string | null;
  created_at: string;
};

export type Allocation = {
  id: string;
  student_id: string;
  stop_id: string;
  route_id: string;
  bus_id: string;
  planning_run_id: string;
};

export type Trip = {
  id: string;
  college_id: string;
  campus_id: string;
  route_id: string;
  bus_id: string;
  driver_user_id: string;
  status: string;
  started_at: string | null;
  ended_at: string | null;
  last_lat: number | null;
  last_lng: number | null;
  last_location_at: string | null;
};
