export interface ProfileUser {
  id: string;
  email: string | null;
  alias: string | null;
  bio: string | null;
  avatarUrl: string | null;
  role: string;
  preferredLanguage: string;
  favoriteSpotIds: string[];
  createdAt: string;
}

export interface ProfileStats {
  totalReports: number;
  uniqueSpotsDived: number;
  favoritesCount: number;
  memberSince: string;
}

export interface ProfileDiveReport {
  id: string;
  spotId: string;
  spotName: string;
  date: string;
  visibilityMeters: number;
  currentStrength: number;
  notesPreview: string | null;
}

export interface ProfileCreatedSpot {
  id: string;
  name: string;
  createdAt: string;
  reportCount: number;
}

export interface ProfileFavoriteSpot {
  id: string;
  spotId: string;
  spotName: string;
  latestVisibilityMeters: number | null;
  latestReportDate: string | null;
}

export interface ProfileActivity {
  diveReports: ProfileDiveReport[];
  createdSpots: ProfileCreatedSpot[];
  favorites: ProfileFavoriteSpot[];
}

export interface ProfileAvatarUploadUrl {
  uploadUrl: string;
  publicUrl: string;
  expiresAt: string;
}

export type ProfileView = 'menu' | 'reports' | 'spots' | 'favorites' | 'language';
