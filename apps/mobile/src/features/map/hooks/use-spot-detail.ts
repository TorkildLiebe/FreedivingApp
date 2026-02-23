import { useEffect, useState } from 'react';
import { apiFetch } from '@/src/infrastructure/api/client';
import type { SpotDetail } from '@/src/features/map/types';

export function useSpotDetail(spotId: string | null) {
  const [spot, setSpot] = useState<SpotDetail | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!spotId) {
      setSpot(null);
      setError(null);
      return;
    }

    let cancelled = false;

    async function fetchSpot() {
      setIsLoading(true);
      setError(null);
      try {
        const data = await apiFetch<SpotDetail>(`/spots/${spotId}`);
        if (!cancelled) {
          setSpot(data);
        }
      } catch (err) {
        console.warn('Failed to fetch spot detail:', err);
        if (!cancelled) {
          setError('Failed to load spot details');
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    void fetchSpot();

    return () => {
      cancelled = true;
    };
  }, [spotId]);

  return { spot, isLoading, error };
}
