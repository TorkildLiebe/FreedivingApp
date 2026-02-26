import { renderHook, waitFor } from '@testing-library/react-native';

import { useProfileData } from '@/src/features/auth/hooks/use-profile-data';
import { apiFetch } from '@/src/infrastructure/api/client';

jest.mock('@/src/infrastructure/api/client', () => ({
  apiFetch: jest.fn(),
}));

const mockApiFetch = apiFetch as jest.MockedFunction<typeof apiFetch>;

beforeEach(() => {
  jest.clearAllMocks();
});

describe('useProfileData', () => {
  it('loads profile and stats', async () => {
    mockApiFetch
      .mockResolvedValueOnce({
        id: 'user-1',
        email: 'diver@example.com',
        alias: 'Diver',
        bio: null,
        avatarUrl: null,
        role: 'user',
        preferredLanguage: 'en',
        favoriteSpotIds: [],
        createdAt: '2023-08-01T10:00:00.000Z',
      })
      .mockResolvedValueOnce({
        totalReports: 5,
        uniqueSpotsDived: 3,
        favoritesCount: 1,
        memberSince: '2023-08-01T10:00:00.000Z',
      });

    const { result } = renderHook(() => useProfileData());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(mockApiFetch).toHaveBeenNthCalledWith(1, '/users/me');
    expect(mockApiFetch).toHaveBeenNthCalledWith(2, '/users/me/stats');
    expect(result.current.profile?.id).toBe('user-1');
    expect(result.current.stats?.totalReports).toBe(5);
  });

  it('falls back to derived stats when stats endpoint is unavailable', async () => {
    mockApiFetch
      .mockResolvedValueOnce({
        id: 'user-1',
        email: 'diver@example.com',
        alias: 'Diver',
        bio: null,
        avatarUrl: null,
        role: 'user',
        preferredLanguage: 'en',
        favoriteSpotIds: ['spot-1', 'spot-2'],
        createdAt: '2023-08-01T10:00:00.000Z',
      })
      .mockRejectedValueOnce(new Error('Cannot GET /users/me/stats'));

    const { result } = renderHook(() => useProfileData());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.error).toBeNull();
    expect(result.current.profile?.id).toBe('user-1');
    expect(result.current.stats).toEqual({
      totalReports: 0,
      uniqueSpotsDived: 0,
      favoritesCount: 2,
      memberSince: '2023-08-01T10:00:00.000Z',
    });
  });

  it('exposes error message when request fails', async () => {
    mockApiFetch.mockRejectedValueOnce(new Error('Network unavailable'));

    const { result } = renderHook(() => useProfileData());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.error).toBe('Network unavailable');
    expect(result.current.profile).toBeNull();
    expect(result.current.stats).toBeNull();
    expect(mockApiFetch).toHaveBeenCalledTimes(1);
  });
});
