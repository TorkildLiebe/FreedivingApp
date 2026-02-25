import { Injectable } from '@nestjs/common';
import { SpotsRepository } from './spots.repository';
import {
  DuplicatePhotoUrlError,
  DuplicateParkingLocationError,
  ForbiddenError,
  InvalidBBoxError,
  InvalidParkingLocationError,
  InvalidPhotoUrlError,
  SpotNotFoundOrDeletedError,
  TooManyPhotosError,
  TooCloseToExistingSpotError,
} from '../../common/errors';
import { ListSpotsResponseDto } from './dto/list-spots-response.dto';
import { SpotDetailResponseDto } from './dto/spot-detail-response.dto';
import type { AuthenticatedUser } from '../../common/auth';
import type { CreateSpotDto } from './dto/create-spot.dto';
import type { UpdateSpotDto } from './dto/update-spot.dto';
import { SpotPhotoStorageService } from './spot-photo-storage.service';
import { SpotPhotoUploadUrlResponseDto } from './dto/spot-photo-upload-url-response.dto';
import { ListSpotDiveLogsResponseDto } from './dto/list-spot-dive-logs-response.dto';

const DEFAULT_LIMIT = 300;
const MAX_LIMIT = 1000;
const DEFAULT_DIVE_LOG_PAGE = 1;
const DEFAULT_DIVE_LOG_LIMIT = 20;
const MAX_DIVE_LOG_LIMIT = 50;
const MIN_SPOT_DISTANCE_METERS = 1000;
const MAX_PARKING_DISTANCE_METERS = 5000;
const MIN_PARKING_SEPARATION_METERS = 2;
const MAX_PHOTOS_PER_SPOT = 5;
const DIVE_LOG_NOTES_PREVIEW_MAX = 120;

@Injectable()
export class SpotsService {
  constructor(
    private readonly spotsRepository: SpotsRepository,
    private readonly spotPhotoStorage: SpotPhotoStorageService,
  ) {}

  async listByBBox(
    latMin: number,
    latMax: number,
    lonMin: number,
    lonMax: number,
    maxResults?: number,
  ): Promise<ListSpotsResponseDto> {
    if (latMin >= latMax) {
      throw new InvalidBBoxError('latMin must be less than latMax');
    }
    if (lonMin > lonMax) {
      throw new InvalidBBoxError(
        'antimeridian-spanning bounding boxes are not supported',
      );
    }

    const limit = Math.min(maxResults ?? DEFAULT_LIMIT, MAX_LIMIT);
    const rows = await this.spotsRepository.listByBBox(
      latMin,
      latMax,
      lonMin,
      lonMax,
      limit,
    );
    const truncated = rows.length > limit;
    const items = truncated ? rows.slice(0, limit) : rows;

    return { items, count: items.length, truncated };
  }

  async getById(spotId: string): Promise<SpotDetailResponseDto> {
    const spot = await this.spotsRepository.findById(spotId);
    if (!spot) {
      throw new SpotNotFoundOrDeletedError(spotId);
    }

    const diveLogs = await this.spotsRepository.listDiveLogsBySpot(
      spotId,
      0,
      DEFAULT_DIVE_LOG_LIMIT,
    );

    return this.toSpotDetailResponse(spot, diveLogs.items);
  }

  async listDiveLogs(
    spotId: string,
    page?: number,
    limit?: number,
  ): Promise<ListSpotDiveLogsResponseDto> {
    const spot = await this.spotsRepository.findById(spotId);
    if (!spot) {
      throw new SpotNotFoundOrDeletedError(spotId);
    }

    const normalizedPage = Math.max(page ?? DEFAULT_DIVE_LOG_PAGE, 1);
    const normalizedLimit = Math.min(
      Math.max(limit ?? DEFAULT_DIVE_LOG_LIMIT, 1),
      MAX_DIVE_LOG_LIMIT,
    );
    const skip = (normalizedPage - 1) * normalizedLimit;
    const { items, total } = await this.spotsRepository.listDiveLogsBySpot(
      spotId,
      skip,
      normalizedLimit,
    );

    return {
      items: items.map((item) => this.toDiveLogPreview(item)),
      page: normalizedPage,
      limit: normalizedLimit,
      total,
    };
  }

  async create(
    dto: CreateSpotDto,
    actor: AuthenticatedUser,
  ): Promise<SpotDetailResponseDto> {
    this.validateParkingLocations(
      dto.centerLat,
      dto.centerLon,
      dto.parkingLocations,
    );

    const nearby = await this.spotsRepository.findNearbyCenters(
      dto.centerLat,
      dto.centerLon,
      MIN_SPOT_DISTANCE_METERS,
    );

    if (nearby.length > 0) {
      throw new TooCloseToExistingSpotError();
    }

    const created = await this.spotsRepository.createSpot(
      {
        title: dto.title,
        description: dto.description ?? '',
        centerLat: dto.centerLat,
        centerLon: dto.centerLon,
        createdById: actor.userId,
        accessInfo: dto.accessInfo ?? null,
      },
      (dto.parkingLocations ?? []).map((parking) => ({
        lat: parking.lat,
        lon: parking.lon,
        label: parking.label ?? null,
      })),
    );

    if (!created) {
      throw new SpotNotFoundOrDeletedError('created-spot');
    }

    return this.toSpotDetailResponse(created);
  }

