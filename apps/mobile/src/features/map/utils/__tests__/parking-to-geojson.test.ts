import { parkingToGeoJSON } from '../parking-to-geojson';
import type { ParkingLocation } from '@/src/features/map/types';

describe('parkingToGeoJSON', () => {
  it('returns empty FeatureCollection for empty array', () => {
    const result = parkingToGeoJSON([]);
    expect(result).toEqual({
      type: 'FeatureCollection',
      features: [],
    });
  });

  it('converts a parking location with correct [lon, lat] order', () => {
    const parking: ParkingLocation = {
      id: 'p-1',
      lat: 60.01,
      lon: 5.01,
      label: 'Main parking',
    };

    const result = parkingToGeoJSON([parking]);

    expect(result.features).toHaveLength(1);
    expect(result.features[0].geometry.coordinates).toEqual([5.01, 60.01]);
  });

  it('includes id and label in feature properties', () => {
    const parking: ParkingLocation = {
      id: 'p-2',
      lat: 60.0,
      lon: 5.0,
      label: 'Side entrance',
    };

    const result = parkingToGeoJSON([parking]);
    const props = result.features[0].properties;

    expect(props).toEqual({ id: 'p-2', label: 'Side entrance' });
  });

  it('handles null label', () => {
    const parking: ParkingLocation = {
      id: 'p-3',
      lat: 60.0,
      lon: 5.0,
      label: null,
    };

    const result = parkingToGeoJSON([parking]);

    expect(result.features[0].properties).toEqual({ id: 'p-3', label: null });
  });

  it('converts multiple parking locations', () => {
    const parkingLocations: ParkingLocation[] = [
      { id: 'p-1', lat: 60.0, lon: 5.0, label: 'A' },
      { id: 'p-2', lat: 60.1, lon: 5.1, label: 'B' },
    ];

    const result = parkingToGeoJSON(parkingLocations);

    expect(result.features).toHaveLength(2);
    expect(result.type).toBe('FeatureCollection');
  });
});
