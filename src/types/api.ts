/**
 * API Response Types and Interfaces
 * Standardized response formats for the F1 API
 */

// ============================================
// PAGINATION
// ============================================

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface PaginationParams {
  page?: number;
  limit?: number;
}

// ============================================
// API RESPONSES
// ============================================

export interface SuccessResponse<T> {
  status: 'success';
  data: T;
  meta?: PaginationMeta;
}

export interface ErrorResponse {
  status: 'error';
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
}

// ============================================
// DRIVER TYPES
// ============================================

export interface DriverDTO {
  id: number;
  driverRef: string;
  number: number | null;
  code: string | null;
  forename: string;
  surname: string;
  fullName: string; // Computed: forename + surname
  dob: string; // ISO date string
  nationality: string;
  url: string;
}

export interface DriverListResponse {
  drivers: DriverDTO[];
}

export interface DriverDetailResponse {
  driver: DriverDTO;
}

// ============================================
// QUERY PARAMETERS
// ============================================

export interface DriverQueryParams extends PaginationParams {
  nationality?: string;
  search?: string; // Search by name or code
}

// ============================================
// TEAM TYPES (for future use)
// ============================================

export interface TeamDTO {
  id: number;
  teamRef: string;
  name: string;
  nationality: string;
  url: string;
}

// ============================================
// CIRCUIT TYPES (for future use)
// ============================================

export interface CircuitDTO {
  id: number;
  circuitRef: string;
  name: string;
  location: string;
  country: string;
  lat: number | null;
  lng: number | null;
  alt: number | null;
  url: string;
}

// ============================================
// SEASON TYPES (for future use)
// ============================================

export interface SeasonDTO {
  id: number;
  year: number;
  url: string;
}
