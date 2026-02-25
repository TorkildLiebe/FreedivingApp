import { useCallback, useState } from 'react';
import * as ImagePicker from 'expo-image-picker';
import { apiFetch } from '@/src/infrastructure/api/client';
import type {
  SpotDetail,
  SpotPhotoUploadUrlResponse,
} from '@/src/features/map/types';

const MAX_PHOTOS_PER_SPOT = 5;

interface UseSpotPhotoUploadOptions {
  onUploaded?: () => Promise<void> | void;
}

export function useSpotPhotoUpload(options?: UseSpotPhotoUploadOptions) {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const uploadPhoto = useCallback(
    async (spot: SpotDetail | null) => {
      if (!spot) {
        return;
      }

      if (spot.photoUrls.length >= MAX_PHOTOS_PER_SPOT) {
        setError('You can upload up to 5 photos per spot.');
        return;
      }

      setIsUploading(true);
      setError(null);

      try {
        const permission =
          await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (permission.status !== 'granted') {
          setError('Photo library permission is required.');
          return;
        }

        const result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          quality: 0.85,
          allowsEditing: false,
        });

        if (
          result.canceled ||
          !Array.isArray(result.assets) ||
          result.assets.length === 0
        ) {
          return;
        }

        const selectedAsset = result.assets.find(
          (asset) => typeof asset.uri === 'string' && asset.uri.trim().length > 0,
        );
        if (!selectedAsset?.uri) {
          setError('Failed to read the selected photo. Please try another image.');
          return;
        }

        const mimeType = selectedAsset.mimeType ?? 'image/jpeg';

        const uploadTarget = await apiFetch<SpotPhotoUploadUrlResponse>(
          `/spots/${spot.id}/photos/upload-url`,
          {
            method: 'POST',
            body: JSON.stringify({ mimeType }),
          },
        );

        const assetResponse = await fetch(selectedAsset.uri);
        if (!assetResponse.ok) {
          throw new Error('Failed to read selected photo.');
        }
        const assetBlob = await assetResponse.blob();

        const uploadResponse = await fetch(uploadTarget.uploadUrl, {
          method: 'PUT',
          headers: {
            'content-type': mimeType,
          },
          body: assetBlob,
        });

        if (!uploadResponse.ok) {
          throw new Error(`Upload failed: ${uploadResponse.status}`);
        }

        await apiFetch<SpotDetail>(`/spots/${spot.id}/photos`, {
          method: 'POST',
          body: JSON.stringify({ url: uploadTarget.publicUrl }),
        });

        await options?.onUploaded?.();
      } catch (uploadError) {
        console.warn('Failed to upload spot photo:', uploadError);
        setError('Failed to upload photo. Please try again.');
      } finally {
        setIsUploading(false);
      }
    },
    [options],
  );

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    uploadPhoto,
    isUploading,
    error,
    clearError,
  };
}
