import { act, renderHook } from '@testing-library/react-native';
import type { SpotDetail } from '@/src/features/map/types';

const mockApiFetch = jest.fn();
jest.mock('@/src/infrastructure/api/client', () => ({
  apiFetch: (...args: unknown[]) => mockApiFetch(...args),
}));

// eslint-disable-next-line import/first
import { useCreateSpot } from '@/src/features/map/hooks/use-create-spot';

function makeSpot(overrides: Partial<SpotDetail> = {}): SpotDetail {
  return {
    id: 'spot-1',
    title: 'Created spot',
    description: '',
    centerLat: 59.9,
    centerLon: 10.7,
    createdById: 'user-1',
    creatorDisplayName: 'User',
    accessInfo: null,
    parkingLocations: [],
    photoUrls: [],
    isFavorite: false,
    averageVisibilityMeters: null,
    averageRating: null,
    reportCount: 0,
    latestReportAt: null,
    diveLogs: [],
    shareUrl: null,
    shareableAccessInfo: null,
    createdAt: '2026-02-24T00:00:00.000Z',
    updatedAt: '2026-02-24T00:00:00.000Z',
    ...overrides,
  };
}

describe('useCreateSpot', () => {
  const mockFetch = jest.fn();
  const originalFetch = global.fetch;

  beforeEach(() => {
    jest.clearAllMocks();
    global.fetch = mockFetch as typeof global.fetch;
  });

  afterAll(() => {
    global.fetch = originalFetch;
  });

  it('fails validation when title is empty', async () => {
    const { result } = renderHook(() => useCreateSpot());

    let thrownMessage: string | null = null;
    await act(async () => {
      try {
        await result.current.createSpot({
          title: '   ',
          centerLat: 59.9,
          centerLon: 10.7,
        });
      } catch (error) {
        thrownMessage =
          error instanceof Error ? error.message : 'Unknown error';
      }
    });

    expect(thrownMessage).toBe('Spot name is required.');
    expect(result.current.error).toBe('Spot name is required.');
    expect(mockApiFetch).not.toHaveBeenCalled();
  });

  it('creates spot without photos', async () => {
    mockApiFetch.mockResolvedValueOnce(makeSpot());

    const { result } = renderHook(() => useCreateSpot());
    let created: SpotDetail | undefined;

    await act(async () => {
      created = await result.current.createSpot({
        title: '  New Spot  ',
        description: 'desc',
        accessInfo: 'access',
        centerLat: 59.9,
        centerLon: 10.7,
      });
    });

    expect(mockApiFetch).toHaveBeenCalledTimes(1);
    expect(mockApiFetch).toHaveBeenCalledWith(
      '/spots',
      expect.objectContaining({
        method: 'POST',
      }),
    );
    expect(created?.id).toBe('spot-1');
    expect(result.current.error).toBeNull();
    expect(result.current.isSubmitting).toBe(false);
  });

  it('creates spot and uploads attached photos', async () => {
    mockApiFetch
      .mockResolvedValueOnce(makeSpot())
      .mockResolvedValueOnce({
        uploadUrl: 'https://upload.example.com/1',
        publicUrl: 'https://public.example.com/1.jpg',
      })
      .mockResolvedValueOnce(makeSpot({ photoUrls: ['https://public.example.com/1.jpg'] }))
      .mockResolvedValueOnce({
        uploadUrl: 'https://upload.example.com/2',
        publicUrl: 'https://public.example.com/2.jpg',
      })
      .mockResolvedValueOnce(
        makeSpot({
          photoUrls: [
            'https://public.example.com/1.jpg',
            'https://public.example.com/2.jpg',
          ],
        }),
      );

    const blob = {} as Blob;
    mockFetch
      .mockResolvedValueOnce({ blob: async () => blob } as Response)
      .mockResolvedValueOnce({ ok: true } as Response)
      .mockResolvedValueOnce({ blob: async () => blob } as Response)
      .mockResolvedValueOnce({ ok: true } as Response);

    const { result } = renderHook(() => useCreateSpot());

    await act(async () => {
      const created = await result.current.createSpot({
        title: 'New Spot',
        centerLat: 59.9,
        centerLon: 10.7,
        photos: [
          { uri: 'file:///tmp/a.jpg', mimeType: 'image/jpeg' },
          { uri: 'file:///tmp/b.jpg', mimeType: 'image/jpeg' },
        ],
      });

      expect(created.photoUrls).toEqual([
        'https://public.example.com/1.jpg',
        'https://public.example.com/2.jpg',
      ]);
    });

    expect(mockApiFetch).toHaveBeenNthCalledWith(
      1,
      '/spots',
      expect.objectContaining({ method: 'POST' }),
    );
    expect(mockApiFetch).toHaveBeenNthCalledWith(
      2,
      '/spots/spot-1/photos/upload-url',
      expect.objectContaining({ method: 'POST' }),
    );
    expect(mockApiFetch).toHaveBeenNthCalledWith(
      3,
      '/spots/spot-1/photos',
      expect.objectContaining({ method: 'POST' }),
    );
    expect(mockApiFetch).toHaveBeenNthCalledWith(
      4,
      '/spots/spot-1/photos/upload-url',
      expect.objectContaining({ method: 'POST' }),
    );
    expect(mockApiFetch).toHaveBeenNthCalledWith(
      5,
      '/spots/spot-1/photos',
      expect.objectContaining({ method: 'POST' }),
    );
    expect(mockFetch).toHaveBeenNthCalledWith(1, 'file:///tmp/a.jpg');
    expect(mockFetch).toHaveBeenNthCalledWith(
      2,
      'https://upload.example.com/1',
      expect.objectContaining({ method: 'PUT' }),
    );
  });
});
