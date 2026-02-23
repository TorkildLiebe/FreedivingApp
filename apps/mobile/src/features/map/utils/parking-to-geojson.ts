import type { FeatureCollection, Point } from 'geojson';
import type { ParkingLocation } from '@/src/features/map/types';

export function parkingToGeoJSON(
  parkingLocations: ParkingLocation[],
): FeatureCollection<Point> {
  return {
    type: 'FeatureCollection',
    features: parkingLocations.map((p) => ({
      type: 'Feature' as const,
      geometry: {
        type: 'Point' as const,
        coordinates: [p.lon, p.lat],
      },
      properties: {
        id: p.id,
        label: p.label,
      },
    })),
  };
}
