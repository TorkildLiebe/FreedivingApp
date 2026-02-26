import { Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { DiveLogPhotoUploadUrlResponseDto } from './dto/dive-log-photo-upload-url-response.dto';

const DEFAULT_UPLOAD_TTL_SECONDS = 60 * 60;

@Injectable()
export class DiveLogPhotoStorageService {
  private readonly supabase: SupabaseClient | null;
  private readonly bucket: string;
  private bucketEnsured = false;

  constructor() {
    const supabaseUrl =
      process.env.SUPABASE_URL ??
      (process.env.AUTH_ISSUER ? new URL(process.env.AUTH_ISSUER).origin : '');
    const secretKey =
      process.env.SUPABASE_SECRET_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY;

    this.bucket =
      process.env.SUPABASE_DIVE_LOG_PHOTOS_BUCKET ?? 'dive-log-photos';
    this.supabase =
      supabaseUrl && secretKey
        ? createClient(supabaseUrl, secretKey, {
            auth: { persistSession: false },
          })
        : null;
  }

  async createUploadUrl(
    spotId: string,
    mimeType?: string,
  ): Promise<DiveLogPhotoUploadUrlResponseDto> {
    if (!this.supabase) {
      throw new Error(
        'Supabase storage upload is not configured. Set SUPABASE_URL and SUPABASE_SECRET_KEY.',
      );
    }

    await this.ensureBucket();

    const extension = this.extensionFromMimeType(mimeType);
    const objectPath = `spots/${spotId}/${Date.now()}-${randomUUID()}.${extension}`;

    const { data, error } = await this.supabase.storage
      .from(this.bucket)
      .createSignedUploadUrl(objectPath);

    if (error || !data?.signedUrl) {
      throw new Error(error?.message ?? 'Failed to create signed upload URL');
    }

    const { data: publicData } = this.supabase.storage
      .from(this.bucket)
      .getPublicUrl(objectPath);

    return {
      uploadUrl: data.signedUrl,
      publicUrl: publicData.publicUrl,
      expiresAt: new Date(
        Date.now() + DEFAULT_UPLOAD_TTL_SECONDS * 1000,
      ).toISOString(),
    };
  }

  private async ensureBucket(): Promise<void> {
    if (this.bucketEnsured) {
      return;
    }

    if (!this.supabase) {
      throw new Error(
        'Supabase storage upload is not configured. Set SUPABASE_URL and SUPABASE_SECRET_KEY.',
      );
    }

    const { error } = await this.supabase.storage.createBucket(this.bucket, {
      public: true,
      fileSizeLimit: '10MB',
      allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp'],
    });

    if (error && !error.message.toLowerCase().includes('already')) {
      throw new Error(error.message);
    }

    this.bucketEnsured = true;
  }

  private extensionFromMimeType(mimeType?: string): string {
    switch (mimeType?.toLowerCase()) {
      case 'image/png':
        return 'png';
      case 'image/webp':
        return 'webp';
      default:
        return 'jpg';
    }
  }
}
