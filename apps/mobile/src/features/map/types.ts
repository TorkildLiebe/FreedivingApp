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
  spotId: string;
  authorId: string;
  authorAlias: string | null;
  authorAvatarUrl: string | null;
  visibilityMeters: number;
  currentStrength: number;
  notesPreview: string | null;
  notes: string | null;
  photoUrls: string[];
  divedAt: string;
  createdAt: string;
  updatedAt: string;
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
  ratingCount: number;
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

export interface DiveLogPhotoUploadUrlResponse {
  uploadUrl: string;
  publicUrl: string;
  expiresAt: string;
}

export interface CreateDiveLogInput {
  spotId: string;
  visibilityMeters: number;
  currentStrength: 1 | 2 | 3 | 4 | 5;
  divedAt?: string;
  notes?: string | null;
  photoUrls?: string[];
}

export interface CreateDiveLogResponse {
  diveLog: DiveLogPreview;
  shouldPromptRating: boolean;
}

export interface ListSpotDiveLogsResponse {
  items: DiveLogPreview[];
  page: number;
  limit: number;
  total: number;
}

export interface UpsertSpotRatingResponse {
  id: string;
  spotId: string;
  userId: string;
  rating: 1 | 2 | 3 | 4 | 5;
  averageRating: number | null;
  ratingCount: number;
  createdAt: string;
  updatedAt: string;
}
