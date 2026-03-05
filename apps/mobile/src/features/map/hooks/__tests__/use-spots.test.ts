import { act, renderHook, waitFor } from '@testing-library/react-native';
import type { SpotSummary } from '@/src/features/map/types';

const mockApiFetch = jest.fn();
jest.mock('@/src/infrastructure/api/client', () => ({
  apiFetch: (...args: unknown[]) => mockApiFetch(...args),
}));

// eslint-disable-next-line import/first
import {
  resetSpotSummariesCacheForTests,
  useSpots,
} from '@/src/features/map/hooks/use-spots';

const mockSpots: SpotSummary[] = [
  { id: 'spot-1', title: 'A Spot', centerLat: 59.9, centerLon: 10.7 },
  { id: 'spot-2', title: 'B Spot', centerLat: 60.1, centerLon: 11.1 },
];

describe('useSpots', () => {
  let consoleWarnSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();
    resetSpotSummariesCacheForTests();
    consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation(() => undefined);
  });

  afterEach(() => {
    consoleWarnSpy.mockRestore();
    resetSpotSummariesCacheForTests();
  });

  it('fetches summaries once and caches them for the session', async () => {
    mockApiFetch.mockResolvedValue(mockSpots);

    const { result, unmount } = renderHook(() => useSpots());

    expect(result.current.isLoading).toBe(true);

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.spots).toEqual(mockSpots);
    expect(mockApiFetch).toHaveBeenCalledTimes(1);
    expect(mockApiFetch).toHaveBeenCalledWith('/spots/summaries');

    unmount();

    const { result: secondResult } = renderHook(() => useSpots());

    expect(secondResult.current.spots).toEqual(mockSpots);
    expect(secondResult.current.isLoading).toBe(false);
    expect(mockApiFetch).toHaveBeenCalledTimes(1);
  });

  it('refreshes summaries on demand', async () => {
    const refreshedSpots: SpotSummary[] = [
      { id: 'spot-3', title: 'Fresh Spot', centerLat: 61, centerLon: 12 },
    ];
    mockApiFetch.mockResolvedValueOnce(mockSpots).mockResolvedValueOnce(refreshedSpots);

    const { result } = renderHook(() => useSpots());

    await waitFor(() => {
      expect(result.current.spots).toEqual(mockSpots);
    });

    act(() => {
      result.current.refresh();
    });

    await waitFor(() => {
      expect(result.current.spots).toEqual(refreshedSpots);
    });

    expect(mockApiFetch).toHaveBeenCalledTimes(2);
  });

  it('surfaces an error and retries after a failed fetch', async () => {
    mockApiFetch.mockRejectedValueOnce(new Error('Network error'));

    const { result } = renderHook(() => useSpots());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.error).toBe('Failed to load spots');
    expect(result.current.spots).toEqual([]);
    expect(consoleWarnSpy).toHaveBeenCalledWith(
      'Failed to fetch spots:',
      expect.any(Error),
    );

    mockApiFetch.mockResolvedValueOnce(mockSpots);

    act(() => {
      result.current.refresh();
    });

    await waitFor(() => {
      expect(result.current.error).toBeNull();
      expect(result.current.spots).toEqual(mockSpots);
    });
  });

  it('updates the cached summaries in memory after local mutations', async () => {
    mockApiFetch.mockResolvedValueOnce(mockSpots);

    const { result } = renderHook(() => useSpots());

    await waitFor(() => {
      expect(result.current.spots).toEqual(mockSpots);
    });

    act(() => {
      result.current.upsertSpotSummary({
        id: 'spot-2',
        title: 'Updated Spot',
        centerLat: 60.1,
        centerLon: 11.1,
      });
    });

    expect(result.current.spots).toEqual([
      mockSpots[0],
      {
        id: 'spot-2',
        title: 'Updated Spot',
        centerLat: 60.1,
        centerLon: 11.1,
      },
    ]);

    act(() => {
      result.current.upsertSpotSummary({
        id: 'spot-3',
        title: 'New Spot',
        centerLat: 61,
        centerLon: 12,
      });
      result.current.removeSpotSummary('spot-1');
    });

    expect(result.current.spots).toEqual([
      {
        id: 'spot-2',
        title: 'Updated Spot',
        centerLat: 60.1,
        centerLon: 11.1,
      },
      {
        id: 'spot-3',
        title: 'New Spot',
        centerLat: 61,
        centerLon: 12,
      },
    ]);
  });
});
