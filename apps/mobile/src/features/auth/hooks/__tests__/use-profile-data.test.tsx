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
  it('loads profile, stats, and activity lists', async () => {
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
      })
      .mockResolvedValueOnce({
        diveReports: [
          {
            id: 'log-1',
            spotId: 'spot-1',
            spotName: 'Oslofjord Wall',
            date: '2026-02-01T10:00:00.000Z',
            visibilityMeters: 10,
            currentStrength: 2,
            notesPreview: 'Clear and calm',
          },
        ],
        createdSpots: [
          {
            id: 'spot-1',
            name: 'Oslofjord Wall',
            createdAt: '2025-12-02T08:00:00.000Z',
            reportCount: 2,
          },
        ],
        favorites: [
          {
            id: 'spot-2',
            spotId: 'spot-2',
            spotName: 'Nesodden Drop',
            latestVisibilityMeters: 9,
            latestReportDate: '2026-01-30T09:00:00.000Z',
          },
        ],
      });

    const { result } = renderHook(() => useProfileData());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(mockApiFetch).toHaveBeenNthCalledWith(1, '/users/me');
    expect(mockApiFetch).toHaveBeenNthCalledWith(2, '/users/me/stats');
    expect(mockApiFetch).toHaveBeenNthCalledWith(3, '/users/me/activity');
    expect(result.current.profile?.id).toBe('user-1');
    expect(result.current.stats?.totalReports).toBe(5);
    expect(result.current.diveReports).toHaveLength(1);
    expect(result.current.createdSpots).toHaveLength(1);
    expect(result.current.favorites).toHaveLength(1);
  });

  it('falls back when stats or activity endpoints are unavailable', async () => {
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
      .mockRejectedValueOnce(new Error('Cannot GET /users/me/stats'))
      .mockRejectedValueOnce(new Error('Cannot GET /users/me/activity'));

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
    expect(result.current.diveReports).toEqual([]);
    expect(result.current.createdSpots).toEqual([]);
    expect(result.current.favorites).toEqual([]);
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
    expect(result.current.diveReports).toEqual([]);
    expect(result.current.createdSpots).toEqual([]);
    expect(result.current.favorites).toEqual([]);
    expect(mockApiFetch).toHaveBeenCalledTimes(1);
  });
});
