import type {
  SpotSummary,
  SpotDetail,
  ListSpotsResponse,
} from '@/src/features/map/types';

export const mockSpotSummary: SpotSummary = {
  id: 'spot-1',
  title: 'Test Dive Spot',
  centerLat: 59.9,
  centerLon: 10.7,
};

export const mockSpotDetail: SpotDetail = {
  id: 'spot-1',
  title: 'Test Dive Spot',
  description: 'A great freediving spot',
  centerLat: 59.9,
  centerLon: 10.7,
  createdById: 'user-1',
  creatorDisplayName: 'Test User',
  accessInfo: 'Park at the lot and walk 5 min',
  parkingLocations: [
    { id: 'parking-1', lat: 59.901, lon: 10.701, label: 'Main parking' },
  ],
  shareUrl: null,
  shareableAccessInfo: null,
  createdAt: '2025-01-01T00:00:00Z',
  updatedAt: '2025-01-01T00:00:00Z',
};

export const mockSpotsList: ListSpotsResponse = {
  items: [
    mockSpotSummary,
    { id: 'spot-2', title: 'Another Spot', centerLat: 60.0, centerLon: 11.0 },
  ],
  count: 2,
  truncated: false,
};
