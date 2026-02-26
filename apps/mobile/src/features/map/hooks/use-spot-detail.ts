import { useCallback, useEffect, useState } from 'react';
import { apiFetch } from '@/src/infrastructure/api/client';
import type {
  ListSpotDiveLogsResponse,
  SpotDetail,
} from '@/src/features/map/types';

export function useSpotDetail(spotId: string | null) {
  const [spot, setSpot] = useState<SpotDetail | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  const refresh = useCallback(() => {
    setReloadKey((prev) => prev + 1);
  }, []);

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
        const [detail, diveLogs] = await Promise.all([
          apiFetch<SpotDetail>(`/spots/${spotId}`),
          apiFetch<ListSpotDiveLogsResponse>(
            `/spots/${spotId}/dive-logs?page=1&limit=20`,
          ),
        ]);
        if (!cancelled) {
          setSpot({
            ...detail,
            diveLogs: diveLogs.items,
          });
        }
      } catch (err) {
        console.warn('Failed to fetch spot detail:', err);
        if (!cancelled) {
          setSpot(null);
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
  }, [spotId, reloadKey]);

  return { spot, isLoading, error, refresh };
}
