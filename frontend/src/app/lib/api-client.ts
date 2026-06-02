import { APIError, ErrorResponse } from './types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

export interface FetchOptions extends RequestInit {
  skipErrorHandling?: boolean;
}

function isErrorResponse(obj: unknown): obj is ErrorResponse {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    'error' in obj &&
    typeof (obj as Record<string, unknown>).error === 'string'
  );
}

function getAuthToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('token');
}

async function handleResponse<T>(response: Response): Promise<T | null> {
  if (response.ok) {
    if (response.status === 204) return null;

    const contentType = response.headers.get('content-type');

    if (contentType?.includes('application/json')) {
      return (await response.json()) as T;
    }

    return (await response.text()) as unknown as T;
  }

  let errorData: unknown = null;

  try {
    const contentType = response.headers.get('content-type');

    if (contentType?.includes('application/json')) {
      errorData = await response.json();
    }
  } catch {
    // ignore parse errors
  }

  const message = isErrorResponse(errorData)
    ? errorData.error
    : `HTTP ${response.status}: ${response.statusText}`;

  throw new APIError(
    response.status,
    message ?? 'Unknown error',
    isErrorResponse(errorData) ? errorData : undefined
  );
}

export async function apiCall<T>(
  endpoint: string,
  options: FetchOptions = {}
): Promise<T | null> {
  const { headers: customHeaders = {}, skipErrorHandling, ...rest } = options;

  const token = getAuthToken();

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...customHeaders,
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };

  const url = `${API_BASE_URL}${endpoint}`;

  try {
    const response = await fetch(url, {
      ...rest,
      headers,
    });

    return await handleResponse<T>(response);
  } catch (error) {
    if (skipErrorHandling) throw error;

    if (error instanceof APIError) throw error;

    throw new APIError(500, 'Network error', undefined);
  }
}

export const api = {
  get: <T>(endpoint: string, options?: FetchOptions) =>
    apiCall<T>(endpoint, { ...options, method: 'GET' }),

  post: <T>(endpoint: string, body?: unknown, options?: FetchOptions) =>
    apiCall<T>(endpoint, {
      ...options,
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined,
    }),

  patch: <T>(endpoint: string, body?: unknown, options?: FetchOptions) =>
    apiCall<T>(endpoint, {
      ...options,
      method: 'PATCH',
      body: body ? JSON.stringify(body) : undefined,
    }),

  delete: <T>(endpoint: string, options?: FetchOptions) =>
    apiCall<T>(endpoint, { ...options, method: 'DELETE' }),
};
