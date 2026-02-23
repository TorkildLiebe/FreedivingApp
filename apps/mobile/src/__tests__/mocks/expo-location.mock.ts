import * as Location from 'expo-location';

jest.mock('expo-location');

const mockLocation = jest.mocked(Location);

export function setupLocationGranted(
  coords = { latitude: 60.0, longitude: 11.0 },
) {
  mockLocation.requestForegroundPermissionsAsync.mockResolvedValue({
    status: Location.PermissionStatus.GRANTED,
    granted: true,
    canAskAgain: true,
    expires: 'never',
  });

  mockLocation.getCurrentPositionAsync.mockResolvedValue({
    coords: {
      latitude: coords.latitude,
      longitude: coords.longitude,
      altitude: 0,
      accuracy: 10,
      altitudeAccuracy: 0,
      heading: 0,
      speed: 0,
    },
    timestamp: Date.now(),
  });

  mockLocation.watchPositionAsync.mockResolvedValue({ remove: jest.fn() });
}

export function setupLocationDenied() {
  mockLocation.requestForegroundPermissionsAsync.mockResolvedValue({
    status: Location.PermissionStatus.DENIED,
    granted: false,
    canAskAgain: true,
    expires: 'never',
  });
}

export { mockLocation };