  async update(
    spotId: string,
    dto: UpdateSpotDto,
    actor: AuthenticatedUser,
  ): Promise<SpotDetailResponseDto> {
    const existing = await this.spotsRepository.findByIdAnyState(spotId);

    if (!existing || existing.isDeleted) {
      throw new SpotNotFoundOrDeletedError(spotId);
    }

    this.assertCanMutate(existing.createdById, actor);

    this.validateParkingLocations(
      existing.centerLat,
      existing.centerLon,
      dto.parkingLocations,
    );

    if (
      dto.title === undefined &&
      dto.description === undefined &&
      dto.accessInfo === undefined &&
      dto.parkingLocations === undefined
    ) {
      return this.toSpotDetailResponse(existing);
    }

    const updated = await this.spotsRepository.updateSpot(
      spotId,
      {
        ...(dto.title !== undefined ? { title: dto.title } : {}),
        ...(dto.description !== undefined
          ? { description: dto.description ?? '' }
          : {}),
        ...(dto.accessInfo !== undefined
          ? { accessInfo: dto.accessInfo ?? null }
          : {}),
      },
      dto.parkingLocations
        ? dto.parkingLocations.map((parking) => ({
            lat: parking.lat,
            lon: parking.lon,
            label: parking.label ?? null,
          }))
        : undefined,
    );

    if (!updated) {
      throw new SpotNotFoundOrDeletedError(spotId);
    }

    return this.toSpotDetailResponse(updated);
  }

  async softDelete(spotId: string, actor: AuthenticatedUser): Promise<void> {
    const existing = await this.spotsRepository.findByIdAnyState(spotId);

    if (!existing) {
      throw new SpotNotFoundOrDeletedError(spotId);
    }

    this.assertCanMutate(existing.createdById, actor);

    if (existing.isDeleted) {
      return;
    }

    await this.spotsRepository.softDeleteSpot(spotId);
  }

  async createPhotoUploadUrl(
    spotId: string,
    mimeType?: string,
  ): Promise<SpotPhotoUploadUrlResponseDto> {
    const existing = await this.spotsRepository.findByIdAnyState(spotId);

    if (!existing || existing.isDeleted) {
      throw new SpotNotFoundOrDeletedError(spotId);
    }

    if ((existing.photoUrls?.length ?? 0) >= MAX_PHOTOS_PER_SPOT) {
      throw new TooManyPhotosError();
    }

    return this.spotPhotoStorage.createUploadUrl(spotId, mimeType);
  }

  async addPhoto(spotId: string, url: string): Promise<SpotDetailResponseDto> {
    const existing = await this.spotsRepository.findByIdAnyState(spotId);

    if (!existing || existing.isDeleted) {
      throw new SpotNotFoundOrDeletedError(spotId);
    }

    const normalizedUrl = this.normalizeAndValidatePhotoUrl(url);
    const currentUrls = existing.photoUrls ?? [];

    if (currentUrls.length >= MAX_PHOTOS_PER_SPOT) {
      throw new TooManyPhotosError();
    }

    if (
      currentUrls.some(
        (existingUrl) =>
          existingUrl.toLowerCase() === normalizedUrl.toLowerCase(),
      )
    ) {
      throw new DuplicatePhotoUrlError();
    }

    const updated = await this.spotsRepository.updatePhotoUrls(spotId, [
      ...currentUrls,
      normalizedUrl,
    ]);

    if (!updated) {
      throw new SpotNotFoundOrDeletedError(spotId);
    }

    return this.toSpotDetailResponse(updated);
  }

