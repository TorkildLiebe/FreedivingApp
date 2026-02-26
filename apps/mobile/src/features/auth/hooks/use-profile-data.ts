import { useCallback, useEffect, useState } from 'react';
import { apiFetch } from '@/src/infrastructure/api/client';
import type {
  ProfileActivity,
  ProfileCreatedSpot,
  ProfileDiveReport,
  ProfileFavoriteSpot,
  ProfileStats,
  ProfileUser,
} from '@/src/features/auth/types/profile';

interface UseProfileDataResult {
  profile: ProfileUser | null;
  stats: ProfileStats | null;
  diveReports: ProfileDiveReport[];
  createdSpots: ProfileCreatedSpot[];
  favorites: ProfileFavoriteSpot[];
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

function fallbackStats(profile: ProfileUser): ProfileStats {
  return {
    totalReports: 0,
    uniqueSpotsDived: 0,
    favoritesCount: profile.favoriteSpotIds.length,
    memberSince:
      typeof profile.createdAt === 'string' && profile.createdAt.length > 0
        ? profile.createdAt
        : new Date(0).toISOString(),
  };
}

function emptyActivity(): ProfileActivity {
  return {
    diveReports: [],
    createdSpots: [],
    favorites: [],
  };
}

export function useProfileData(): UseProfileDataResult {
  const [profile, setProfile] = useState<ProfileUser | null>(null);
  const [stats, setStats] = useState<ProfileStats | null>(null);
  const [diveReports, setDiveReports] = useState<ProfileDiveReport[]>([]);
  const [createdSpots, setCreatedSpots] = useState<ProfileCreatedSpot[]>([]);
  const [favorites, setFavorites] = useState<ProfileFavoriteSpot[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const nextProfile = await apiFetch<ProfileUser>('/users/me');
      let nextStats = fallbackStats(nextProfile);
      let nextActivity = emptyActivity();

      try {
        nextStats = await apiFetch<ProfileStats>('/users/me/stats');
      } catch {
        nextStats = fallbackStats(nextProfile);
      }

      try {
        nextActivity = await apiFetch<ProfileActivity>('/users/me/activity');
      } catch {
        nextActivity = emptyActivity();
      }

      setProfile(nextProfile);
      setStats(nextStats);
      setDiveReports(nextActivity.diveReports);
      setCreatedSpots(nextActivity.createdSpots);
      setFavorites(nextActivity.favorites);
    } catch (err) {
      setProfile(null);
      setStats(null);
      setDiveReports([]);
      setCreatedSpots([]);
      setFavorites([]);
      setError(err instanceof Error ? err.message : 'Failed to load profile');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return {
    profile,
    stats,
    diveReports,
    createdSpots,
    favorites,
    isLoading,
    error,
    refresh,
  };
}
