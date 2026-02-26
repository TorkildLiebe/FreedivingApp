import { useCallback, useEffect, useState } from 'react';
import { apiFetch } from '@/src/infrastructure/api/client';
import type { ProfileStats, ProfileUser } from '@/src/features/auth/types/profile';

interface UseProfileDataResult {
  profile: ProfileUser | null;
  stats: ProfileStats | null;
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

function fallbackStats(profile: ProfileUser): ProfileStats {
  return {
    totalReports: 0,
    uniqueSpotsDived: 0,
    favoritesCount: profile.favoriteSpotIds.length,
    memberSince: profile.createdAt,
  };
}

export function useProfileData(): UseProfileDataResult {
  const [profile, setProfile] = useState<ProfileUser | null>(null);
  const [stats, setStats] = useState<ProfileStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const nextProfile = await apiFetch<ProfileUser>('/users/me');
      let nextStats: ProfileStats;

      try {
        nextStats = await apiFetch<ProfileStats>('/users/me/stats');
      } catch {
        nextStats = fallbackStats(nextProfile);
      }

      setProfile(nextProfile);
      setStats(nextStats);
    } catch (err) {
      setProfile(null);
      setStats(null);
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
    isLoading,
    error,
    refresh,
  };
}
