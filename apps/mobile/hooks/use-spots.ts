import { useEffect, useRef, useState } from 'react';
import { apiFetch } from '@/services/api';
import type { BBox, ListSpotsResponse, SpotSummary } from '@/types/spot';

function bboxToKey(bbox: BBox): string {
  return `${bbox.latMin.toFixed(4)},${bbox.latMax.toFixed(4)},${bbox.lonMin.toFixed(4)},${bbox.lonMax.toFixed(4)}`;
}

export function useSpots(bbox: BBox | null) {
  const [spots, setSpots] = useState<SpotSummary[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const lastKeyRef = useRef<string | null>(null);

  useEffect(() => {
    if (!bbox) return;

    const key = bboxToKey(bbox);
    if (key === lastKeyRef.current) return;
    lastKeyRef.current = key;

    let cancelled = false;

    async function fetchSpots() {
      setIsLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams({
          latMin: String(bbox!.latMin),
          latMax: String(bbox!.latMax),
          lonMin: String(bbox!.lonMin),
          lonMax: String(bbox!.lonMax),
        });
        const data = await apiFetch<ListSpotsResponse>(
          `/spots?${params.toString()}`,
        );
        if (!cancelled) {
          setSpots(data.items);
        }
      } catch (err) {
        console.warn('Failed to fetch spots:', err);
        if (!cancelled) {
          setError('Failed to load spots');
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    void fetchSpots();

    return () => {
      cancelled = true;
    };
  }, [bbox]);

  return { spots, isLoading, error };
}
