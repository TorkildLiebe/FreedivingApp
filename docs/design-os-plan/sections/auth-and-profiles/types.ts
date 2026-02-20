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

export interface AuthAndProfilesProps {
  currentUser: AuthUser;
  diveReports: DiveReportSummary[];
  createdSpots: CreatedSpot[];
  favorites: FavoriteSpot[];
  stats: ActivityStats;

  /** Called when the user submits the email/password login form. */
  onLogin: (email: string, password: string) => void;
  /** Called when the user clicks "Continue with Google". */
  onGoogleLogin: () => void;
  /** Called when the user submits the sign-up form. */
  onSignUp: (alias: string, email: string, password: string, avatar?: File) => void;
  /** Called when the user submits the forgot password form. */
  onForgotPassword: (email: string) => void;
  /** Called when the user saves edits to their profile. */
  onEditProfile: (updates: EditProfilePayload) => void;
  /** Called when the user submits a password change. */
  onChangePassword: (payload: ChangePasswordPayload) => void;
  /** Called when the user clicks the logout button. */
  onLogout: () => void;
  /** Called when the user selects a language. */
  onChangeLanguage?: (lang: 'no' | 'en') => void;
}
