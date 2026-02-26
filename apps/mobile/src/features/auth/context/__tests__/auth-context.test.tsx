import React from 'react';
import { Linking } from 'react-native';
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
  jest.spyOn(Linking, 'openURL').mockResolvedValue(undefined);
});

afterEach(() => {
  jest.restoreAllMocks();
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

  it('signUp delegates to supabase with alias metadata', async () => {
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
      signUpResult = await result.current.signUp({
        alias: 'deepwater',
        email: 'new@example.com',
        password: 'password',
        avatarUrl: 'https://example.com/avatar.jpg',
      });
    });

    expect(signUpResult?.error).toBeNull();
    expect(mockSupabase.auth.signUp).toHaveBeenCalledWith({
      email: 'new@example.com',
      password: 'password',
      options: {
        data: {
          alias: 'deepwater',
          avatarUrl: 'https://example.com/avatar.jpg',
        },
      },
    });
  });

  it('signInWithGoogle opens OAuth URL when returned by Supabase', async () => {
    mockSupabase.auth.signInWithOAuth.mockResolvedValueOnce({
      data: { provider: 'google', url: 'https://example.com/oauth' },
      error: null,
    });

    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    await act(async () => {
      await result.current.signInWithGoogle();
    });

    expect(mockSupabase.auth.signInWithOAuth).toHaveBeenCalledWith({
      provider: 'google',
      options: {
        redirectTo: undefined,
        skipBrowserRedirect: true,
      },
    });
    expect(Linking.openURL).toHaveBeenCalledWith('https://example.com/oauth');
  });

  it('resetPassword delegates to Supabase', async () => {
    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    await act(async () => {
      await result.current.resetPassword('user@example.com');
    });

    expect(mockSupabase.auth.resetPasswordForEmail).toHaveBeenCalledWith(
      'user@example.com',
      {
        redirectTo: undefined,
      },
    );
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
