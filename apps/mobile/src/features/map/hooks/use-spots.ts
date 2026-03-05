import { useCallback, useEffect, useState } from 'react';
import { apiFetch } from '@/src/infrastructure/api/client';
import type { SpotSummary } from '@/src/features/map/types';

let cachedSpotSummaries: SpotSummary[] | null = null;
let inFlightSpotSummariesRequest: Promise<SpotSummary[]> | null = null;

const spotSummarySubscribers = new Set<(spots: SpotSummary[]) => void>();

function setCachedSpotSummaries(spots: SpotSummary[]) {
  cachedSpotSummaries = spots;
  spotSummarySubscribers.forEach((subscriber) => subscriber(spots));
}

async function loadSpotSummaries(forceRefresh = false): Promise<SpotSummary[]> {
  if (!forceRefresh && cachedSpotSummaries !== null) {
    return cachedSpotSummaries;
  }

  if (!forceRefresh && inFlightSpotSummariesRequest) {
    return inFlightSpotSummariesRequest;
  }

  const request = apiFetch<SpotSummary[]>('/spots/summaries');
  inFlightSpotSummariesRequest = request;

  try {
    const spots = await request;
    setCachedSpotSummaries(spots);
    return spots;
  } finally {
    if (inFlightSpotSummariesRequest === request) {
      inFlightSpotSummariesRequest = null;
    }
  }
}

export function resetSpotSummariesCacheForTests() {
  cachedSpotSummaries = null;
  inFlightSpotSummariesRequest = null;
  spotSummarySubscribers.clear();
}

export function useSpots() {
  const [spots, setSpots] = useState<SpotSummary[]>(cachedSpotSummaries ?? []);
  const [isLoading, setIsLoading] = useState(cachedSpotSummaries === null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    spotSummarySubscribers.add(setSpots);

    if (cachedSpotSummaries !== null) {
      setSpots(cachedSpotSummaries);
      setIsLoading(false);
      setError(null);
    } else {
      void loadSpotSummaries()
        .catch((err) => {
          console.warn('Failed to fetch spots:', err);
          if (!cancelled) {
            setError('Failed to load spots');
          }
        })
        .finally(() => {
          if (!cancelled) {
            setIsLoading(false);
          }
        });
    }

    return () => {
      cancelled = true;
      spotSummarySubscribers.delete(setSpots);
    };
  }, []);

  const refresh = useCallback(() => {
    setIsLoading(true);
    setError(null);
    void loadSpotSummaries(true)
      .catch((err) => {
        console.warn('Failed to fetch spots:', err);
        setError('Failed to load spots');
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, []);

  const upsertSpotSummary = useCallback((nextSpot: SpotSummary) => {
    const currentSpots = cachedSpotSummaries ?? [];
    const existingIndex = currentSpots.findIndex((spot) => spot.id === nextSpot.id);

    if (existingIndex === -1) {
      setCachedSpotSummaries([...currentSpots, nextSpot]);
      return;
    }

    const nextSpots = [...currentSpots];
    nextSpots[existingIndex] = nextSpot;
    setCachedSpotSummaries(nextSpots);
  }, []);

  const removeSpotSummary = useCallback((spotId: string) => {
    if (cachedSpotSummaries === null) {
      return;
    }

    setCachedSpotSummaries(
      cachedSpotSummaries.filter((spot) => spot.id !== spotId),
    );
  }, []);

  return {
    spots,
    isLoading,
    error,
    refresh,
    upsertSpotSummary,
    removeSpotSummary,
  };
}
