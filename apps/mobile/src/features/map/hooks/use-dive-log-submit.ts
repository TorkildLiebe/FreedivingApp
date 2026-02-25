import { useCallback, useState } from 'react';
import { ApiError, apiFetch } from '@/src/infrastructure/api/client';
import type {
  CreateDiveLogResponse,
  CreateDiveLogInput,
} from '@/src/features/map/types';
import {
  useDiveLogPhotoUpload,
  type PendingDiveLogPhoto,
} from './use-dive-log-photo-upload';

interface SubmitDiveLogInput {
  payload: Omit<CreateDiveLogInput, 'photoUrls'>;
  photos: PendingDiveLogPhoto[];
}

interface UseDiveLogSubmitOptions {
  onSubmitted?: () => Promise<void> | void;
}

export function useDiveLogSubmit(options?: UseDiveLogSubmitOptions) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const {
    uploadPhotos,
    isUploading,
    error: photoUploadError,
    clearError: clearPhotoUploadError,
  } = useDiveLogPhotoUpload();

  const submitDiveLog = useCallback(
    async ({ payload, photos }: SubmitDiveLogInput): Promise<CreateDiveLogResponse> => {
      setIsSubmitting(true);
      setError(null);
      clearPhotoUploadError();

      try {
        const uploadedPhotoUrls = await uploadPhotos(payload.spotId, photos);
        const response = await apiFetch<CreateDiveLogResponse>('/dive-logs', {
          method: 'POST',
          body: JSON.stringify({
            ...payload,
            photoUrls: uploadedPhotoUrls,
          }),
        });

        await options?.onSubmitted?.();
        return response;
      } catch (submitError) {
        if (submitError instanceof ApiError) {
          setError(submitError.message);
        } else {
          setError('Failed to submit dive log. Please try again.');
        }

        throw submitError;
      } finally {
        setIsSubmitting(false);
      }
    },
    [clearPhotoUploadError, options, uploadPhotos],
  );

  const clearError = useCallback(() => {
    setError(null);
    clearPhotoUploadError();
  }, [clearPhotoUploadError]);

  return {
    submitDiveLog,
    isSubmitting,
    isUploadingPhotos: isUploading,
    error: error ?? photoUploadError,
    clearError,
  };
}
