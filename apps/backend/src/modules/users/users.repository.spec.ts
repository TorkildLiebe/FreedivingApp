import { Test, TestingModule } from '@nestjs/testing';
import { UsersRepository } from './users.repository';
import { PrismaService } from '../../prisma/prisma.service';

describe('UsersRepository', () => {
  let repository: UsersRepository;
  let prisma: { user: Record<string, jest.Mock> };

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
});
