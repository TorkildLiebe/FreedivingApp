import { Test, TestingModule } from '@nestjs/testing';
import { plainToInstance } from 'class-transformer';
import { validateSync } from 'class-validator';
import { SpotsService } from './spots.service';
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
import type { AuthenticatedUser } from '../../common/auth';
import { UpdateSpotDto } from './dto/update-spot.dto';
import { SpotPhotoStorageService } from './spot-photo-storage.service';

describe('SpotsService', () => {
  let service: SpotsService;
  let repository: jest.Mocked<SpotsRepository>;
  let spotPhotoStorage: jest.Mocked<SpotPhotoStorageService>;

  const actor: AuthenticatedUser = {
    userId: 'uuid-user-1',
    externalId: 'ext-1',
    role: 'user',
  };

  const mockSpotDetail = {
    id: 'uuid-spot-1',
    title: 'Test Dive Spot',
    description: 'A great dive spot',
    centerLat: 60.123456,
    centerLon: 5.123456,
    createdById: 'uuid-user-1',
    createdBy: { alias: 'TestUser' },
    accessInfo: 'Park at the pier',
    averageVisibilityMeters: 8.2,
    averageRating: 4.5,
    reportCount: 12,
    _count: { spotRatings: 5 },
    latestReportAt: new Date('2026-01-01'),
    shareUrl: null,
    shareableAccessInfo: null,
    isDeleted: false,
    deletedAt: null,
    createdAt: new Date('2025-01-01'),
    updatedAt: new Date('2025-01-02'),
    parkingLocations: [
      {
        id: 'uuid-parking-1',
        lat: 60.124,
        lon: 5.124,
        label: 'Main parking',
        spotId: 'uuid-spot-1',
      },
    ],
    photoUrls: [],
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SpotsService,
        {
          provide: SpotPhotoStorageService,
          useValue: {
            createUploadUrl: jest.fn(),
          },
        },
        {
          provide: SpotsRepository,
          useValue: {
            listSummaries: jest.fn(),
            listByBBox: jest.fn(),
            findById: jest.fn(),
            findByIdAnyState: jest.fn(),
            findNearbyCenters: jest.fn(),
            createSpot: jest.fn(),
            updateSpot: jest.fn(),
            updatePhotoUrls: jest.fn(),
            softDeleteSpot: jest.fn(),
            listDiveLogsBySpot: jest.fn(),
            upsertSpotRatingAndRefreshAverage: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<SpotsService>(SpotsService);
    repository = module.get(SpotsRepository);
    spotPhotoStorage = module.get(SpotPhotoStorageService);
  });

  describe('listSummaries', () => {
    it('should return all non-deleted spot summaries', async () => {
      const spots = [
        { id: '1', title: 'A', centerLat: 60, centerLon: 5 },
        { id: '2', title: 'B', centerLat: 60.1, centerLon: 5.1 },
      ];
      repository.listSummaries.mockResolvedValue(spots);

      const result = await service.listSummaries();

      expect(repository.listSummaries).toHaveBeenCalledWith();
      expect(result).toEqual(spots);
    });
  });

  describe('listByBBox', () => {
    it('should throw InvalidBBoxError when latMin >= latMax', async () => {
      await expect(service.listByBBox(61, 59, 5, 11)).rejects.toThrow(
        InvalidBBoxError,
      );
    });

    it('should throw InvalidBBoxError when latMin equals latMax', async () => {
      await expect(service.listByBBox(60, 60, 5, 11)).rejects.toThrow(
        InvalidBBoxError,
      );
    });

    it('should throw InvalidBBoxError for antimeridian (lonMin > lonMax)', async () => {
      await expect(service.listByBBox(59, 61, 170, -170)).rejects.toThrow(
        InvalidBBoxError,
      );
    });

    it('should allow lonMin == lonMax (zero-width bbox)', async () => {
      repository.listByBBox.mockResolvedValue([]);

      const result = await service.listByBBox(59, 61, 5, 5);

      expect(result.truncated).toBe(false);
      expect(result.items).toEqual([]);
    });

    it('should use default limit 300 when maxResults not provided', async () => {
      repository.listByBBox.mockResolvedValue([]);

      await service.listByBBox(59, 61, 5, 11);

      expect(repository.listByBBox).toHaveBeenCalledWith(59, 61, 5, 11, 300);
    });

    it('should cap maxResults at 1000', async () => {
      repository.listByBBox.mockResolvedValue([]);

      await service.listByBBox(59, 61, 5, 11, 2000);

      expect(repository.listByBBox).toHaveBeenCalledWith(59, 61, 5, 11, 1000);
    });

    it('should return truncated: false when results <= limit', async () => {
      const spots = [
        { id: '1', title: 'A', centerLat: 60, centerLon: 5 },
        { id: '2', title: 'B', centerLat: 60.1, centerLon: 5.1 },
      ];
      repository.listByBBox.mockResolvedValue(spots);

      const result = await service.listByBBox(59, 61, 4, 6, 10);

      expect(result.truncated).toBe(false);
      expect(result.items).toEqual(spots);
      expect(result.count).toBe(2);
    });

    it('should return truncated: true and slice when results > limit', async () => {
      const spots = Array.from({ length: 11 }, (_, i) => ({
        id: `id-${i}`,
        title: `Spot ${i}`,
        centerLat: 60,
        centerLon: 5,
      }));
      repository.listByBBox.mockResolvedValue(spots);

      const result = await service.listByBBox(59, 61, 4, 6, 10);

      expect(result.truncated).toBe(true);
      expect(result.items).toHaveLength(10);
      expect(result.count).toBe(10);
    });
  });

  describe('getById', () => {
    it('should return mapped spot detail with parking locations', async () => {
      repository.findById.mockResolvedValue(mockSpotDetail);
      repository.listDiveLogsBySpot.mockResolvedValue({
        items: [],
        total: 0,
      });

      const result = await service.getById('uuid-spot-1');

      expect(result).toEqual({
        id: 'uuid-spot-1',
        title: 'Test Dive Spot',
        description: 'A great dive spot',
        centerLat: 60.123456,
        centerLon: 5.123456,
        createdById: 'uuid-user-1',
        creatorDisplayName: 'TestUser',
        accessInfo: 'Park at the pier',
        parkingLocations: [
          {
            id: 'uuid-parking-1',
            lat: 60.124,
            lon: 5.124,
            label: 'Main parking',
          },
        ],
        photoUrls: [],
        isFavorite: false,
        averageVisibilityMeters: 8.2,
        averageRating: 4.5,
        reportCount: 12,
        ratingCount: 5,
        latestReportAt: new Date('2026-01-01'),
        diveLogs: [],
        shareUrl: null,
        shareableAccessInfo: null,
        createdAt: new Date('2025-01-01'),
        updatedAt: new Date('2025-01-02'),
      });
    });

    it('should preserve null summary values when no report aggregates exist', async () => {
      repository.findById.mockResolvedValue({
        ...mockSpotDetail,
        averageVisibilityMeters: null,
        averageRating: null,
        reportCount: 0,
        _count: { spotRatings: 0 },
        latestReportAt: null,
      });
      repository.listDiveLogsBySpot.mockResolvedValue({
        items: [],
        total: 0,
      });

      const result = await service.getById('uuid-spot-1');

      expect(result.averageVisibilityMeters).toBeNull();
      expect(result.averageRating).toBeNull();
      expect(result.reportCount).toBe(0);
      expect(result.ratingCount).toBe(0);
      expect(result.latestReportAt).toBeNull();
    });

    it('should throw SpotNotFoundOrDeletedError when spot not found', async () => {
      repository.findById.mockResolvedValue(null);

      await expect(service.getById('nonexistent')).rejects.toThrow(
        SpotNotFoundOrDeletedError,
      );
    });
  });

  describe('listDiveLogs', () => {
    it('returns paginated dive logs newest first', async () => {
      const firstDiveDate = new Date('2026-02-25T12:00:00.000Z');
      repository.findById.mockResolvedValue(mockSpotDetail);
      repository.listDiveLogsBySpot.mockResolvedValue({
        items: [
          {
            id: 'log-1',
            spotId: 'uuid-spot-1',
            authorId: 'uuid-user-1',
            visibilityMeters: 9,
            currentStrength: 3,
            notes: 'Very clear',
            observations: [],
            photoUrls: [],
            divedAt: firstDiveDate,
            isDeleted: false,
            deletedAt: null,
            createdAt: firstDiveDate,
            updatedAt: firstDiveDate,
            author: {
              alias: 'Diver',
              avatarUrl: null,
            },
          },
        ],
        total: 1,
      });

      const result = await service.listDiveLogs('uuid-spot-1', 1, 20);

      expect(repository.listDiveLogsBySpot).toHaveBeenCalledWith(
        'uuid-spot-1',
        0,
        20,
      );
      expect(result).toEqual({
        items: [
          {
            id: 'log-1',
            spotId: 'uuid-spot-1',
            authorId: 'uuid-user-1',
            authorAlias: 'Diver',
            authorAvatarUrl: null,
            visibilityMeters: 9,
            currentStrength: 3,
            notes: 'Very clear',
            photoUrls: [],
            notesPreview: 'Very clear',
            divedAt: firstDiveDate,
            createdAt: firstDiveDate,
            updatedAt: firstDiveDate,
          },
        ],
        page: 1,
        limit: 20,
        total: 1,
      });
    });
  });

  describe('create', () => {
    it('should create spot when nearby check passes and parking is valid', async () => {
      repository.findNearbyCenters.mockResolvedValue([]);
      repository.createSpot.mockResolvedValue(mockSpotDetail);

      const dto = {
        title: 'Spot',
        description: 'Desc',
        centerLat: 60,
        centerLon: 5,
        accessInfo: 'Access',
        parkingLocations: [
          { lat: 60.001, lon: 5.001, label: 'Parking A' },
          { lat: 60.002, lon: 5.002, label: 'Parking B' },
        ],
      };

      const result = await service.create(dto, actor);

      expect(repository.findNearbyCenters).toHaveBeenCalledWith(60, 5, 1000);
      expect(repository.createSpot).toHaveBeenCalledWith(
        {
          title: 'Spot',
          description: 'Desc',
          centerLat: 60,
          centerLon: 5,
          createdById: actor.userId,
          accessInfo: 'Access',
        },
        [
          { lat: 60.001, lon: 5.001, label: 'Parking A' },
          { lat: 60.002, lon: 5.002, label: 'Parking B' },
        ],
      );
      expect(result.id).toBe('uuid-spot-1');
    });

    it('should throw TooCloseToExistingSpotError when nearby center exists', async () => {
      repository.findNearbyCenters.mockResolvedValue([
        { id: 'uuid-existing', distanceMeters: 450 },
      ]);

      await expect(
        service.create(
          {
            title: 'Spot',
            centerLat: 60,
            centerLon: 5,
          },
          actor,
        ),
      ).rejects.toThrow(TooCloseToExistingSpotError);
    });

    it('should fail when parking has more than 5 entries', async () => {
      await expect(
        service.create(
          {
            title: 'Spot',
            centerLat: 60,
            centerLon: 5,
            parkingLocations: [
              { lat: 60.001, lon: 5.001 },
              { lat: 60.002, lon: 5.002 },
              { lat: 60.003, lon: 5.003 },
              { lat: 60.004, lon: 5.004 },
              { lat: 60.005, lon: 5.005 },
              { lat: 60.006, lon: 5.006 },
            ],
          },
          actor,
        ),
      ).rejects.toThrow(InvalidParkingLocationError);
    });

    it('should fail when parking is farther than 5000m from center', async () => {
      await expect(
        service.create(
          {
            title: 'Spot',
            centerLat: 60,
            centerLon: 5,
            parkingLocations: [{ lat: 61, lon: 5 }],
          },
          actor,
        ),
      ).rejects.toThrow(InvalidParkingLocationError);
    });

    it('should fail when parking locations are closer than 2m', async () => {
      await expect(
        service.create(
          {
            title: 'Spot',
            centerLat: 60,
            centerLon: 5,
            parkingLocations: [
              { lat: 60.001, lon: 5.001 },
              { lat: 60.00100001, lon: 5.00100001 },
            ],
          },
          actor,
        ),
      ).rejects.toThrow(DuplicateParkingLocationError);
    });
  });

  describe('update', () => {
    it('should allow owner to update', async () => {
      repository.findByIdAnyState.mockResolvedValue(mockSpotDetail);
      repository.updateSpot.mockResolvedValue({
        ...mockSpotDetail,
        title: 'Updated Spot',
      });

      const result = await service.update(
        'uuid-spot-1',
        { title: 'Updated Spot' },
        actor,
      );

      expect(repository.updateSpot).toHaveBeenCalledWith(
        'uuid-spot-1',
        { title: 'Updated Spot' },
        undefined,
      );
      expect(result.title).toBe('Updated Spot');
    });

    it('should allow moderator/admin to update', async () => {
      repository.findByIdAnyState.mockResolvedValue({
        ...mockSpotDetail,
        createdById: 'other-user',
      });
      repository.updateSpot.mockResolvedValue({
        ...mockSpotDetail,
        createdById: 'other-user',
        title: 'Updated by moderator',
      });

      const moderator: AuthenticatedUser = {
        userId: 'mod-user',
        externalId: 'ext-mod',
        role: 'moderator',
      };

      const result = await service.update(
        'uuid-spot-1',
        { title: 'Updated by moderator' },
        moderator,
      );

      expect(result.title).toBe('Updated by moderator');
    });

    it('should reject update when actor is not owner/moderator/admin', async () => {
      repository.findByIdAnyState.mockResolvedValue({
        ...mockSpotDetail,
        createdById: 'other-user',
      });

      await expect(
        service.update('uuid-spot-1', { title: 'Nope' }, actor),
      ).rejects.toThrow(ForbiddenError);
    });
  });

  describe('softDelete', () => {
    it('should allow owner to soft delete', async () => {
      repository.findByIdAnyState.mockResolvedValue(mockSpotDetail);

      await service.softDelete('uuid-spot-1', actor);

      expect(repository.softDeleteSpot).toHaveBeenCalledWith('uuid-spot-1');
    });

    it('should allow moderator/admin to soft delete', async () => {
      repository.findByIdAnyState.mockResolvedValue({
        ...mockSpotDetail,
        createdById: 'other-user',
      });

      const admin: AuthenticatedUser = {
        userId: 'admin-user',
        externalId: 'ext-admin',
        role: 'admin',
      };

      await service.softDelete('uuid-spot-1', admin);

      expect(repository.softDeleteSpot).toHaveBeenCalledWith('uuid-spot-1');
    });

    it('should reject soft delete when actor is not owner/moderator/admin', async () => {
      repository.findByIdAnyState.mockResolvedValue({
        ...mockSpotDetail,
        createdById: 'other-user',
      });

      await expect(service.softDelete('uuid-spot-1', actor)).rejects.toThrow(
        ForbiddenError,
      );
    });

    it('should be idempotent when spot is already soft deleted', async () => {
      repository.findByIdAnyState.mockResolvedValue({
        ...mockSpotDetail,
        isDeleted: true,
      });

      await service.softDelete('uuid-spot-1', actor);

      expect(repository.softDeleteSpot).not.toHaveBeenCalled();
    });
  });

  describe('createPhotoUploadUrl', () => {
    it('should return signed upload URL when spot exists and has capacity', async () => {
      repository.findByIdAnyState.mockResolvedValue({
        ...mockSpotDetail,
        photoUrls: ['https://example.com/1.jpg'],
      });
      spotPhotoStorage.createUploadUrl.mockResolvedValue({
        uploadUrl:
          'https://storage.example.com/upload/sign/spot-photos/spots/uuid-1/file.jpg?token=abc',
        publicUrl:
          'https://storage.example.com/object/public/spot-photos/spots/uuid-1/file.jpg',
        expiresAt: '2026-02-24T21:00:00.000Z',
      });

      const result = await service.createPhotoUploadUrl(
        'uuid-spot-1',
        'image/jpeg',
      );

      expect(spotPhotoStorage.createUploadUrl).toHaveBeenCalledWith(
        'uuid-spot-1',
        'image/jpeg',
      );
      expect(result.uploadUrl).toContain('/upload/sign/');
    });

    it('should throw SpotNotFoundOrDeletedError when spot does not exist', async () => {
      repository.findByIdAnyState.mockResolvedValue(null);

      await expect(
        service.createPhotoUploadUrl('missing-spot', 'image/jpeg'),
      ).rejects.toThrow(SpotNotFoundOrDeletedError);
    });

    it('should throw TooManyPhotosError when spot already has 5 photos', async () => {
      repository.findByIdAnyState.mockResolvedValue({
        ...mockSpotDetail,
        photoUrls: [
          'https://example.com/1.jpg',
          'https://example.com/2.jpg',
          'https://example.com/3.jpg',
          'https://example.com/4.jpg',
          'https://example.com/5.jpg',
        ],
      });

      await expect(
        service.createPhotoUploadUrl('uuid-spot-1', 'image/jpeg'),
      ).rejects.toThrow(TooManyPhotosError);
    });
  });

  describe('addPhoto', () => {
    it('should append photo URL when valid and under limit', async () => {
      repository.findByIdAnyState.mockResolvedValue({
        ...mockSpotDetail,
        photoUrls: ['https://example.com/1.jpg'],
      });
      repository.updatePhotoUrls.mockResolvedValue({
        ...mockSpotDetail,
        photoUrls: ['https://example.com/1.jpg', 'https://example.com/new.jpg'],
      });

      const result = await service.addPhoto(
        'uuid-spot-1',
        'https://example.com/new.jpg',
      );

      expect(repository.updatePhotoUrls).toHaveBeenCalledWith('uuid-spot-1', [
        'https://example.com/1.jpg',
        'https://example.com/new.jpg',
      ]);
      expect(result.photoUrls).toContain('https://example.com/new.jpg');
    });

    it('should throw InvalidPhotoUrlError for non-https URL', async () => {
      repository.findByIdAnyState.mockResolvedValue(mockSpotDetail);

      await expect(
        service.addPhoto('uuid-spot-1', 'http://example.com/unsafe.jpg'),
      ).rejects.toThrow(InvalidPhotoUrlError);
    });

    it('should throw DuplicatePhotoUrlError for case-insensitive duplicate URL', async () => {
      repository.findByIdAnyState.mockResolvedValue({
        ...mockSpotDetail,
        photoUrls: ['https://example.com/PHOTO.jpg'],
      });

      await expect(
        service.addPhoto('uuid-spot-1', 'https://example.com/photo.jpg'),
      ).rejects.toThrow(DuplicatePhotoUrlError);
    });

    it('should throw TooManyPhotosError when adding a 6th photo', async () => {
      repository.findByIdAnyState.mockResolvedValue({
        ...mockSpotDetail,
        photoUrls: [
          'https://example.com/1.jpg',
          'https://example.com/2.jpg',
          'https://example.com/3.jpg',
          'https://example.com/4.jpg',
          'https://example.com/5.jpg',
        ],
      });

      await expect(
        service.addPhoto('uuid-spot-1', 'https://example.com/6.jpg'),
      ).rejects.toThrow(TooManyPhotosError);
    });
  });

  describe('upsertRating', () => {
    it('upserts user rating and returns refreshed average', async () => {
      repository.findById.mockResolvedValue(mockSpotDetail);
      repository.upsertSpotRatingAndRefreshAverage.mockResolvedValue({
        rating: {
          id: 'rating-1',
          spotId: 'uuid-spot-1',
          userId: actor.userId,
          rating: 4,
          createdAt: new Date('2026-02-25T10:00:00.000Z'),
          updatedAt: new Date('2026-02-25T11:00:00.000Z'),
        },
        averageRating: 4.25,
        ratingCount: 8,
      });

      const result = await service.upsertRating(
        'uuid-spot-1',
        { rating: 4 },
        actor,
      );

      expect(repository.upsertSpotRatingAndRefreshAverage).toHaveBeenCalledWith(
        'uuid-spot-1',
        actor.userId,
        4,
      );
      expect(result).toEqual({
        id: 'rating-1',
        spotId: 'uuid-spot-1',
        userId: actor.userId,
        rating: 4,
        averageRating: 4.25,
        ratingCount: 8,
        createdAt: new Date('2026-02-25T10:00:00.000Z'),
        updatedAt: new Date('2026-02-25T11:00:00.000Z'),
      });
    });

    it('throws SpotNotFoundOrDeletedError when rating target spot does not exist', async () => {
      repository.findById.mockResolvedValue(null);

      await expect(
        service.upsertRating('missing-spot', { rating: 5 }, actor),
      ).rejects.toThrow(SpotNotFoundOrDeletedError);
    });
  });

  describe('UpdateSpotDto validation', () => {
    it('should reject center field updates through DTO whitelist', () => {
      const dto = plainToInstance(UpdateSpotDto, {
        title: 'valid title',
        centerLat: 60,
      });

      const errors = validateSync(dto, {
        whitelist: true,
        forbidNonWhitelisted: true,
      });

      expect(errors).toHaveLength(1);
      expect(errors[0]?.property).toBe('centerLat');
      expect(errors[0]?.constraints?.whitelistValidation).toBeDefined();
    });
  });
});
