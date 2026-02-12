import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../../prisma/prisma.service';
import { SpotsRepository } from './spots.repository';

describe('SpotsRepository', () => {
  let repository: SpotsRepository;
  let prisma: { diveSpot: Record<string, jest.Mock> };

  beforeEach(async () => {
    prisma = {
      diveSpot: {
        findMany: jest.fn(),
        findFirst: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SpotsRepository,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    repository = module.get<SpotsRepository>(SpotsRepository);
  });

  describe('listByBBox', () => {
    it('should query with correct where clause and isDeleted=false', async () => {
      prisma.diveSpot.findMany.mockResolvedValue([]);

      await repository.listByBBox(59, 61, 5, 11, 300);

      expect(prisma.diveSpot.findMany).toHaveBeenCalledWith({
        where: {
          isDeleted: false,
          centerLat: { gte: 59, lte: 61 },
          centerLon: { gte: 5, lte: 11 },
        },
        select: { id: true, title: true, centerLat: true, centerLon: true },
        take: 301,
      });
    });

    it('should pass limit + 1 as take parameter', async () => {
      prisma.diveSpot.findMany.mockResolvedValue([]);

      await repository.listByBBox(0, 1, 0, 1, 50);

      expect(prisma.diveSpot.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ take: 51 }),
      );
    });

    it('should return results from prisma', async () => {
      const mockSpots = [
        { id: 'uuid-1', title: 'Spot 1', centerLat: 60.0, centerLon: 5.0 },
      ];
      prisma.diveSpot.findMany.mockResolvedValue(mockSpots);

      const result = await repository.listByBBox(59, 61, 4, 6, 300);

      expect(result).toEqual(mockSpots);
    });
  });

  describe('findById', () => {
    it('should query by id with isDeleted=false', async () => {
      prisma.diveSpot.findFirst.mockResolvedValue(null);

      await repository.findById('uuid-1');

      expect(prisma.diveSpot.findFirst).toHaveBeenCalledWith({
        where: { id: 'uuid-1', isDeleted: false },
        include: {
          parkingLocations: true,
          createdBy: { select: { displayName: true } },
        },
      });
    });

    it('should return spot with parking locations', async () => {
      const mockSpot = {
        id: 'uuid-1',
        title: 'Test Spot',
        parkingLocations: [{ id: 'p-1', lat: 60.0, lon: 5.0, label: null }],
      };
      prisma.diveSpot.findFirst.mockResolvedValue(mockSpot);

      const result = await repository.findById('uuid-1');

      expect(result).toEqual(mockSpot);
    });

    it('should return null when not found', async () => {
      prisma.diveSpot.findFirst.mockResolvedValue(null);

      const result = await repository.findById('nonexistent');

      expect(result).toBeNull();
    });
  });
});
