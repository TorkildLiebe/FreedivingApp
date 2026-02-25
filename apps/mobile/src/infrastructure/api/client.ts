import { supabase } from '@/src/infrastructure/supabase/client';

const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000';
const DEV_USER_ID = process.env.EXPO_PUBLIC_DEV_USER_ID;

interface ApiErrorResponseBody {
  error?: string;
  message?: string | string[];
  statusCode?: number;
}

export class ApiError extends Error {
  readonly status: number;
  readonly code: string | null;
  readonly details: unknown;

  constructor(status: number, message: string, code: string | null, details: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

function normalizeErrorMessage(
  payload: ApiErrorResponseBody | string | null,
  status: number,
): string {
  if (payload == null) {
    return `API error: ${status}`;
  }

  if (typeof payload === 'string') {
    const trimmed = payload.trim();
    return trimmed.length > 0 ? trimmed : `API error: ${status}`;
  }

  if (Array.isArray(payload.message)) {
    const filtered = payload.message
      .map((entry) => entry.trim())
      .filter((entry) => entry.length > 0);
    if (filtered.length > 0) {
      return filtered.join(', ');
    }
  }

  if (typeof payload.message === 'string' && payload.message.trim().length > 0) {
    return payload.message.trim();
  }

  return `API error: ${status}`;
}

export async function apiFetch<T>(
  path: string,
  options?: RequestInit,
): Promise<T> {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  const token = session?.access_token;

  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(DEV_USER_ID ? { 'x-dev-user-id': DEV_USER_ID } : {}),
      ...options?.headers,
    },
    ...options,
  });

  if (!response.ok) {
    let errorPayload: ApiErrorResponseBody | string | null = null;

    try {
      const contentType = response.headers.get('content-type') ?? '';
      if (contentType.toLowerCase().includes('application/json')) {
        errorPayload = (await response.json()) as ApiErrorResponseBody;
      } else {
        errorPayload = await response.text();
      }
    } catch {
      errorPayload = null;
    }

    const details =
      errorPayload != null && typeof errorPayload !== 'string'
        ? errorPayload
        : null;
    const code =
      details && typeof details.error === 'string' ? details.error : null;
    const message = normalizeErrorMessage(errorPayload, response.status);

    throw new ApiError(response.status, message, code, details);
  }

  return response.json() as Promise<T>;
}
