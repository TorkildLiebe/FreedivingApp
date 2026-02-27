import { Test, TestingModule } from '@nestjs/testing';
import { UsersRepository } from './users.repository';
import { PrismaService } from '../../prisma/prisma.service';

describe('UsersRepository', () => {
  let repository: UsersRepository;
  let prisma: {
    user: Record<string, jest.Mock>;
    diveLog: Record<string, jest.Mock>;
    diveSpot: Record<string, jest.Mock>;
  };

  const mockUser = {
    id: 'uuid-1',
    externalId: 'ext-1',
    email: 'test@example.com',
    alias: null,
    bio: null,
    avatarUrl: null,
    role: 'user',
    preferredLanguage: 'no',
    favoriteSpotIds: [],
    isDeleted: false,
    deletedAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    prisma = {
      user: {
        findFirst: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
      diveLog: {
        count: jest.fn(),
        groupBy: jest.fn(),
        findMany: jest.fn(),
      },
      diveSpot: {
        findFirst: jest.fn(),
        findMany: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersRepository,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    repository = module.get<UsersRepository>(UsersRepository);
  });

  describe('findByExternalId', () => {
    it('should query by externalId with isDeleted=false', async () => {
      prisma.user.findFirst.mockResolvedValue(mockUser);

      const result = await repository.findByExternalId('ext-1');

      expect(result).toEqual(mockUser);
      expect(prisma.user.findFirst).toHaveBeenCalledWith({
        where: { externalId: 'ext-1', isDeleted: false },
      });
    });

    it('should return null when not found', async () => {
      prisma.user.findFirst.mockResolvedValue(null);

      const result = await repository.findByExternalId('nonexistent');

      expect(result).toBeNull();
    });
  });

  describe('findById', () => {
    it('should query by id with isDeleted=false', async () => {
      prisma.user.findFirst.mockResolvedValue(mockUser);

      const result = await repository.findById('uuid-1');

      expect(result).toEqual(mockUser);
      expect(prisma.user.findFirst).toHaveBeenCalledWith({
        where: { id: 'uuid-1', isDeleted: false },
      });
    });
  });

  describe('create', () => {
    it('should create user with defaults', async () => {
      prisma.user.create.mockResolvedValue(mockUser);

      const result = await repository.create({
        externalId: 'ext-1',
        email: 'test@example.com',
      });

      expect(result).toEqual(mockUser);
      expect(prisma.user.create).toHaveBeenCalledWith({
        data: {
          externalId: 'ext-1',
          email: 'test@example.com',
          role: 'user',
          preferredLanguage: 'no',
        },
      });
    });

    it('should create user without email', async () => {
      prisma.user.create.mockResolvedValue({ ...mockUser, email: null });

      await repository.create({ externalId: 'ext-2' });

      expect(prisma.user.create).toHaveBeenCalledWith({
        data: {
          externalId: 'ext-2',
          email: undefined,
          role: 'user',
          preferredLanguage: 'no',
        },
      });
    });
  });

  describe('findActiveSpotById', () => {
    it('queries non-deleted spot by id', async () => {
      prisma.diveSpot.findFirst.mockResolvedValue({ id: 'spot-1' });

      const result = await repository.findActiveSpotById('spot-1');

      expect(result).toEqual({ id: 'spot-1' });
      expect(prisma.diveSpot.findFirst).toHaveBeenCalledWith({
        where: { id: 'spot-1', isDeleted: false },
        select: { id: true },
      });
    });
  });

  describe('addFavoriteSpot', () => {
    it('adds spot when missing from favorites', async () => {
      prisma.user.update.mockResolvedValue({
        favoriteSpotIds: ['spot-1'],
      });

      const result = await repository.addFavoriteSpot('uuid-1', 'spot-1', []);

      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: 'uuid-1' },
        data: { favoriteSpotIds: ['spot-1'] },
        select: { favoriteSpotIds: true },
      });
      expect(result).toEqual(['spot-1']);
    });

    it('keeps favorites unique when spot already exists', async () => {
      prisma.user.update.mockResolvedValue({
        favoriteSpotIds: ['spot-1'],
      });

      const result = await repository.addFavoriteSpot('uuid-1', 'spot-1', [
        'spot-1',
      ]);

      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: 'uuid-1' },
        data: { favoriteSpotIds: ['spot-1'] },
        select: { favoriteSpotIds: true },
      });
      expect(result).toEqual(['spot-1']);
    });
  });

  describe('removeFavoriteSpot', () => {
    it('removes spot from favorites', async () => {
      prisma.user.update.mockResolvedValue({
        favoriteSpotIds: [],
      });

      const result = await repository.removeFavoriteSpot('uuid-1', 'spot-1', [
        'spot-1',
      ]);

      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: 'uuid-1' },
        data: { favoriteSpotIds: [] },
        select: { favoriteSpotIds: true },
      });
      expect(result).toEqual([]);
    });
  });

  describe('updateProfile', () => {
    it('updates alias, bio, avatar url, and preferred language', async () => {
      prisma.user.update.mockResolvedValue({
        ...mockUser,
        alias: 'New Alias',
        bio: 'New bio',
        avatarUrl: 'https://cdn.example.com/avatar.jpg',
        preferredLanguage: 'en',
      });

      const result = await repository.updateProfile('uuid-1', {
        alias: 'New Alias',
        bio: 'New bio',
        avatarUrl: 'https://cdn.example.com/avatar.jpg',
        preferredLanguage: 'en',
      });

      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: 'uuid-1' },
        data: {
          alias: 'New Alias',
          bio: 'New bio',
          avatarUrl: 'https://cdn.example.com/avatar.jpg',
          preferredLanguage: 'en',
        },
      });
      expect(result.alias).toBe('New Alias');
      expect(result.bio).toBe('New bio');
      expect(result.avatarUrl).toBe('https://cdn.example.com/avatar.jpg');
      expect(result.preferredLanguage).toBe('en');
    });

    it('supports partial updates with only preferred language', async () => {
      prisma.user.update.mockResolvedValue({
        ...mockUser,
        preferredLanguage: 'en',
      });

      await repository.updateProfile('uuid-1', {
        preferredLanguage: 'en',
      });

      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: 'uuid-1' },
        data: {
          preferredLanguage: 'en',
        },
      });
    });
  });

  describe('countDiveLogsByAuthor', () => {
    it('counts non-deleted dive logs by author', async () => {
      prisma.diveLog.count.mockResolvedValue(5);

      const result = await repository.countDiveLogsByAuthor('uuid-1');

      expect(prisma.diveLog.count).toHaveBeenCalledWith({
        where: {
          authorId: 'uuid-1',
          isDeleted: false,
        },
      });
      expect(result).toBe(5);
    });
  });

  describe('countUniqueSpotsDivedByAuthor', () => {
    it('counts unique spot ids in non-deleted dive logs by author', async () => {
      prisma.diveLog.groupBy.mockResolvedValue([
        { spotId: 'spot-1' },
        { spotId: 'spot-2' },
      ]);

      const result = await repository.countUniqueSpotsDivedByAuthor('uuid-1');

      expect(prisma.diveLog.groupBy).toHaveBeenCalledWith({
        by: ['spotId'],
        where: {
          authorId: 'uuid-1',
          isDeleted: false,
        },
      });
      expect(result).toBe(2);
    });
  });

  describe('listMyDiveReports', () => {
    it('returns mapped dive report summaries ordered by dive date', async () => {
      prisma.diveLog.findMany.mockResolvedValue([
        {
          id: 'log-1',
          spotId: 'spot-1',
          visibilityMeters: 12,
          currentStrength: 2,
          notes: '  Crystal clear and calm.  ',
          divedAt: new Date('2026-02-01T10:00:00.000Z'),
          spot: { title: 'Oslofjord Wall' },
        },
      ]);

      const result = await repository.listMyDiveReports('uuid-1');

      expect(prisma.diveLog.findMany).toHaveBeenCalledWith({
        where: {
          authorId: 'uuid-1',
          isDeleted: false,
          spot: {
            isDeleted: false,
          },
        },
        orderBy: [{ divedAt: 'desc' }, { createdAt: 'desc' }],
        select: {
          id: true,
          spotId: true,
          visibilityMeters: true,
          currentStrength: true,
          notes: true,
          divedAt: true,
          spot: {
            select: {
              title: true,
            },
          },
        },
        take: 50,
      });
      expect(result).toEqual([
        {
          id: 'log-1',
          spotId: 'spot-1',
          spotName: 'Oslofjord Wall',
          date: new Date('2026-02-01T10:00:00.000Z'),
          visibilityMeters: 12,
          currentStrength: 2,
          notesPreview: 'Crystal clear and calm.',
        },
      ]);
    });
  });

  describe('listCreatedSpotsByUser', () => {
    it('returns created spot summaries', async () => {
      prisma.diveSpot.findMany.mockResolvedValue([
        {
          id: 'spot-1',
          title: 'Oslofjord Wall',
          createdAt: new Date('2026-01-01T08:00:00.000Z'),
          reportCount: 7,
        },
      ]);

      const result = await repository.listCreatedSpotsByUser('uuid-1');

      expect(prisma.diveSpot.findMany).toHaveBeenCalledWith({
        where: {
          createdById: 'uuid-1',
          isDeleted: false,
        },
        orderBy: [{ createdAt: 'desc' }],
        select: {
          id: true,
          title: true,
          createdAt: true,
          reportCount: true,
        },
        take: 50,
      });
      expect(result).toEqual([
        {
          id: 'spot-1',
          name: 'Oslofjord Wall',
          createdAt: new Date('2026-01-01T08:00:00.000Z'),
          reportCount: 7,
        },
      ]);
    });
  });

  describe('listFavoriteSpots', () => {
    it('returns favorite spots in the same order as favoriteSpotIds', async () => {
      prisma.diveSpot.findMany.mockResolvedValue([
        {
          id: 'spot-2',
          title: 'Nesodden Drop',
          diveLogs: [
            {
              visibilityMeters: 9,
              divedAt: new Date('2026-02-02T09:00:00.000Z'),
            },
          ],
        },
        {
          id: 'spot-1',
          title: 'Oslofjord Wall',
          diveLogs: [],
        },
      ]);

      const result = await repository.listFavoriteSpots(['spot-1', 'spot-2']);

      expect(prisma.diveSpot.findMany).toHaveBeenCalledWith({
        where: {
          id: {
            in: ['spot-1', 'spot-2'],
          },
          isDeleted: false,
        },
        select: {
          id: true,
          title: true,
          diveLogs: {
            where: { isDeleted: false },
            orderBy: [{ divedAt: 'desc' }],
            take: 1,
            select: {
              visibilityMeters: true,
              divedAt: true,
            },
          },
        },
      });
      expect(result).toEqual([
        {
          id: 'spot-1',
          spotId: 'spot-1',
          spotName: 'Oslofjord Wall',
          latestVisibilityMeters: null,
          latestReportDate: null,
        },
        {
          id: 'spot-2',
          spotId: 'spot-2',
          spotName: 'Nesodden Drop',
          latestVisibilityMeters: 9,
          latestReportDate: new Date('2026-02-02T09:00:00.000Z'),
        },
      ]);
    });

    it('returns empty array when no favorites exist', async () => {
      const result = await repository.listFavoriteSpots([]);

      expect(prisma.diveSpot.findMany).not.toHaveBeenCalled();
      expect(result).toEqual([]);
    });
  });
});
