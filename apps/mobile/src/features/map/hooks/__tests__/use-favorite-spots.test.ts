import { act, renderHook, waitFor } from '@testing-library/react-native';
import { apiFetch } from '@/src/infrastructure/api/client';
import {
  mockSupabase,
  mockUnsubscribe,
} from '@/src/__tests__/mocks/supabase-client.mock';
import { mockSession } from '@/src/__tests__/fixtures/users.fixture';
import { useFavoriteSpots } from '@/src/features/map/hooks/use-favorite-spots';

jest.mock('@/src/infrastructure/api/client', () => ({
  apiFetch: jest.fn(),
}));

const mockApiFetch = apiFetch as jest.MockedFunction<typeof apiFetch>;

beforeEach(() => {
  jest.clearAllMocks();
  mockSupabase.auth.getSession.mockResolvedValue({
    data: { session: null },
    error: null,
  });
  mockSupabase.auth.onAuthStateChange.mockReturnValue({
    data: { subscription: { unsubscribe: mockUnsubscribe } },
  });
  mockApiFetch.mockResolvedValue({ favoriteSpotIds: [] } as never);
});

describe('useFavoriteSpots', () => {
  it('loads favorite spot ids from /users/me when session exists', async () => {
    mockSupabase.auth.getSession.mockResolvedValueOnce({
      data: { session: mockSession },
      error: null,
    });
    mockApiFetch.mockResolvedValueOnce({ favoriteSpotIds: ['spot-1'] } as never);

    const { result } = renderHook(() => useFavoriteSpots());

    await waitFor(() => {
      expect(result.current.favoriteSpotIds).toEqual(['spot-1']);
    });
    expect(result.current.isAuthenticated).toBe(true);
    expect(mockApiFetch).toHaveBeenCalledWith('/users/me');
  });

  it('clears favorites and auth state when session signs out', async () => {
    mockSupabase.auth.getSession.mockResolvedValueOnce({
      data: { session: mockSession },
      error: null,
    });
    mockApiFetch.mockResolvedValueOnce({ favoriteSpotIds: ['spot-1'] } as never);

    const { result } = renderHook(() => useFavoriteSpots());

    await waitFor(() => {
      expect(result.current.favoriteSpotIds).toEqual(['spot-1']);
    });

    const callback = mockSupabase.auth.onAuthStateChange.mock.calls[0]?.[0];
    act(() => {
      callback?.('SIGNED_OUT', null);
    });

    await waitFor(() => {
      expect(result.current.favoriteSpotIds).toEqual([]);
      expect(result.current.isAuthenticated).toBe(false);
    });
  });

  it('optimistically favorites and persists on success', async () => {
    mockSupabase.auth.getSession.mockResolvedValueOnce({
      data: { session: mockSession },
      error: null,
    });
    mockApiFetch
      .mockResolvedValueOnce({ favoriteSpotIds: [] } as never)
      .mockResolvedValueOnce({ favoriteSpotIds: ['spot-1'] } as never);

    const { result } = renderHook(() => useFavoriteSpots());

    await waitFor(() => {
      expect(result.current.isAuthenticated).toBe(true);
    });

    let toggleResult: { error: Error | null } | undefined;
    await act(async () => {
      toggleResult = await result.current.toggleFavoriteSpot('spot-1', true);
    });

    expect(toggleResult).toEqual({ error: null });
    expect(result.current.favoriteSpotIds).toEqual(['spot-1']);
    expect(mockApiFetch).toHaveBeenLastCalledWith('/users/me/favorites/spot-1', {
      method: 'POST',
    });
  });

  it('rolls back optimistic update on failure', async () => {
    mockSupabase.auth.getSession.mockResolvedValueOnce({
      data: { session: mockSession },
      error: null,
    });
    mockApiFetch
      .mockResolvedValueOnce({ favoriteSpotIds: ['spot-1'] } as never)
      .mockRejectedValueOnce(new Error('API error: 500'));

    const { result } = renderHook(() => useFavoriteSpots());

    await waitFor(() => {
      expect(result.current.favoriteSpotIds).toEqual(['spot-1']);
    });

    let toggleResult: { error: Error | null } | undefined;
    await act(async () => {
      toggleResult = await result.current.toggleFavoriteSpot('spot-1', false);
    });

    expect(toggleResult?.error).toBeInstanceOf(Error);
    expect(result.current.favoriteSpotIds).toEqual(['spot-1']);
  });

  it('returns auth error when toggling favorites without session', async () => {
    const { result } = renderHook(() => useFavoriteSpots());

    await waitFor(() => {
      expect(result.current.isAuthenticated).toBe(false);
    });

    const toggleResult = await act(() =>
      result.current.toggleFavoriteSpot('spot-1', true),
    );

    expect(toggleResult.error).toBeInstanceOf(Error);
    expect(mockApiFetch).not.toHaveBeenCalledWith('/users/me/favorites/spot-1', {
      method: 'POST',
    });
  });
});
