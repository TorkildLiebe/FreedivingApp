import { renderHook, waitFor } from '@testing-library/react-native';
import { useLocation } from '@/hooks/use-location';
import * as Location from 'expo-location';

jest.mock('expo-location');

const mockLocation = jest.mocked(Location);

describe('useLocation', () => {
  const fakeCoords = { latitude: 60.0, longitude: 11.0 };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('starts in loading state', () => {
    mockLocation.requestForegroundPermissionsAsync.mockReturnValue(
      new Promise(() => {}), // never resolves
    );

    const { result } = renderHook(() => useLocation());
    expect(result.current.isLoading).toBe(true);
    expect(result.current.location).toBeNull();
    expect(result.current.error).toBeNull();
  });

  it('returns location when permission granted', async () => {
    mockLocation.requestForegroundPermissionsAsync.mockResolvedValue({
      status: Location.PermissionStatus.GRANTED,
      granted: true,
      canAskAgain: true,
      expires: 'never',
    });
    mockLocation.getCurrentPositionAsync.mockResolvedValue({
      coords: { ...fakeCoords, altitude: 0, accuracy: 10, altitudeAccuracy: 0, heading: 0, speed: 0 },
      timestamp: Date.now(),
    });
    mockLocation.watchPositionAsync.mockResolvedValue({ remove: jest.fn() });

    const { result } = renderHook(() => useLocation());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.location).toEqual({ lat: 60.0, lng: 11.0 });
    expect(result.current.error).toBeNull();
  });

  it('returns error when permission denied', async () => {
    mockLocation.requestForegroundPermissionsAsync.mockResolvedValue({
      status: Location.PermissionStatus.DENIED,
      granted: false,
      canAskAgain: true,
      expires: 'never',
    });

    const { result } = renderHook(() => useLocation());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.location).toBeNull();
    expect(result.current.error).toBe('Location permission denied');
  });

  it('cleans up watch subscription on unmount', async () => {
    const removeMock = jest.fn();
    mockLocation.requestForegroundPermissionsAsync.mockResolvedValue({
      status: Location.PermissionStatus.GRANTED,
      granted: true,
      canAskAgain: true,
      expires: 'never',
    });
    mockLocation.getCurrentPositionAsync.mockResolvedValue({
      coords: { ...fakeCoords, altitude: 0, accuracy: 10, altitudeAccuracy: 0, heading: 0, speed: 0 },
      timestamp: Date.now(),
    });
    mockLocation.watchPositionAsync.mockResolvedValue({ remove: removeMock });

    const { unmount } = renderHook(() => useLocation());

    await waitFor(() => {
      expect(mockLocation.watchPositionAsync).toHaveBeenCalled();
    });

    unmount();
    expect(removeMock).toHaveBeenCalled();
  });
});
