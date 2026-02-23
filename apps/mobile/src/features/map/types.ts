export interface SpotSummary {
  id: string;
  title: string;
  centerLat: number;
  centerLon: number;
}

export interface BBox {
  latMin: number;
  latMax: number;
  lonMin: number;
  lonMax: number;
}

export interface ListSpotsResponse {
  items: SpotSummary[];
  count: number;
  truncated: boolean;
}

export interface ParkingLocation {
  id: string;
  lat: number;
  lon: number;
  label: string | null;
}

export interface SpotDetail {
  id: string;
  title: string;
  description: string;
  centerLat: number;
  centerLon: number;
  createdById: string;
  creatorDisplayName: string | null;
  accessInfo: string | null;
  parkingLocations: ParkingLocation[];
  shareUrl: string | null;
  shareableAccessInfo: boolean | null;
  createdAt: string;
  updatedAt: string;
}
