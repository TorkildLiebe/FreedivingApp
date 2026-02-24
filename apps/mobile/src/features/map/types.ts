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

export interface DiveLogPreview {
  id: string;
  authorAlias: string | null;
  authorAvatarUrl: string | null;
  visibilityMeters: number;
  currentStrength: number;
  notesPreview: string | null;
  divedAt: string;
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
  photoUrls: string[];
  isFavorite: boolean;
  averageVisibilityMeters: number | null;
  averageRating: number | null;
  reportCount: number;
  latestReportAt: string | null;
  diveLogs: DiveLogPreview[];
  shareUrl: string | null;
  shareableAccessInfo: boolean | null;
  createdAt: string;
  updatedAt: string;
}

export interface SpotPhotoUploadUrlResponse {
  uploadUrl: string;
  publicUrl: string;
  expiresAt: string;
}
