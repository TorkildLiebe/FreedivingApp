import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../../prisma/prisma.service';
import { SpotsRepository } from './spots.repository';

describe('SpotsRepository', () => {
  let repository: SpotsRepository;
  let prisma: {
    diveSpot: Record<string, jest.Mock>;
    parkingLocation: Record<string, jest.Mock>;
    diveLog: Record<string, jest.Mock>;
    spotRating: Record<string, jest.Mock>;
    $queryRaw: jest.Mock;
    $transaction: jest.Mock;
  };

  beforeEach(async () => {
    const tx = {
      diveSpot: {
        create: jest.fn(),
        update: jest.fn(),
        findFirst: jest.fn(),
      },
      parkingLocation: {
        createMany: jest.fn(),
        deleteMany: jest.fn(),
      },
    };

    prisma = {
      diveSpot: {
        findMany: jest.fn(),
        findFirst: jest.fn(),
        updateMany: jest.fn(),
      },
      parkingLocation: {
        createMany: jest.fn(),
        deleteMany: jest.fn(),
      },
      diveLog: {
        findMany: jest.fn(),
        count: jest.fn(),
      },
      spotRating: {
        upsert: jest.fn(),
        aggregate: jest.fn(),
      },
      $queryRaw: jest.fn(),
      $transaction: jest.fn((callback: (trx: typeof tx) => unknown) =>
        callback(tx),
      ),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SpotsRepository,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    repository = module.get<SpotsRepository>(SpotsRepository);
  });

  describe('listSummaries', () => {
    it('should list all active spot summaries ordered for stable responses', async () => {
      prisma.diveSpot.findMany.mockResolvedValue([]);

      await repository.listSummaries();

      expect(prisma.diveSpot.findMany).toHaveBeenCalledWith({
        where: {
          isDeleted: false,
        },
        select: { id: true, title: true, centerLat: true, centerLon: true },
        orderBy: [{ title: 'asc' }, { id: 'asc' }],
      });
    });
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
    it('should query by id with isDeleted=false and alias select', async () => {
      prisma.diveSpot.findFirst.mockResolvedValue(null);

      await repository.findById('uuid-1');

      expect(prisma.diveSpot.findFirst).toHaveBeenCalledWith({
        where: { id: 'uuid-1', isDeleted: false },
        include: {
          parkingLocations: true,
          createdBy: { select: { alias: true } },
          _count: {
            select: {
              spotRatings: true,
            },
          },
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

  describe('findByIdAnyState', () => {
    it('should query by id without isDeleted filter', async () => {
      prisma.diveSpot.findFirst.mockResolvedValue(null);

      await repository.findByIdAnyState('uuid-1');

      expect(prisma.diveSpot.findFirst).toHaveBeenCalledWith({
        where: { id: 'uuid-1' },
        include: {
          parkingLocations: true,
          createdBy: { select: { alias: true } },
          _count: {
            select: {
              spotRatings: true,
            },
          },
        },
      });
    });
  });

  describe('findNearbyCenters', () => {
    it('should execute raw query and return nearby centers', async () => {
      const mockRows = [{ id: 'uuid-1', distanceMeters: 230 }];
      prisma.$queryRaw.mockResolvedValue(mockRows);

      const result = await repository.findNearbyCenters(60, 5, 1000);

      expect(prisma.$queryRaw).toHaveBeenCalled();
      expect(result).toEqual(mockRows);
    });
  });

  describe('createSpot', () => {
    it('should create spot and parking locations in one transaction', async () => {
      const txDiveSpot = {
        create: jest.fn().mockResolvedValue({ id: 'uuid-1' }),
        update: jest.fn(),
        findFirst: jest.fn().mockResolvedValue({ id: 'uuid-1' }),
      };
      const txParking = {
        createMany: jest.fn().mockResolvedValue({ count: 1 }),
        deleteMany: jest.fn(),
      };

      prisma.$transaction.mockImplementation(
        (
          callback: (trx: {
            diveSpot: typeof txDiveSpot;
            parkingLocation: typeof txParking;
          }) => unknown,
        ) => callback({ diveSpot: txDiveSpot, parkingLocation: txParking }),
      );

      const result = await repository.createSpot(
        {
          title: 'Spot',
          description: 'Desc',
          centerLat: 60,
          centerLon: 5,
          createdById: 'user-1',
          accessInfo: null,
        },
        [{ lat: 60.1, lon: 5.1, label: 'Main' }],
      );

      expect(txDiveSpot.create).toHaveBeenCalledWith({
        data: {
          title: 'Spot',
          description: 'Desc',
          centerLat: 60,
          centerLon: 5,
          createdById: 'user-1',
          accessInfo: null,
        },
      });
      expect(txParking.createMany).toHaveBeenCalledWith({
        data: [{ lat: 60.1, lon: 5.1, label: 'Main', spotId: 'uuid-1' }],
      });
      expect(result).toEqual({ id: 'uuid-1' });
    });
  });

  describe('updateSpot', () => {
    it('should update spot and replace parking locations when provided', async () => {
      const txDiveSpot = {
        create: jest.fn(),
        update: jest.fn().mockResolvedValue({ id: 'uuid-1' }),
        findFirst: jest.fn().mockResolvedValue({ id: 'uuid-1' }),
      };
      const txParking = {
        createMany: jest.fn().mockResolvedValue({ count: 2 }),
        deleteMany: jest.fn().mockResolvedValue({ count: 2 }),
      };

      prisma.$transaction.mockImplementation(
        (
          callback: (trx: {
            diveSpot: typeof txDiveSpot;
            parkingLocation: typeof txParking;
          }) => unknown,
        ) => callback({ diveSpot: txDiveSpot, parkingLocation: txParking }),
      );

      await repository.updateSpot('uuid-1', { title: 'Updated' }, [
        { lat: 60.2, lon: 5.2, label: null },
      ]);

      expect(txDiveSpot.update).toHaveBeenCalledWith({
        where: { id: 'uuid-1' },
        data: { title: 'Updated' },
      });
      expect(txParking.deleteMany).toHaveBeenCalledWith({
        where: { spotId: 'uuid-1' },
      });
      expect(txParking.createMany).toHaveBeenCalledWith({
        data: [{ lat: 60.2, lon: 5.2, label: null, spotId: 'uuid-1' }],
      });
    });

    it('should update only spot fields when parking is omitted', async () => {
      const txDiveSpot = {
        create: jest.fn(),
        update: jest.fn().mockResolvedValue({ id: 'uuid-1' }),
        findFirst: jest.fn().mockResolvedValue({ id: 'uuid-1' }),
      };
      const txParking = {
        createMany: jest.fn(),
        deleteMany: jest.fn(),
      };

      prisma.$transaction.mockImplementation(
        (
          callback: (trx: {
            diveSpot: typeof txDiveSpot;
            parkingLocation: typeof txParking;
          }) => unknown,
        ) => callback({ diveSpot: txDiveSpot, parkingLocation: txParking }),
      );

      await repository.updateSpot('uuid-1', { description: 'Updated' });

      expect(txDiveSpot.update).toHaveBeenCalledWith({
        where: { id: 'uuid-1' },
        data: { description: 'Updated' },
      });
      expect(txParking.deleteMany).not.toHaveBeenCalled();
      expect(txParking.createMany).not.toHaveBeenCalled();
    });
  });

  describe('softDeleteSpot', () => {
    it('should update only non-deleted spots and set deletedAt', async () => {
      prisma.diveSpot.updateMany.mockResolvedValue({ count: 1 });

      await repository.softDeleteSpot('uuid-1');

      expect(prisma.diveSpot.updateMany).toHaveBeenCalledWith({
        where: { id: 'uuid-1', isDeleted: false },
        data: {
          isDeleted: true,
          deletedAt: expect.any(Date) as unknown as Date,
        },
      });
    });
  });

  describe('listDiveLogsBySpot', () => {
    it('queries paginated dive logs and total count in one transaction', async () => {
      const items = [
        {
          id: 'log-1',
          spotId: 'spot-1',
          visibilityMeters: 8,
          currentStrength: 3,
          notes: 'Clear',
          divedAt: new Date('2026-02-25T10:00:00.000Z'),
          author: {
            alias: 'Diver',
            avatarUrl: null,
          },
        },
      ];
      prisma.$transaction.mockResolvedValueOnce([items, 1]);

      const result = await repository.listDiveLogsBySpot('spot-1', 20, 10);

      expect(prisma.$transaction).toHaveBeenCalled();
      expect(result).toEqual({
        items,
        total: 1,
      });
    });
  });

  describe('upsertSpotRatingAndRefreshAverage', () => {
    it('upserts user rating, refreshes aggregate, and updates spot average', async () => {
      const tx = {
        diveSpot: {
          update: jest.fn().mockResolvedValue({ id: 'spot-1' }),
        },
        spotRating: {
          upsert: jest.fn().mockResolvedValue({
            id: 'rating-1',
            spotId: 'spot-1',
            userId: 'user-1',
            rating: 5,
            createdAt: new Date('2026-02-25T10:00:00.000Z'),
            updatedAt: new Date('2026-02-25T11:00:00.000Z'),
          }),
          aggregate: jest.fn().mockResolvedValue({
            _avg: { rating: 4.2 },
            _count: { _all: 10 },
          }),
        },
      };

      prisma.$transaction.mockImplementation(
        (callback: (trx: typeof tx) => unknown) => callback(tx),
      );

      const result = await repository.upsertSpotRatingAndRefreshAverage(
        'spot-1',
        'user-1',
        5,
      );

      expect(tx.spotRating.upsert).toHaveBeenCalledWith({
        where: {
          userId_spotId: {
            userId: 'user-1',
            spotId: 'spot-1',
          },
        },
        create: {
          spotId: 'spot-1',
          userId: 'user-1',
          rating: 5,
        },
        update: {
          rating: 5,
        },
      });
      expect(tx.spotRating.aggregate).toHaveBeenCalledWith({
        where: { spotId: 'spot-1' },
        _avg: { rating: true },
        _count: { _all: true },
      });
      expect(tx.diveSpot.update).toHaveBeenCalledWith({
        where: { id: 'spot-1' },
        data: { averageRating: 4.2 },
      });
      expect(result).toEqual({
        rating: {
          id: 'rating-1',
          spotId: 'spot-1',
          userId: 'user-1',
          rating: 5,
          createdAt: new Date('2026-02-25T10:00:00.000Z'),
          updatedAt: new Date('2026-02-25T11:00:00.000Z'),
        },
        averageRating: 4.2,
        ratingCount: 10,
      });
    });
  });
});
