import { act, renderHook, waitFor } from '@testing-library/react-native';
import type { SpotDetail } from '@/src/features/map/types';

const mockApiFetch = jest.fn();
jest.mock('@/src/infrastructure/api/client', () => ({
  apiFetch: (...args: unknown[]) => mockApiFetch(...args),
}));

// eslint-disable-next-line import/first
import { useSpotDetail } from '@/src/features/map/hooks/use-spot-detail';

const mockSpot: SpotDetail = {
  id: 'uuid-1',
  title: 'Test Spot',
  description: 'A great dive spot',
  centerLat: 60.0,
  centerLon: 5.0,
  createdById: 'uuid-user-1',
  creatorDisplayName: 'TestUser',
  accessInfo: 'Park at the pier',
  parkingLocations: [
    { id: 'p-1', lat: 60.01, lon: 5.01, label: 'Main parking' },
  ],
  photoUrls: [],
  isFavorite: false,
  averageVisibilityMeters: null,
  averageRating: null,
  reportCount: 0,
  latestReportAt: null,
  diveLogs: [],
  shareUrl: null,
  shareableAccessInfo: null,
  createdAt: '2025-01-01T00:00:00.000Z',
  updatedAt: '2025-01-02T00:00:00.000Z',
};

describe('useSpotDetail', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns null when spotId is null', () => {
    const { result } = renderHook(() => useSpotDetail(null));

    expect(result.current.spot).toBeNull();
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('fetches and returns spot detail when spotId provided', async () => {
    mockApiFetch.mockResolvedValue(mockSpot);

    const { result } = renderHook(() => useSpotDetail('uuid-1'));

    expect(result.current.isLoading).toBe(true);

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(mockApiFetch).toHaveBeenCalledWith('/spots/uuid-1');
    expect(result.current.spot).toEqual(mockSpot);
    expect(result.current.error).toBeNull();
  });

  it('sets error on fetch failure', async () => {
    mockApiFetch.mockRejectedValue(new Error('Network error'));

    const { result } = renderHook(() => useSpotDetail('uuid-1'));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.spot).toBeNull();
    expect(result.current.error).toBe('Failed to load spot details');
  });

  it('clears spot when spotId becomes null', async () => {
    mockApiFetch.mockResolvedValue(mockSpot);

    const { result, rerender } = renderHook(
      ({ spotId }: { spotId: string | null }) => useSpotDetail(spotId),
      { initialProps: { spotId: 'uuid-1' } },
    );

    await waitFor(() => {
      expect(result.current.spot).toEqual(mockSpot);
    });

    rerender({ spotId: null });

    expect(result.current.spot).toBeNull();
    expect(result.current.error).toBeNull();
  });

  it('fetches new spot when spotId changes', async () => {
    const secondSpot = { ...mockSpot, id: 'uuid-2', title: 'Second Spot' };
    mockApiFetch.mockResolvedValueOnce(mockSpot).mockResolvedValueOnce(secondSpot);

    const { result, rerender } = renderHook(
      ({ spotId }: { spotId: string | null }) => useSpotDetail(spotId),
      { initialProps: { spotId: 'uuid-1' } },
    );

    await waitFor(() => {
      expect(result.current.spot).toEqual(mockSpot);
    });

    rerender({ spotId: 'uuid-2' });

    await waitFor(() => {
      expect(result.current.spot).toEqual(secondSpot);
    });

    expect(mockApiFetch).toHaveBeenCalledTimes(2);
    expect(mockApiFetch).toHaveBeenCalledWith('/spots/uuid-2');
  });

  it('refetches when refresh is called', async () => {
    mockApiFetch.mockResolvedValue(mockSpot);

    const { result } = renderHook(() => useSpotDetail('uuid-1'));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    await act(async () => {
      result.current.refresh();
    });

    await waitFor(() => {
      expect(mockApiFetch).toHaveBeenCalledTimes(2);
    });
  });
});
