import { act, renderHook } from '@testing-library/react-native';
import type { SpotDetail } from '@/src/features/map/types';

const mockApiFetch = jest.fn();
jest.mock('@/src/infrastructure/api/client', () => ({
  apiFetch: (...args: unknown[]) => mockApiFetch(...args),
}));

const mockRequestMediaLibraryPermissionsAsync = jest.fn();
const mockLaunchImageLibraryAsync = jest.fn();
jest.mock('expo-image-picker', () => ({
  requestMediaLibraryPermissionsAsync: () =>
    mockRequestMediaLibraryPermissionsAsync(),
  launchImageLibraryAsync: (...args: unknown[]) =>
    mockLaunchImageLibraryAsync(...args),
  MediaTypeOptions: {
    Images: 'Images',
  },
}));

// eslint-disable-next-line import/first
import { useSpotPhotoUpload } from '@/src/features/map/hooks/use-spot-photo-upload';

const mockSpot: SpotDetail = {
  id: 'spot-1',
  title: 'Spot',
  description: '',
  centerLat: 60,
  centerLon: 5,
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
};

describe('useSpotPhotoUpload', () => {
  const mockFetch = jest.fn();
  const originalFetch = global.fetch;

  beforeEach(() => {
    jest.clearAllMocks();
    global.fetch = mockFetch as typeof global.fetch;
  });

  afterAll(() => {
    global.fetch = originalFetch;
  });

  it('shows validation error when spot already has 5 photos', async () => {
    const { result } = renderHook(() => useSpotPhotoUpload());

    await act(async () => {
      await result.current.uploadPhoto({
        ...mockSpot,
        photoUrls: [
          'https://example.com/1.jpg',
          'https://example.com/2.jpg',
          'https://example.com/3.jpg',
          'https://example.com/4.jpg',
          'https://example.com/5.jpg',
        ],
      });
    });

    expect(result.current.error).toBe('You can upload up to 5 photos per spot.');
    expect(mockApiFetch).not.toHaveBeenCalled();
  });

  it('shows permission error when media library access is denied', async () => {
    mockRequestMediaLibraryPermissionsAsync.mockResolvedValue({
      status: 'denied',
    });

    const { result } = renderHook(() => useSpotPhotoUpload());

    await act(async () => {
      await result.current.uploadPhoto(mockSpot);
    });

    expect(result.current.error).toBe('Photo library permission is required.');
    expect(mockApiFetch).not.toHaveBeenCalled();
  });

  it('uploads selected photo and stores URL on the spot', async () => {
    mockRequestMediaLibraryPermissionsAsync.mockResolvedValue({
      status: 'granted',
    });
    mockLaunchImageLibraryAsync.mockResolvedValue({
      canceled: false,
      assets: [{ uri: 'file:///photo.jpg', mimeType: 'image/jpeg' }],
    });

    mockApiFetch
      .mockResolvedValueOnce({
        uploadUrl: 'https://upload.example.com/signed',
        publicUrl: 'https://public.example.com/photo.jpg',
        expiresAt: '2026-02-24T21:00:00.000Z',
      })
      .mockResolvedValueOnce({
        ...mockSpot,
        photoUrls: ['https://public.example.com/photo.jpg'],
      });

    const onUploaded = jest.fn();
    const blob = {} as Blob;
    mockFetch
      .mockResolvedValueOnce({ blob: async () => blob } as Response)
      .mockResolvedValueOnce({ ok: true } as Response);

    const { result } = renderHook(() => useSpotPhotoUpload({ onUploaded }));

    await act(async () => {
      await result.current.uploadPhoto(mockSpot);
    });

    expect(mockApiFetch).toHaveBeenNthCalledWith(
      1,
      '/spots/spot-1/photos/upload-url',
      expect.objectContaining({ method: 'POST' }),
    );
    expect(mockApiFetch).toHaveBeenNthCalledWith(
      2,
      '/spots/spot-1/photos',
      expect.objectContaining({ method: 'POST' }),
    );
    expect(mockFetch).toHaveBeenNthCalledWith(1, 'file:///photo.jpg');
    expect(mockFetch).toHaveBeenNthCalledWith(
      2,
      'https://upload.example.com/signed',
      expect.objectContaining({
        method: 'PUT',
      }),
    );
    expect(onUploaded).toHaveBeenCalledTimes(1);
    expect(result.current.error).toBeNull();
    expect(result.current.isUploading).toBe(false);
  });

  it('does nothing when image picker result is canceled', async () => {
    mockRequestMediaLibraryPermissionsAsync.mockResolvedValue({
      status: 'granted',
    });
    mockLaunchImageLibraryAsync.mockResolvedValue({
      canceled: true,
      assets: [],
    });

    const { result } = renderHook(() => useSpotPhotoUpload());

    await act(async () => {
      await result.current.uploadPhoto(mockSpot);
    });

    expect(mockApiFetch).not.toHaveBeenCalled();
    expect(result.current.error).toBeNull();
  });
});
