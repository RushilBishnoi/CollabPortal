export interface ApiSuccessResponse<T> {
  success: true;
  data: T;
  message: string;
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
    totalPages?: number;
    [key: string]: unknown;
  };
  timestamp?: string;
}

export interface ApiErrorDetail {
  field?: string;
  message: string;
  code?: string;
}

export interface ApiErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: ApiErrorDetail[];
  };
  timestamp: string;
  path?: string;
}

export type ApiResponse<T> = ApiSuccessResponse<T> | ApiErrorResponse;

export interface SystemHealthData {
  status: 'ok' | 'degraded';
  timestamp: string;
  uptime: number;
  environment: string;
  version: string;
  services: {
    database: {
      status: 'connected' | 'disconnected';
    };
  };
}

export type UserRole =
  | 'STUDENT'
  | 'FACULTY'
  | 'INDUSTRY'
  | 'INSTITUTION_ADMIN'
  | 'SUPER_ADMIN';

export interface UserProfile {
  id: string;
  email: string;
  role: UserRole;
  avatarUrl?: string;
}
