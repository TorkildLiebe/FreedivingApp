// =============================================================================
// UI Data Shapes — Combined Reference
//
// These types define the data that UI components expect to receive as props.
// They are a frontend contract, not a database schema. How you model, store,
// and fetch this data is an implementation decision.
// =============================================================================

// -----------------------------------------------------------------------------
// From: sections/map-and-spots
// -----------------------------------------------------------------------------

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

export interface CreateSpotPayload {
  name: string;
  description: string;
  accessInfo: string;
  position: Position;
  /** Base64 or blob URLs of photos the user selected during creation */
  photoUris: string[];
}

// -----------------------------------------------------------------------------
// From: sections/dive-reports
// -----------------------------------------------------------------------------

export type CurrentLabel = 'calm' | 'light' | 'moderate' | 'strong' | 'very_strong';

export interface DiveLog {
  id: string;
  spotId: string;
  authorAlias: string;
  authorAvatarUrl: string | null;
  /** Visibility in meters (0–30) */
  visibility: number;
  /** Current strength: 1 (calm) to 5 (very strong) */
  current: 1 | 2 | 3 | 4 | 5;
  notes: string | null;
  /** Up to 5 photo URLs */
  photos: string[];
  /** ISO 8601 date string */
  createdAt: string;
}

export interface SpotRating {
  id: string;
  spotId: string;
  userId: string;
  /** Quality rating for the location: 1 to 5 stars */
  rating: 1 | 2 | 3 | 4 | 5;
  /** ISO 8601 date string — when the rating was last set or updated */
  updatedAt: string;
}

// -----------------------------------------------------------------------------
// From: sections/auth-and-profiles
// -----------------------------------------------------------------------------

export interface AuthUser {
  id: string;
  alias: string;
  email: string;
  /** Short bio text. Null if not set. */
  bio: string | null;
  /** URL to the user's avatar image. Null triggers initials fallback. */
  avatarUrl: string | null;
  /** ISO 8601 timestamp of account creation. */
  createdAt: string;
  /** User's preferred language. Defaults to 'en' if not set. */
  preferredLanguage?: 'no' | 'en';
}

export interface DiveReportPhoto {
  id: string;
  url: string;
  /** Optional caption. Null if not provided. */
  caption: string | null;
}

export interface DiveReportSummary {
  id: string;
  spotId: string;
  spotName: string;
  /** ISO 8601 timestamp of the dive. */
  date: string;
  visibilityMeters: number;
  /** Current strength from 1 (calm) to 5 (very strong). */
  currentStrength: 1 | 2 | 3 | 4 | 5;
  /** Overall session quality rating from 1 to 5 stars. */
  overallRating: 1 | 2 | 3 | 4 | 5;
  /** Optional free-text notes. Null if not written. */
  notes: string | null;
  photos: DiveReportPhoto[];
}

export interface CreatedSpot {
  id: string;
  name: string;
  locationDescription: string;
  maxDepthMeters: number;
  /** ISO 8601 timestamp of when the spot was created. */
  createdAt: string;
  /** Total number of reports submitted for this spot by all users. */
  reportCount: number;
}

export interface FavoriteSpot {
  id: string;
  spotId: string;
  spotName: string;
  locationDescription: string;
  /** Visibility in meters from the most recent report. Null if no reports exist. */
  latestVisibilityMeters: number | null;
  /** ISO 8601 timestamp of the most recent report. Null if no reports exist. */
  latestReportDate: string | null;
}

export interface ActivityStats {
  /** Total number of dive reports the user has submitted. */
  totalReports: number;
  /** Number of unique spots that appear in the user's reports. */
  uniqueSpotsDived: number;
  /** Number of spots the user has saved to favorites. */
  favoritesCount: number;
  /** ISO 8601 timestamp of when the user's account was created. */
  memberSince: string;
}

export type ProfileView = 'menu' | 'reports' | 'spots' | 'favorites' | 'password' | 'language' | 'legal';

export interface EditProfilePayload {
  alias: string;
  bio: string;
  /** New avatar image file. Null means keep existing. */
  avatar: File | null;
}

export interface ChangePasswordPayload {
  currentPassword: string;
  newPassword: string;
}
