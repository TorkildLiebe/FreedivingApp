import { Test, TestingModule } from '@nestjs/testing';
import { SpotsController } from './spots.controller';
import { SpotsService } from './spots.service';
import { UsersService } from '../users/users.service';
import { JwtVerifyService } from '../../common/auth/jwt-verify.service';
import { AuthGuard, type AuthenticatedUser } from '../../common/auth';

describe('SpotsController', () => {
  let controller: SpotsController;
  let spotsService: jest.Mocked<SpotsService>;

  const mockUser: AuthenticatedUser = {
    userId: 'uuid-user-1',
    externalId: 'ext-1',
    role: 'user',
  };

  const mockListResponse = {
    items: [{ id: 'uuid-1', title: 'Spot', centerLat: 60, centerLon: 5 }],
    count: 1,
    truncated: false,
  };

  const mockDetailResponse = {
    id: 'uuid-1',
    title: 'Spot',
    description: 'Desc',
    centerLat: 60,
    centerLon: 5,
    createdById: 'uuid-user-1',
    creatorDisplayName: null,
    accessInfo: null,
    parkingLocations: [],
    photoUrls: [],
    isFavorite: false,
    averageVisibilityMeters: null,
    averageRating: null,
    reportCount: 0,
    ratingCount: 0,
    latestReportAt: null,
    diveLogs: [],
    shareUrl: null,
    shareableAccessInfo: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockUploadUrlResponse = {
    uploadUrl:
      'https://storage.example.com/upload/sign/spot-photos/spots/uuid-1/file.jpg?token=abc',
    publicUrl:
      'https://storage.example.com/object/public/spot-photos/spots/uuid-1/file.jpg',
    expiresAt: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SpotsController],
      providers: [
        {
          provide: SpotsService,
          useValue: {
            listByBBox: jest.fn(),
            getById: jest.fn(),
            listDiveLogs: jest.fn(),
            create: jest.fn(),
            update: jest.fn(),
            createPhotoUploadUrl: jest.fn(),
            addPhoto: jest.fn(),
            upsertRating: jest.fn(),
            softDelete: jest.fn(),
          },
        },
        {
          provide: UsersService,
          useValue: { findById: jest.fn(), getOrCreate: jest.fn() },
        },
        { provide: JwtVerifyService, useValue: { verify: jest.fn() } },
        AuthGuard,
      ],
    }).compile();

    controller = module.get<SpotsController>(SpotsController);
    spotsService = module.get(SpotsService);
  });

  describe('listByBBox', () => {
    it('should call service with query params and return result', async () => {
      spotsService.listByBBox.mockResolvedValue(mockListResponse);

      const query = { latMin: 59, latMax: 61, lonMin: 5, lonMax: 11 };
      const result = await controller.listByBBox(query);

      expect(spotsService.listByBBox).toHaveBeenCalledWith(
        59,
        61,
        5,
        11,
        undefined,
      );
      expect(result).toEqual(mockListResponse);
    });

    it('should pass maxResults to service', async () => {
      spotsService.listByBBox.mockResolvedValue(mockListResponse);

      const query = {
        latMin: 59,
        latMax: 61,
        lonMin: 5,
        lonMax: 11,
        maxResults: 50,
      };
      const result = await controller.listByBBox(query);

      expect(spotsService.listByBBox).toHaveBeenCalledWith(59, 61, 5, 11, 50);
      expect(result).toEqual(mockListResponse);
    });
  });

  describe('getById', () => {
    it('should call service with id and return result', async () => {
      spotsService.getById.mockResolvedValue(mockDetailResponse);

      const result = await controller.getById('uuid-1');

      expect(spotsService.getById).toHaveBeenCalledWith('uuid-1');
      expect(result).toEqual(mockDetailResponse);
    });
  });

  describe('listDiveLogs', () => {
    it('should call service with id and pagination query', async () => {
      const response = {
        items: [],
        page: 1,
        limit: 20,
        total: 0,
      };
      spotsService.listDiveLogs.mockResolvedValue(response);

      const result = await controller.listDiveLogs('uuid-1', {
        page: 1,
        limit: 20,
      });

      expect(spotsService.listDiveLogs).toHaveBeenCalledWith('uuid-1', 1, 20);
      expect(result).toEqual(response);
    });
  });

  describe('create', () => {
    it('should call service with dto and current user', async () => {
      spotsService.create.mockResolvedValue(mockDetailResponse);

      const dto = {
        title: 'Spot',
        centerLat: 60,
        centerLon: 5,
      };

      const result = await controller.create(dto, mockUser);

      expect(spotsService.create).toHaveBeenCalledWith(dto, mockUser);
      expect(result).toEqual(mockDetailResponse);
    });
  });

  describe('update', () => {
    it('should call service with id, dto and current user', async () => {
      spotsService.update.mockResolvedValue(mockDetailResponse);

      const dto = {
        title: 'Updated spot',
      };

      const result = await controller.update('uuid-1', dto, mockUser);

      expect(spotsService.update).toHaveBeenCalledWith('uuid-1', dto, mockUser);
      expect(result).toEqual(mockDetailResponse);
    });
  });

  describe('createPhotoUploadUrl', () => {
    it('should call service with spot id and mime type', async () => {
      spotsService.createPhotoUploadUrl.mockResolvedValue(
        mockUploadUrlResponse,
      );

      const result = await controller.createPhotoUploadUrl('uuid-1', {
        mimeType: 'image/jpeg',
      });

      expect(spotsService.createPhotoUploadUrl).toHaveBeenCalledWith(
        'uuid-1',
        'image/jpeg',
      );
      expect(result).toEqual(mockUploadUrlResponse);
    });
  });

  describe('addPhoto', () => {
    it('should call service with spot id and photo url', async () => {
      spotsService.addPhoto.mockResolvedValue(mockDetailResponse);

      const result = await controller.addPhoto('uuid-1', {
        url: 'https://example.com/photo.jpg',
      });

      expect(spotsService.addPhoto).toHaveBeenCalledWith(
        'uuid-1',
        'https://example.com/photo.jpg',
      );
      expect(result).toEqual(mockDetailResponse);
    });
  });

  describe('upsertRating', () => {
    it('should call service with spot id, rating dto and current user', async () => {
      const ratingResponse = {
        id: 'rating-1',
        spotId: 'uuid-1',
        userId: 'uuid-user-1',
        rating: 4,
        averageRating: 4.2,
        ratingCount: 5,
        createdAt: new Date('2026-02-25T10:00:00.000Z'),
        updatedAt: new Date('2026-02-25T11:00:00.000Z'),
      };
      spotsService.upsertRating.mockResolvedValue(ratingResponse);

      const result = await controller.upsertRating(
        'uuid-1',
        { rating: 4 },
        mockUser,
      );

      expect(spotsService.upsertRating).toHaveBeenCalledWith(
        'uuid-1',
        { rating: 4 },
        mockUser,
      );
      expect(result).toEqual(ratingResponse);
    });
  });

  describe('softDelete', () => {
    it('should call service with id and current user', async () => {
      spotsService.softDelete.mockResolvedValue(undefined);

      await controller.softDelete('uuid-1', mockUser);

      expect(spotsService.softDelete).toHaveBeenCalledWith('uuid-1', mockUser);
    });
  });
});
