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
