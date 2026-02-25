import { Injectable } from '@nestjs/common';
import {
  DiveLogNotFoundError,
  ForbiddenError,
  InvalidDiveLogError,
  SpotNotFoundOrDeletedError,
} from '../../common/errors';
import type { AuthenticatedUser } from '../../common/auth';
import { CreateDiveLogDto } from './dto/create-dive-log.dto';
import { CreateDiveLogPhotoUploadUrlDto } from './dto/create-dive-log-photo-upload-url.dto';
import { CreateDiveLogResponseDto } from './dto/create-dive-log-response.dto';
import { DiveLogPhotoUploadUrlResponseDto } from './dto/dive-log-photo-upload-url-response.dto';
import { DiveLogResponseDto } from './dto/dive-log-response.dto';
import { UpdateDiveLogDto } from './dto/update-dive-log.dto';
import { DiveLogPhotoStorageService } from './dive-log-photo-storage.service';
import { DiveLogsRepository } from './dive-logs.repository';

const MAX_PHOTOS_PER_DIVE_LOG = 5;
const EDIT_WINDOW_MS = 48 * 60 * 60 * 1000;

@Injectable()
export class DiveLogsService {
  constructor(
    private readonly diveLogsRepository: DiveLogsRepository,
    private readonly diveLogPhotoStorage: DiveLogPhotoStorageService,
  ) {}

  async create(
    dto: CreateDiveLogDto,
    actor: AuthenticatedUser,
  ): Promise<CreateDiveLogResponseDto> {
    const spot = await this.diveLogsRepository.findActiveSpotById(dto.spotId);
    if (!spot) {
      throw new SpotNotFoundOrDeletedError(dto.spotId);
    }

    const divedAt = this.parseAndValidateDivedAt(dto.divedAt);
    const notes = this.normalizeNotes(dto.notes);
    const photoUrls = this.normalizePhotoUrls(dto.photoUrls ?? []);

    const shouldPromptRating =
      !(await this.diveLogsRepository.hasExistingRating(
        actor.userId,
        dto.spotId,
      ));

    const created = await this.diveLogsRepository.createDiveLog({
      spotId: dto.spotId,
      authorId: actor.userId,
      visibilityMeters: dto.visibilityMeters,
      currentStrength: dto.currentStrength,
      notes,
      photoUrls,
      divedAt,
    });

    return {
      diveLog: this.toDiveLogResponse(created),
      shouldPromptRating,
    };
  }

  async createPhotoUploadUrl(
    dto: CreateDiveLogPhotoUploadUrlDto,
  ): Promise<DiveLogPhotoUploadUrlResponseDto> {
    const spot = await this.diveLogsRepository.findActiveSpotById(dto.spotId);
    if (!spot) {
      throw new SpotNotFoundOrDeletedError(dto.spotId);
    }

    return this.diveLogPhotoStorage.createUploadUrl(dto.spotId, dto.mimeType);
  }

  async update(
    diveLogId: string,
    dto: UpdateDiveLogDto,
    actor: AuthenticatedUser,
  ): Promise<DiveLogResponseDto> {
    const existing = await this.diveLogsRepository.findDiveLogById(diveLogId);
    if (!existing || existing.isDeleted) {
      throw new DiveLogNotFoundError(diveLogId);
    }

    if (existing.authorId !== actor.userId) {
      throw new ForbiddenError('only dive-log owner may edit this dive log');
    }

    const createdAtMs = existing.createdAt.getTime();
    if (Date.now() - createdAtMs > EDIT_WINDOW_MS) {
      throw new InvalidDiveLogError('Dive log edit window has expired');
    }

    const updateData: {
      visibilityMeters?: number;
      currentStrength?: number;
      notes?: string | null;
      photoUrls?: string[];
      divedAt?: Date;
    } = {};

    if (dto.visibilityMeters !== undefined) {
      updateData.visibilityMeters = dto.visibilityMeters;
    }
    if (dto.currentStrength !== undefined) {
      updateData.currentStrength = dto.currentStrength;
    }
    if (dto.divedAt !== undefined) {
      updateData.divedAt = this.parseAndValidateDivedAt(dto.divedAt);
    }
    if (dto.notes !== undefined) {
      updateData.notes = this.normalizeNotes(dto.notes);
    }
    if (dto.photoUrls !== undefined) {
      updateData.photoUrls = this.normalizePhotoUrls(dto.photoUrls);
    }

    const updated = await this.diveLogsRepository.updateDiveLog(
      diveLogId,
      existing.spotId,
      updateData,
    );

    return this.toDiveLogResponse(updated);
  }

  private parseAndValidateDivedAt(divedAt?: string): Date {
    if (!divedAt) {
      return new Date();
    }

    const parsed = new Date(divedAt);
    if (Number.isNaN(parsed.getTime())) {
      throw new InvalidDiveLogError('Dive date is invalid');
    }

    if (parsed.getTime() > Date.now()) {
      throw new InvalidDiveLogError('Dive date cannot be in the future');
    }

    return parsed;
  }

  private normalizeNotes(notes?: string | null): string | null {
    if (notes == null) {
      return null;
    }

    const trimmed = notes.trim();
    if (trimmed.length === 0) {
      return null;
    }

    if (trimmed.length > 500) {
      throw new InvalidDiveLogError('Notes must be at most 500 characters');
    }

    return trimmed;
  }

  private normalizePhotoUrls(photoUrls: string[]): string[] {
    if (photoUrls.length > MAX_PHOTOS_PER_DIVE_LOG) {
      throw new InvalidDiveLogError(
        'You can upload up to 5 photos per dive log',
      );
    }

    return photoUrls.map((url) => {
      const normalized = url.trim();
      if (!normalized) {
        throw new InvalidDiveLogError('Photo URLs must be non-empty');
      }

      try {
        const parsed = new URL(normalized);
        const isDevLocalHttp =
          process.env.NODE_ENV !== 'production' &&
          parsed.protocol === 'http:' &&
          ['127.0.0.1', 'localhost'].includes(parsed.hostname);

        if (parsed.protocol !== 'https:' && !isDevLocalHttp) {
          throw new InvalidDiveLogError('Photo URLs must use HTTPS');
        }

        return parsed.toString();
      } catch {
        throw new InvalidDiveLogError('Photo URLs must be valid');
      }
    });
  }

  private toDiveLogResponse(diveLog: {
    id: string;
    spotId: string;
    authorId: string;
    visibilityMeters: number;
    currentStrength: number;
    notes: string | null;
    photoUrls: string[];
    divedAt: Date;
    createdAt: Date;
    updatedAt: Date;
    author: {
      alias: string | null;
      avatarUrl: string | null;
    };
  }): DiveLogResponseDto {
    return {
      id: diveLog.id,
      spotId: diveLog.spotId,
      authorId: diveLog.authorId,
      authorAlias: diveLog.author.alias,
      authorAvatarUrl: diveLog.author.avatarUrl,
      visibilityMeters: diveLog.visibilityMeters,
      currentStrength: diveLog.currentStrength,
      notes: diveLog.notes,
      photoUrls: diveLog.photoUrls,
      divedAt: diveLog.divedAt,
      createdAt: diveLog.createdAt,
      updatedAt: diveLog.updatedAt,
    };
  }
}
