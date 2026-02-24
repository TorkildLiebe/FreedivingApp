import { useCallback, useState } from 'react';
import { apiFetch } from '@/src/infrastructure/api/client';
import type { SpotDetail } from '@/src/features/map/types';

const MAX_PHOTOS_PER_SPOT = 5;

export interface PendingSpotPhoto {
  uri: string;
  mimeType?: string | null;
}

export interface CreateSpotInput {
  title: string;
  description?: string;
  accessInfo?: string;
  centerLat: number;
  centerLon: number;
  photos?: PendingSpotPhoto[];
}

interface SpotPhotoUploadUrlResponse {
  uploadUrl: string;
  publicUrl: string;
}

export function useCreateSpot() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createSpot = useCallback(async (input: CreateSpotInput) => {
    setIsSubmitting(true);
    setError(null);

    try {
      const title = input.title.trim();
      if (!title) {
        throw new Error('Spot name is required.');
      }

      const createdSpot = await apiFetch<SpotDetail>('/spots', {
        method: 'POST',
        body: JSON.stringify({
          title,
          centerLat: input.centerLat,
          centerLon: input.centerLon,
          ...(input.description?.trim()
            ? { description: input.description.trim() }
            : {}),
          ...(input.accessInfo?.trim()
            ? { accessInfo: input.accessInfo.trim() }
            : {}),
        }),
      });

      const photoAssets = (input.photos ?? []).slice(0, MAX_PHOTOS_PER_SPOT);
      let latestSpot = createdSpot;

      for (const photo of photoAssets) {
        const mimeType = photo.mimeType ?? 'image/jpeg';

        const uploadTarget = await apiFetch<SpotPhotoUploadUrlResponse>(
          `/spots/${createdSpot.id}/photos/upload-url`,
          {
            method: 'POST',
            body: JSON.stringify({ mimeType }),
          },
        );

        const localResponse = await fetch(photo.uri);
        const localBlob = await localResponse.blob();

        const uploadResponse = await fetch(uploadTarget.uploadUrl, {
          method: 'PUT',
          headers: {
            'content-type': mimeType,
          },
          body: localBlob,
        });

        if (!uploadResponse.ok) {
          throw new Error('Failed to upload spot photo.');
        }

        latestSpot = await apiFetch<SpotDetail>(`/spots/${createdSpot.id}/photos`, {
          method: 'POST',
          body: JSON.stringify({ url: uploadTarget.publicUrl }),
        });
      }

      return latestSpot;
    } catch (submitError) {
      const message =
        submitError instanceof Error
          ? submitError.message
          : 'Failed to create spot. Please try again.';
      setError(message);
      throw submitError;
    } finally {
      setIsSubmitting(false);
    }
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    createSpot,
    isSubmitting,
    error,
    clearError,
  };
}