  private toSpotDetailResponse(
    spot: {
      id: string;
      title: string;
      description: string;
      centerLat: number;
      centerLon: number;
      createdById: string;
      createdBy: { alias: string | null };
      accessInfo: string | null;
      parkingLocations: Array<{
        id: string;
        lat: number;
        lon: number;
        label: string | null;
      }>;
      photoUrls: string[];
      averageVisibilityMeters: number | null;
      averageRating: number | null;
      reportCount: number;
      latestReportAt: Date | null;
      shareUrl: string | null;
      shareableAccessInfo: boolean | null;
      createdAt: Date;
      updatedAt: Date;
    },
    diveLogs: Array<{
      id: string;
      visibilityMeters: number;
      currentStrength: number;
      notes: string | null;
      divedAt: Date;
      author: {
        alias: string | null;
        avatarUrl: string | null;
      };
    }> = [],
  ): SpotDetailResponseDto {
    return {
      id: spot.id,
      title: spot.title,
      description: spot.description,
      centerLat: spot.centerLat,
      centerLon: spot.centerLon,
      createdById: spot.createdById,
      creatorDisplayName: spot.createdBy.alias,
      accessInfo: spot.accessInfo,
      parkingLocations: spot.parkingLocations.map((p) => ({
        id: p.id,
        lat: p.lat,
        lon: p.lon,
        label: p.label,
      })),
      photoUrls: spot.photoUrls,
      isFavorite: false,
      averageVisibilityMeters: spot.averageVisibilityMeters,
      averageRating: spot.averageRating,
      reportCount: spot.reportCount,
      latestReportAt: spot.latestReportAt,
      diveLogs: diveLogs.map((diveLog) => this.toDiveLogPreview(diveLog)),
      shareUrl: spot.shareUrl,
      shareableAccessInfo: spot.shareableAccessInfo,
      createdAt: spot.createdAt,
      updatedAt: spot.updatedAt,
    };
  }

  private toDiveLogPreview(diveLog: {
    id: string;
    visibilityMeters: number;
    currentStrength: number;
    notes: string | null;
    divedAt: Date;
    author: {
      alias: string | null;
      avatarUrl: string | null;
    };
  }) {
    return {
      id: diveLog.id,
      authorAlias: diveLog.author.alias,
      authorAvatarUrl: diveLog.author.avatarUrl,
      visibilityMeters: diveLog.visibilityMeters,
      currentStrength: diveLog.currentStrength,
      notesPreview: this.createNotesPreview(diveLog.notes),
      divedAt: diveLog.divedAt,
    };
  }

  private createNotesPreview(notes: string | null): string | null {
    if (!notes) {
      return null;
    }

    const normalized = notes.trim();
    if (!normalized) {
      return null;
    }

    if (normalized.length <= DIVE_LOG_NOTES_PREVIEW_MAX) {
      return normalized;
    }

    return `${normalized.slice(0, DIVE_LOG_NOTES_PREVIEW_MAX - 1).trimEnd()}…`;
  }

  private assertCanMutate(createdById: string, actor: AuthenticatedUser): void {
    const isOwner = createdById === actor.userId;
    const isPrivileged = ['moderator', 'admin'].includes(actor.role);

    if (!isOwner && !isPrivileged) {
      throw new ForbiddenError(
        'only owner, moderator, or admin may modify spot',
      );
    }
  }

  private validateParkingLocations(
    centerLat: number,
    centerLon: number,
    parkingLocations?: Array<{ lat: number; lon: number }>,
  ): void {
    if (!parkingLocations) {
      return;
    }

    if (parkingLocations.length > 5) {
      throw new InvalidParkingLocationError(
        'max 5 parking locations are allowed',
      );
    }

    for (let i = 0; i < parkingLocations.length; i += 1) {
      const current = parkingLocations[i];
      if (!current) {
        continue;
      }

      const distanceFromCenter = this.distanceMeters(
        centerLat,
        centerLon,
        current.lat,
        current.lon,
      );

      if (distanceFromCenter > MAX_PARKING_DISTANCE_METERS) {
        throw new InvalidParkingLocationError(
          'parking location must be within 5000m of spot center',
        );
      }

      for (let j = i + 1; j < parkingLocations.length; j += 1) {
        const other = parkingLocations[j];
        if (!other) {
          continue;
        }

        const distanceBetweenParkings = this.distanceMeters(
          current.lat,
          current.lon,
          other.lat,
          other.lon,
        );

        if (distanceBetweenParkings < MIN_PARKING_SEPARATION_METERS) {
          throw new DuplicateParkingLocationError();
        }
      }
    }
  }

  private normalizeAndValidatePhotoUrl(url: string): string {
    const normalized = url.trim();
    if (!normalized) {
      throw new InvalidPhotoUrlError();
    }

    try {
      const parsed = new URL(normalized);
      const isDevLocalHttp =
        process.env.NODE_ENV !== 'production' &&
        parsed.protocol === 'http:' &&
        ['127.0.0.1', 'localhost'].includes(parsed.hostname);

      if (parsed.protocol !== 'https:' && !isDevLocalHttp) {
        throw new InvalidPhotoUrlError();
      }
      return parsed.toString();
    } catch {
      throw new InvalidPhotoUrlError();
    }
  }

  private distanceMeters(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number,
  ): number {
    const earthRadius = 6371000;

    const lat1Rad = (lat1 * Math.PI) / 180;
    const lat2Rad = (lat2 * Math.PI) / 180;
    const deltaLat = ((lat2 - lat1) * Math.PI) / 180;
    const deltaLon = ((lon2 - lon1) * Math.PI) / 180;

    const a =
      Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
      Math.cos(lat1Rad) *
        Math.cos(lat2Rad) *
        Math.sin(deltaLon / 2) *
        Math.sin(deltaLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return earthRadius * c;
  }
}
