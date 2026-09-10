import { ApiSuccessResponse, ApiErrorResponse } from '../types/api';

export class ApiError extends Error {
  public readonly code: string;
  public readonly details?: { field?: string; message: string; code?: string }[];
  public readonly status: number;

  constructor(status: number, errorData: ApiErrorResponse['error']) {
    super(errorData.message || 'An unexpected API error occurred');
    this.name = 'ApiError';
    this.code = errorData.code || 'UNKNOWN_ERROR';
    this.details = errorData.details;
    this.status = status;
  }
}

class ApiClient {
  private baseUrl = (import.meta as any).env?.VITE_API_BASE_URL || '/api/v1';

  private getAuthToken(): string | null {
    try {
      return localStorage.getItem('access_token');
    } catch {
      return null;
    }
  }

  async request<T>(
    endpoint: string,
    options: RequestInit = {},
  ): Promise<T> {
    const token = this.getAuthToken();
    const headers = new Headers(options.headers || {});

    if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
      headers.set('Content-Type', 'application/json');
    }

    if (token && !headers.has('Authorization')) {
      headers.set('Authorization', `Bearer ${token}`);
    }

    const url = `${this.baseUrl}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;

    const response = await fetch(url, {
      ...options,
      headers,
    });

    const data = await response.json().catch(() => null);

    if (!response.ok) {
      if (response.status === 429) {
        const retryAfter = response.headers.get('Retry-After');
        const defaultMsg = retryAfter
          ? `Rate limit exceeded. Please wait ${retryAfter} seconds before trying again.`
          : 'Too many requests. Please slow down and try again shortly.';

        throw new ApiError(429, {
          code: 'RATE_LIMIT_EXCEEDED',
          message: (data && data.error && data.error.message) || defaultMsg,
        });
      }

      if (data && 'error' in data) {
        throw new ApiError(response.status, data.error);
      }
      throw new ApiError(response.status, {
        code: `HTTP_${response.status}`,
        message: response.statusText || 'Request failed',
      });
    }

    // Unbox standard success envelope { success: true, data: T, ... }
    if (data && typeof data === 'object' && 'success' in data && 'data' in data) {
      return (data as ApiSuccessResponse<T>).data;
    }

    return data as T;
  }

  get<T>(endpoint: string, options?: RequestInit): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: 'GET' });
  }

  post<T>(endpoint: string, body?: unknown, options?: RequestInit): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  patch<T>(endpoint: string, body?: unknown, options?: RequestInit): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'PATCH',
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  put<T>(endpoint: string, body?: unknown, options?: RequestInit): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'PUT',
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  delete<T>(endpoint: string, options?: RequestInit): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: 'DELETE' });
  }
}

export const apiClient = new ApiClient();
