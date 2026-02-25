import React from 'react';
import { renderHook, act, waitFor } from '@testing-library/react-native';
import {
  mockSupabase,
  mockUnsubscribe,
} from '@/src/__tests__/mocks/supabase-client.mock';
import { mockSession } from '@/src/__tests__/fixtures/users.fixture';

import { AuthProvider, useAuth } from '@/src/features/auth/context/auth-context';

function wrapper({ children }: { children: React.ReactNode }) {
  return <AuthProvider>{children}</AuthProvider>;
}

beforeEach(() => {
  jest.clearAllMocks();
  mockSupabase.auth.getSession.mockResolvedValue({
    data: { session: null },
    error: null,
  });
  mockSupabase.auth.onAuthStateChange.mockReturnValue({
    data: { subscription: { unsubscribe: mockUnsubscribe } },
  });
});

describe('AuthProvider + useAuth', () => {
  it('starts in loading state', async () => {
    const { result } = renderHook(() => useAuth(), { wrapper });

    expect(result.current.isLoading).toBe(true);
    expect(result.current.session).toBeNull();

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });
  });

  it('loads session from getSession', async () => {
    mockSupabase.auth.getSession.mockResolvedValueOnce({
      data: { session: mockSession },
      error: null,
    });

    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.session).toBe(mockSession);
  });

  it('updates session on auth state change', async () => {
    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // Simulate auth state change
    const callback = mockSupabase.auth.onAuthStateChange.mock.calls[0][0];
    act(() => {
      callback('SIGNED_IN', mockSession);
    });

    expect(result.current.session).toBe(mockSession);
  });

  it('unsubscribes on unmount', async () => {
    const { unmount } = renderHook(() => useAuth(), { wrapper });

    await waitFor(() => {
      expect(mockSupabase.auth.getSession).toHaveBeenCalled();
    });

    unmount();

    expect(mockUnsubscribe).toHaveBeenCalled();
  });

  it('signIn delegates to supabase and returns result', async () => {
    mockSupabase.auth.signInWithPassword.mockResolvedValueOnce({
      data: { session: mockSession, user: mockSession.user },
      error: null,
    });

    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    let signInResult: { error: Error | null } | undefined;
    await act(async () => {
      signInResult = await result.current.signIn('test@example.com', 'password');
    });

    expect(signInResult?.error).toBeNull();
    expect(mockSupabase.auth.signInWithPassword).toHaveBeenCalledWith({
      email: 'test@example.com',
      password: 'password',
    });
  });

  it('signIn returns error on failure', async () => {
    mockSupabase.auth.signInWithPassword.mockResolvedValueOnce({
      data: { session: null, user: null },
      error: { message: 'Invalid credentials', status: 401 },
    });

    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    let signInResult: { error: Error | null } | undefined;
    await act(async () => {
      signInResult = await result.current.signIn('test@example.com', 'wrong');
    });

    expect(signInResult?.error).toBeInstanceOf(Error);
    expect(signInResult?.error?.message).toBe('Invalid credentials');
  });

  it('signUp delegates to supabase', async () => {
    mockSupabase.auth.signUp.mockResolvedValueOnce({
      data: { session: mockSession, user: mockSession.user },
      error: null,
    });

    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    let signUpResult: { error: Error | null } | undefined;
    await act(async () => {
      signUpResult = await result.current.signUp('new@example.com', 'password');
    });

    expect(signUpResult?.error).toBeNull();
    expect(mockSupabase.auth.signUp).toHaveBeenCalledWith({
      email: 'new@example.com',
      password: 'password',
    });
  });

  it('signUp returns error on failure', async () => {
    mockSupabase.auth.signUp.mockResolvedValueOnce({
      data: { session: null, user: null },
      error: { message: 'Email taken', status: 422 },
    });

    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    let signUpResult: { error: Error | null } | undefined;
    await act(async () => {
      signUpResult = await result.current.signUp('taken@example.com', 'password');
    });

    expect(signUpResult?.error?.message).toBe('Email taken');
  });

  it('signOut calls supabase', async () => {
    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    await act(() => result.current.signOut());

    expect(mockSupabase.auth.signOut).toHaveBeenCalled();
  });

  it('useAuth outside provider throws', () => {
    expect(() => {
      renderHook(() => useAuth());
    }).toThrow('useAuth must be used within AuthProvider');
  });
});
