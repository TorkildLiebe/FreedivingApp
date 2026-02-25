import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../../prisma/prisma.service';
import { DiveLogsRepository } from './dive-logs.repository';

describe('DiveLogsRepository', () => {
  let repository: DiveLogsRepository;
  let prisma: {
    diveSpot: Record<string, jest.Mock>;
    spotRating: Record<string, jest.Mock>;
    diveLog: Record<string, jest.Mock>;
    $transaction: jest.Mock;
  };

  beforeEach(async () => {
    prisma = {
      diveSpot: {
        findFirst: jest.fn(),
      },
      spotRating: {
        findFirst: jest.fn(),
      },
      diveLog: {
        create: jest.fn(),
        aggregate: jest.fn(),
      },
      $transaction: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DiveLogsRepository,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    repository = module.get<DiveLogsRepository>(DiveLogsRepository);
  });

  it('finds active spot by id', async () => {
    prisma.diveSpot.findFirst.mockResolvedValue({ id: 'spot-1' });

    const result = await repository.findActiveSpotById('spot-1');

    expect(prisma.diveSpot.findFirst).toHaveBeenCalledWith({
      where: { id: 'spot-1', isDeleted: false },
      select: { id: true },
    });
    expect(result).toEqual({ id: 'spot-1' });
  });

  it('returns true when user already rated spot', async () => {
    prisma.spotRating.findFirst.mockResolvedValue({ id: 'rating-1' });

    await expect(
      repository.hasExistingRating('user-1', 'spot-1'),
    ).resolves.toBe(true);
  });

  it('creates dive log and updates spot summary fields in one transaction', async () => {
    const createdAt = new Date('2026-02-25T11:00:00.000Z');
    const divedAt = new Date('2026-02-25T10:00:00.000Z');

    const tx = {
      diveLog: {
        create: jest.fn().mockResolvedValue({
          id: 'log-1',
          spotId: 'spot-1',
          authorId: 'user-1',
          visibilityMeters: 8,
          currentStrength: 3,
          notes: null,
          photoUrls: [],
          divedAt,
          createdAt,
          updatedAt: createdAt,
          author: {
            alias: 'Diver',
            avatarUrl: null,
          },
        }),
        aggregate: jest.fn().mockResolvedValue({
          _avg: { visibilityMeters: 8.5 },
          _count: { _all: 4 },
          _max: { divedAt },
        }),
      },
      diveSpot: {
        update: jest.fn().mockResolvedValue({ id: 'spot-1' }),
      },
    };

    prisma.$transaction.mockImplementation(
      (callback: (trx: typeof tx) => unknown) => callback(tx),
    );

    const result = await repository.createDiveLog({
      spotId: 'spot-1',
      authorId: 'user-1',
      visibilityMeters: 8,
      currentStrength: 3,
      notes: null,
      photoUrls: [],
      divedAt,
    });

    expect(tx.diveLog.create).toHaveBeenCalledWith({
      data: {
        spotId: 'spot-1',
        authorId: 'user-1',
        visibilityMeters: 8,
        currentStrength: 3,
        notes: null,
        photoUrls: [],
        divedAt,
      },
      include: {
        author: {
          select: {
            alias: true,
            avatarUrl: true,
          },
        },
      },
    });
    expect(tx.diveLog.aggregate).toHaveBeenCalledWith({
      where: {
        spotId: 'spot-1',
        isDeleted: false,
      },
      _avg: { visibilityMeters: true },
      _count: { _all: true },
      _max: { divedAt: true },
    });
    expect(tx.diveSpot.update).toHaveBeenCalledWith({
      where: { id: 'spot-1' },
      data: {
        averageVisibilityMeters: 8.5,
        reportCount: 4,
        latestReportAt: divedAt,
      },
    });
    expect(result.id).toBe('log-1');
  });
});
