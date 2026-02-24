import { supabase } from '@/src/infrastructure/supabase/client';

const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000';
const DEV_USER_ID = process.env.EXPO_PUBLIC_DEV_USER_ID;

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
    throw new Error(`API error: ${response.status}`);
  }

  return response.json() as Promise<T>;
}
