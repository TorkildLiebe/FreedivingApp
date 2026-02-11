import type { FeatureCollection, Point } from 'geojson';
import type { SpotSummary } from '@/src/features/map/types';

export function spotsToGeoJSON(
  spots: SpotSummary[],
): FeatureCollection<Point> {
  return {
    type: 'FeatureCollection',
    features: spots.map((spot) => ({
      type: 'Feature' as const,
      geometry: {
        type: 'Point' as const,
        coordinates: [spot.centerLon, spot.centerLat],
      },
      properties: {
        id: spot.id,
        title: spot.title,
      },
    })),
  };
}
