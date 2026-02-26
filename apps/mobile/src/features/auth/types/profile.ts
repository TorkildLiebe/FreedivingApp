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

export type ProfileView = 'menu' | 'reports' | 'spots' | 'favorites';
