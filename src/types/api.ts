// API Response Types

export interface ApiResponse<T> {
  status: 'success' | 'error';
  data?: T;
  error?: ApiError;
  meta?: PaginationMeta;
}

export interface ApiError {
  code: string;
  message: string;
  details?: unknown;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface PaginationParams {
  page?: number;
  limit?: number;
}

// Driver Types

export interface DriverResponse {
  id: number;
  driverRef: string;
  number: number | null;
  code: string | null;
  forename: string;
  surname: string;
  fullName: string;
  dob: string; // ISO date string
  nationality: string;
  url: string;
}

export interface DriverDetailResponse extends DriverResponse {
  stats?: {
    races: number;
    wins: number;
    podiums: number;
    poles: number;
    championships: number;
  };
}

// Query parameter types
export interface DriverQueryParams extends PaginationParams {
  nationality?: string;
  search?: string; // Search by name
}

// Team Types

export interface TeamResponse {
  id: number;
  teamRef: string;
  name: string;
  nationality: string;
  url: string;
}

// Circuit Types

export interface CircuitResponse {
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

// Season Types

export interface SeasonResponse {
  id: number;
  year: number;
  url: string;
}

// Race Types

export interface RaceResponse {
  id: number;
  season: number;
  round: number;
  name: string;
  date: string;
  time: string | null;
  circuit: CircuitResponse;
  url: string;
}
