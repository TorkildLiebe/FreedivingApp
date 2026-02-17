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
    shareUrl: null,
    shareableAccessInfo: null,
    createdAt: new Date(),
    updatedAt: new Date(),
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
            create: jest.fn(),
            update: jest.fn(),
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

  describe('softDelete', () => {
    it('should call service with id and current user', async () => {
      spotsService.softDelete.mockResolvedValue(undefined);

      await controller.softDelete('uuid-1', mockUser);

      expect(spotsService.softDelete).toHaveBeenCalledWith('uuid-1', mockUser);
    });
  });
});
