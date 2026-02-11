import { spotsToGeoJSON } from '../spots-to-geojson';
import type { SpotSummary } from '@/src/features/map/types';

describe('spotsToGeoJSON', () => {
  it('returns empty FeatureCollection for empty array', () => {
    const result = spotsToGeoJSON([]);
    expect(result).toEqual({
      type: 'FeatureCollection',
      features: [],
    });
  });

  it('converts a single spot with correct [lon, lat] order', () => {
    const spot: SpotSummary = {
      id: 'abc-123',
      title: 'Test Spot',
      centerLat: 59.9,
      centerLon: 10.7,
    };

    const result = spotsToGeoJSON([spot]);

    expect(result.features).toHaveLength(1);
    expect(result.features[0].geometry.coordinates).toEqual([10.7, 59.9]);
  });

  it('includes id and title in feature properties', () => {
    const spot: SpotSummary = {
      id: 'xyz-789',
      title: 'My Dive Spot',
      centerLat: 60.0,
      centerLon: 5.3,
    };

    const result = spotsToGeoJSON([spot]);
    const props = result.features[0].properties;

    expect(props).toEqual({ id: 'xyz-789', title: 'My Dive Spot' });
  });

  it('converts multiple spots to correct feature count', () => {
    const spots: SpotSummary[] = [
      { id: '1', title: 'Spot A', centerLat: 59.0, centerLon: 10.0 },
      { id: '2', title: 'Spot B', centerLat: 60.0, centerLon: 11.0 },
      { id: '3', title: 'Spot C', centerLat: 61.0, centerLon: 12.0 },
    ];

    const result = spotsToGeoJSON(spots);

    expect(result.features).toHaveLength(3);
    expect(result.type).toBe('FeatureCollection');
  });
});
