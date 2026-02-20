export interface Position {
  lat: number;
  lng: number;
}

export interface Photo {
  id: string;
  url: string;
  caption: string | null;
}

export interface ParkingLocation {
  id: string;
  position: Position;
  description: string;
}

export interface LatestReport {
  visibility: number;
  /** ISO 8601 date string */
  date: string;
}

export interface DiveSpot {
  id: string;
  name: string;
  description: string;
  accessInfo: string;
  position: Position;
  parkingLocationIds: string[];
  photos: Photo[];
  reportCount: number;
  /** Average star rating from SpotRatings (not DiveReports); null if no ratings yet */
  averageRating: number | null;
  /** Average visibility in meters across all reports; null if no reports */
  averageVisibility: number | null;
  /** Latest report summary; null if no reports. Dates > 30 days old are considered stale. */
  latestReport: LatestReport | null;
  isFavorited: boolean;
  /** Current user's SpotRating (1–5); null if the user has not rated this spot */
  currentUserRating: 1 | 2 | 3 | 4 | 5 | null;
}

export interface DiveReport {
  id: string;
  spotId: string;
  authorAlias: string;
  authorAvatarUrl: string | null;
  /** Visibility in meters */
  visibility: number;
  /** Current strength: 1 (calm) to 5 (very strong) */
  current: 1 | 2 | 3 | 4 | 5;
  notes: string | null;
  photos: Photo[];
  /** ISO 8601 date string */
  createdAt: string;
}

export interface MapAndSpotsData {
  spots: DiveSpot[];
  reports: DiveReport[];
  parkingLocations: ParkingLocation[];
}

export interface MapAndSpotsProps {
  data: MapAndSpotsData;
  searchQuery: string;
  /** ID of the currently selected/active spot; null if none */
  activeSpotId: string | null;
  /** True when the user is in spot-creation mode (pin dropped at map center) */
  isCreatingSpot: boolean;
  onSpotPress: (spotId: string) => void;
  onSpotDismiss: () => void;
  onFavoriteToggle: (spotId: string, current: boolean) => void;
  onSearch: (query: string) => void;
  onCreateSpotStart: () => void;
  /** Called when the user confirms the pin position and submits the creation form */
  onCreateSpotConfirm: (payload: CreateSpotPayload) => void;
  onCreateSpotCancel: () => void;
  /** Called when the user taps "Add Dive" in the spot detail sheet */
  onAddDive: (spotId: string) => void;
  /** Called when the user submits or updates their rating for a spot */
  onUpdateRating: (spotId: string, rating: 1 | 2 | 3 | 4 | 5) => void;
}

export interface CreateSpotPayload {
  name: string;
  description: string;
  accessInfo: string;
  position: Position;
  /** Base64 or blob URLs of photos the user selected during creation */
  photoUris: string[];
}
