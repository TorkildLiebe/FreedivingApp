import type * as Location from 'expo-location';

export const mockLocationResult: Location.LocationObject = {
  coords: {
    latitude: 60.0,
    longitude: 11.0,
    altitude: 0,
    accuracy: 10,
    altitudeAccuracy: 0,
    heading: 0,
    speed: 0,
  },
  timestamp: Date.now(),
};
