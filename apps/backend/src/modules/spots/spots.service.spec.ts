import { Test, TestingModule } from '@nestjs/testing';
import { SpotsService } from './spots.service';
import { SpotsRepository } from './spots.repository';
import {
  InvalidBBoxError,
  SpotNotFoundOrDeletedError,
} from '../../common/errors';

describe('SpotsService', () => {
  let service: SpotsService;
  let repository: jest.Mocked<SpotsRepository>;

  const mockSpotDetail = {
    id: 'uuid-spot-1',
    title: 'Test Dive Spot',
    description: 'A great dive spot',
    centerLat: 60.123456,
    centerLon: 5.123456,
    createdById: 'uuid-user-1',
    accessInfo: 'Park at the pier',
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
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SpotsService,
        {
          provide: SpotsRepository,
          useValue: {
            listByBBox: jest.fn(),
            findById: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<SpotsService>(SpotsService);
    repository = module.get(SpotsRepository);
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

      const result = await service.getById('uuid-spot-1');

      expect(result).toEqual({
        id: 'uuid-spot-1',
        title: 'Test Dive Spot',
        description: 'A great dive spot',
        centerLat: 60.123456,
        centerLon: 5.123456,
        createdById: 'uuid-user-1',
        accessInfo: 'Park at the pier',
        parkingLocations: [
          {
            id: 'uuid-parking-1',
            lat: 60.124,
            lon: 5.124,
            label: 'Main parking',
          },
        ],
        shareUrl: null,
        shareableAccessInfo: null,
        createdAt: new Date('2025-01-01'),
        updatedAt: new Date('2025-01-02'),
      });
    });

    it('should throw SpotNotFoundOrDeletedError when spot not found', async () => {
      repository.findById.mockResolvedValue(null);

      await expect(service.getById('nonexistent')).rejects.toThrow(
        SpotNotFoundOrDeletedError,
      );
    });
  });
});
