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
  lat: number | null;
  lng: number | null;
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
  driver_email?: string | null;
  campus_code?: string | null;
  campus_name?: string | null;
};

export type Driver = {
  user_id: string;
  email: string;
  full_name: string | null;
  assigned_bus_id: string | null;
  assigned_bus_registration: string | null;
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
  campus_code?: string | null;
  campus_name?: string | null;
  active_student_count?: number;
  locked_student_count?: number;
  is_active?: boolean;
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
  stop_name?: string | null;
  stop_lat?: number | null;
  stop_lng?: number | null;
  route_name?: string | null;
  bus_registration_number?: string | null;
};

export type PlanningStop = {
  id: string;
  name: string;
  lat: number;
  lng: number;
  source: string;
};

export type PlanningRouteStop = {
  sequence: number;
  stop_id: string;
  name: string | null;
  lat: number | null;
  lng: number | null;
};

export type PlanningRoute = {
  id: string;
  name: string;
  status: string;
  route_stops: PlanningRouteStop[];
};

export type PlanningItem = {
  id: string;
  student_id: string;
  stop_id: string | null;
  route_id: string | null;
  bus_id: string | null;
  status: string;
};

export type PlanningRun = {
  id: string;
  college_id: string;
  campus_id: string;
  import_batch_id: string | null;
  status: string;
  confirmed_at: string | null;
  created_at: string;
  stops: PlanningStop[];
  routes: PlanningRoute[];
  items: PlanningItem[];
};

export type TripLocation = {
  trip_id: string;
  status: string;
  lat: number | null;
  lng: number | null;
  recorded_at: string | null;
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
  route_name?: string | null;
  bus_registration?: string | null;
  driver_email?: string | null;
  duration_seconds?: number | null;
};

export type DriverDuty = {
  bus_id: string;
  bus_registration: string;
  route_id: string;
  route_name: string;
  campus_id: string;
  trip: Trip | null;
  can_start: boolean;
  can_end: boolean;
  can_distress: boolean;
};
