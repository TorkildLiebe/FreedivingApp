import { useCallback, useState } from 'react';
import { apiFetch } from '@/src/infrastructure/api/client';
import type { DiveLogPhotoUploadUrlResponse } from '@/src/features/map/types';

export interface PendingDiveLogPhoto {
  uri: string;
  mimeType: string;
}

export function useDiveLogPhotoUpload() {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const uploadPhotos = useCallback(
    async (spotId: string, photos: PendingDiveLogPhoto[]): Promise<string[]> => {
      if (photos.length === 0) {
        return [];
      }

      setIsUploading(true);
      setError(null);

      try {
        const uploadedUrls: string[] = [];

        for (const photo of photos) {
          const uploadTarget = await apiFetch<DiveLogPhotoUploadUrlResponse>(
            '/dive-logs/photos/upload-url',
            {
              method: 'POST',
              body: JSON.stringify({
                spotId,
                mimeType: photo.mimeType,
              }),
            },
          );

          const assetResponse = await fetch(photo.uri);
          if (!assetResponse.ok) {
            throw new Error('Failed to read selected photo.');
          }
          const assetBlob = await assetResponse.blob();

          const uploadResponse = await fetch(uploadTarget.uploadUrl, {
            method: 'PUT',
            headers: {
              'content-type': photo.mimeType,
            },
            body: assetBlob,
          });

          if (!uploadResponse.ok) {
            throw new Error(`Upload failed: ${uploadResponse.status}`);
          }

          uploadedUrls.push(uploadTarget.publicUrl);
        }

        return uploadedUrls;
      } catch (uploadError) {
        console.warn('Failed to upload dive-log photo:', uploadError);
        setError('Failed to upload one or more photos. Please try again.');
        throw uploadError;
      } finally {
        setIsUploading(false);
      }
    },
    [],
  );

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    uploadPhotos,
    isUploading,
    error,
    clearError,
  };
}
