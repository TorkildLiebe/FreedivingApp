import { useCallback, useEffect, useState } from 'react';
import { Session } from '@supabase/supabase-js';
import { apiFetch } from '@/src/infrastructure/api/client';
import { supabase } from '@/src/infrastructure/supabase/client';

interface GetMeResponse {
  id: string;
  favoriteSpotIds: string[];
}

export function useFavoriteSpots() {
  const [session, setSession] = useState<Session | null>(null);
  const [favoriteSpotIds, setFavoriteSpotIds] = useState<string[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    supabase.auth.getSession().then(({ data: { session: nextSession } }) => {
      if (!cancelled) {
        setSession(nextSession);
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
    });

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!session) {
      setFavoriteSpotIds([]);
      setCurrentUserId(null);
      return;
    }

    let cancelled = false;

    async function loadFavorites() {
      try {
        const profile = await apiFetch<GetMeResponse>('/users/me');
        if (!cancelled) {
          setFavoriteSpotIds(profile.favoriteSpotIds ?? []);
          setCurrentUserId(profile.id ?? null);
        }
      } catch (error) {
        console.warn('Failed to load favorites:', error);
        if (!cancelled) {
          setFavoriteSpotIds([]);
          setCurrentUserId(null);
        }
      }
    }

    void loadFavorites();

    return () => {
      cancelled = true;
    };
  }, [session]);

  const toggleFavoriteSpot = useCallback(
    async (spotId: string, shouldFavorite: boolean) => {
      if (!session) {
        return { error: new Error('Authentication required') };
      }

      const previousFavoriteSpotIds = favoriteSpotIds;
      const nextFavoriteSpotIds = shouldFavorite
        ? previousFavoriteSpotIds.includes(spotId)
          ? previousFavoriteSpotIds
          : [...previousFavoriteSpotIds, spotId]
        : previousFavoriteSpotIds.filter(
            (favoriteSpotId) => favoriteSpotId !== spotId,
          );

      setFavoriteSpotIds(nextFavoriteSpotIds);

      try {
        const response = await apiFetch<GetMeResponse>(
          `/users/me/favorites/${spotId}`,
          {
            method: shouldFavorite ? 'POST' : 'DELETE',
          },
        );

        setFavoriteSpotIds(response.favoriteSpotIds ?? []);
        return { error: null };
      } catch (error) {
        setFavoriteSpotIds(previousFavoriteSpotIds);
        return {
          error:
            error instanceof Error
              ? error
              : new Error('Failed to update favorite'),
        };
      }
    },
    [favoriteSpotIds, session],
  );

  return {
    favoriteSpotIds,
    currentUserId,
    isAuthenticated: Boolean(session),
    toggleFavoriteSpot,
  };
}
