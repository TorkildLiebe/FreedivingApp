import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersRepository } from './users.repository';
import { SpotNotFoundOrDeletedError } from '../../common/errors';
import { UserAvatarStorageService } from './user-avatar-storage.service';

describe('UsersService', () => {
  let service: UsersService;
  let repository: jest.Mocked<UsersRepository>;
  let avatarStorage: jest.Mocked<UserAvatarStorageService>;

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
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: UsersRepository,
          useValue: {
            findByExternalId: jest.fn(),
            findById: jest.fn(),
            create: jest.fn(),
            findActiveSpotById: jest.fn(),
            addFavoriteSpot: jest.fn(),
            removeFavoriteSpot: jest.fn(),
            countDiveLogsByAuthor: jest.fn(),
            countUniqueSpotsDivedByAuthor: jest.fn(),
            updateProfile: jest.fn(),
            listMyDiveReports: jest.fn(),
            listCreatedSpotsByUser: jest.fn(),
            listFavoriteSpots: jest.fn(),
          },
        },
        {
          provide: UserAvatarStorageService,
          useValue: {
            createUploadUrl: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    repository = module.get(UsersRepository);
    avatarStorage = module.get(UserAvatarStorageService);
  });

  describe('getOrCreate', () => {
    it('should return existing user when found', async () => {
      repository.findByExternalId.mockResolvedValue(mockUser);

      const result = await service.getOrCreate('ext-1', 'test@example.com');

      expect(result).toEqual(mockUser);
      expect(repository.findByExternalId).toHaveBeenCalledWith('ext-1');
      expect(repository.create).not.toHaveBeenCalled();
    });

    it('should create new user when not found', async () => {
      repository.findByExternalId.mockResolvedValue(null);
      repository.create.mockResolvedValue(mockUser);

      const result = await service.getOrCreate('ext-1', 'test@example.com');

      expect(result).toEqual(mockUser);
      expect(repository.create).toHaveBeenCalledWith({
        externalId: 'ext-1',
        email: 'test@example.com',
      });
    });

    it('should create user without email when not provided', async () => {
      repository.findByExternalId.mockResolvedValue(null);
      repository.create.mockResolvedValue(mockUser);

      await service.getOrCreate('ext-1');

      expect(repository.create).toHaveBeenCalledWith({
        externalId: 'ext-1',
        email: undefined,
      });
    });
  });

  describe('findById', () => {
    it('should return user by id', async () => {
      repository.findById.mockResolvedValue(mockUser);

      const result = await service.findById('uuid-1');

      expect(result).toEqual(mockUser);
      expect(repository.findById).toHaveBeenCalledWith('uuid-1');
    });

    it('should return null when user not found', async () => {
      repository.findById.mockResolvedValue(null);

      const result = await service.findById('nonexistent');

      expect(result).toBeNull();
    });
  });

  describe('addFavoriteSpot', () => {
    it('adds favorite when user and spot exist', async () => {
      repository.findById.mockResolvedValue(mockUser);
      repository.findActiveSpotById.mockResolvedValue({ id: 'spot-1' });
      repository.addFavoriteSpot.mockResolvedValue(['spot-1']);

      const result = await service.addFavoriteSpot('uuid-1', 'spot-1');

      expect(repository.addFavoriteSpot).toHaveBeenCalledWith(
        'uuid-1',
        'spot-1',
        [],
      );
      expect(result).toEqual(['spot-1']);
    });

    it('throws when user is missing', async () => {
      repository.findById.mockResolvedValue(null);
      repository.findActiveSpotById.mockResolvedValue({ id: 'spot-1' });

      await expect(
        service.addFavoriteSpot('missing-user', 'spot-1'),
      ).rejects.toThrow(NotFoundException);
    });

    it('throws when spot is missing or deleted', async () => {
      repository.findById.mockResolvedValue(mockUser);
      repository.findActiveSpotById.mockResolvedValue(null);

      await expect(
        service.addFavoriteSpot('uuid-1', 'spot-missing'),
      ).rejects.toThrow(SpotNotFoundOrDeletedError);
    });
  });

  describe('removeFavoriteSpot', () => {
    it('removes favorite when user exists', async () => {
      repository.findById.mockResolvedValue({
        ...mockUser,
        favoriteSpotIds: ['spot-1'],
      });
      repository.removeFavoriteSpot.mockResolvedValue([]);

      const result = await service.removeFavoriteSpot('uuid-1', 'spot-1');

      expect(repository.removeFavoriteSpot).toHaveBeenCalledWith(
        'uuid-1',
        'spot-1',
        ['spot-1'],
      );
      expect(result).toEqual([]);
    });

    it('throws when user is missing', async () => {
      repository.findById.mockResolvedValue(null);

      await expect(
        service.removeFavoriteSpot('missing-user', 'spot-1'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('getMyStats', () => {
    it('returns stats for current user', async () => {
      repository.findById.mockResolvedValue({
        ...mockUser,
        favoriteSpotIds: ['spot-1', 'spot-2'],
      });
      repository.countDiveLogsByAuthor.mockResolvedValue(4);
      repository.countUniqueSpotsDivedByAuthor.mockResolvedValue(3);

      const result = await service.getMyStats('uuid-1');

      expect(repository.findById).toHaveBeenCalledWith('uuid-1');
      expect(repository.countDiveLogsByAuthor).toHaveBeenCalledWith('uuid-1');
      expect(repository.countUniqueSpotsDivedByAuthor).toHaveBeenCalledWith(
        'uuid-1',
      );
      expect(result).toEqual({
        totalReports: 4,
        uniqueSpotsDived: 3,
        favoritesCount: 2,
        memberSince: mockUser.createdAt,
      });
    });

    it('throws when user is missing', async () => {
      repository.findById.mockResolvedValue(null);

      await expect(service.getMyStats('missing-user')).rejects.toThrow(
        NotFoundException,
      );
      expect(repository.countDiveLogsByAuthor).not.toHaveBeenCalled();
      expect(repository.countUniqueSpotsDivedByAuthor).not.toHaveBeenCalled();
    });
  });

  describe('getMyActivity', () => {
    it('returns activity lists for current user', async () => {
      repository.findById.mockResolvedValue({
        ...mockUser,
        favoriteSpotIds: ['spot-2'],
      });
      repository.listMyDiveReports.mockResolvedValue([
        {
          id: 'log-1',
          spotId: 'spot-1',
          spotName: 'Oslofjord Wall',
          date: mockUser.createdAt,
          visibilityMeters: 10,
          currentStrength: 2,
          notesPreview: 'Clear and calm',
        },
      ]);
      repository.listCreatedSpotsByUser.mockResolvedValue([
        {
          id: 'spot-1',
          name: 'Oslofjord Wall',
          createdAt: mockUser.createdAt,
          reportCount: 3,
        },
      ]);
      repository.listFavoriteSpots.mockResolvedValue([
        {
          id: 'spot-2',
          spotId: 'spot-2',
          spotName: 'Nesodden Drop',
          latestVisibilityMeters: 8,
          latestReportDate: mockUser.createdAt,
        },
      ]);

      const result = await service.getMyActivity('uuid-1');

      expect(repository.findById).toHaveBeenCalledWith('uuid-1');
      expect(repository.listMyDiveReports).toHaveBeenCalledWith('uuid-1');
      expect(repository.listCreatedSpotsByUser).toHaveBeenCalledWith('uuid-1');
      expect(repository.listFavoriteSpots).toHaveBeenCalledWith(['spot-2']);
      expect(result).toEqual({
        diveReports: [
          {
            id: 'log-1',
            spotId: 'spot-1',
            spotName: 'Oslofjord Wall',
            date: mockUser.createdAt,
            visibilityMeters: 10,
            currentStrength: 2,
            notesPreview: 'Clear and calm',
          },
        ],
        createdSpots: [
          {
            id: 'spot-1',
            name: 'Oslofjord Wall',
            createdAt: mockUser.createdAt,
            reportCount: 3,
          },
        ],
        favorites: [
          {
            id: 'spot-2',
            spotId: 'spot-2',
            spotName: 'Nesodden Drop',
            latestVisibilityMeters: 8,
            latestReportDate: mockUser.createdAt,
          },
        ],
      });
    });

    it('throws when user is missing', async () => {
      repository.findById.mockResolvedValue(null);

      await expect(service.getMyActivity('missing-user')).rejects.toThrow(
        NotFoundException,
      );
      expect(repository.listMyDiveReports).not.toHaveBeenCalled();
      expect(repository.listCreatedSpotsByUser).not.toHaveBeenCalled();
      expect(repository.listFavoriteSpots).not.toHaveBeenCalled();
    });
  });

  describe('updateMe', () => {
    it('updates alias and bio for current user', async () => {
      repository.findById.mockResolvedValue({
        ...mockUser,
        bio: 'Old bio',
      });
      repository.updateProfile.mockResolvedValue({
        ...mockUser,
        alias: 'New Alias',
        bio: 'New bio',
      });

      const result = await service.updateMe('uuid-1', {
        alias: '  New Alias  ',
        bio: 'New bio',
      });

      expect(repository.updateProfile).toHaveBeenCalledWith('uuid-1', {
        alias: 'New Alias',
        bio: 'New bio',
        avatarUrl: undefined,
      });
      expect(result.alias).toBe('New Alias');
      expect(result.bio).toBe('New bio');
    });

    it('throws when alias is blank after trim', async () => {
      repository.findById.mockResolvedValue(mockUser);

      await expect(
        service.updateMe('uuid-1', { alias: '   ' }),
      ).rejects.toThrow(BadRequestException);
      expect(repository.updateProfile).not.toHaveBeenCalled();
    });

    it('throws when user is missing', async () => {
      repository.findById.mockResolvedValue(null);

      await expect(
        service.updateMe('missing-user', { alias: 'Diver' }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('createAvatarUploadUrl', () => {
    it('creates signed upload url for existing user', async () => {
      repository.findById.mockResolvedValue(mockUser);
      avatarStorage.createUploadUrl.mockResolvedValue({
        uploadUrl: 'https://upload.example.com/signed',
        publicUrl: 'https://cdn.example.com/avatar.jpg',
        expiresAt: '2026-03-01T00:00:00.000Z',
      });

      const result = await service.createAvatarUploadUrl('uuid-1', 'image/png');

      expect(avatarStorage.createUploadUrl).toHaveBeenCalledWith(
        'uuid-1',
        'image/png',
      );
      expect(result.publicUrl).toBe('https://cdn.example.com/avatar.jpg');
    });

    it('throws when user is missing', async () => {
      repository.findById.mockResolvedValue(null);

      await expect(
        service.createAvatarUploadUrl('missing-user', 'image/png'),
      ).rejects.toThrow(NotFoundException);
      expect(avatarStorage.createUploadUrl).not.toHaveBeenCalled();
    });
  });
});
