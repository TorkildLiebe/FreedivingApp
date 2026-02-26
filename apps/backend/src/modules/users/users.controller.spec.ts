import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { AuthGuard } from '../../common/auth';
import { JwtVerifyService } from '../../common/auth/jwt-verify.service';

describe('UsersController', () => {
  let controller: UsersController;
  let usersService: jest.Mocked<UsersService>;

  const mockUser = {
    id: 'uuid-1',
    externalId: 'ext-1',
    email: 'test@example.com',
    alias: 'Test User',
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
      controllers: [UsersController],
      providers: [
        {
          provide: UsersService,
          useValue: {
            findById: jest.fn(),
            getMyStats: jest.fn(),
            getMyActivity: jest.fn(),
            getOrCreate: jest.fn(),
            addFavoriteSpot: jest.fn(),
            removeFavoriteSpot: jest.fn(),
          },
        },
        {
          provide: JwtVerifyService,
          useValue: { verify: jest.fn() },
        },
        AuthGuard,
      ],
    }).compile();

    controller = module.get<UsersController>(UsersController);
    usersService = module.get(UsersService);
  });

  describe('getMe', () => {
    it('should return current user profile', async () => {
      usersService.findById.mockResolvedValue(mockUser);

      const result = await controller.getMe({
        userId: 'uuid-1',
        externalId: 'ext-1',
        email: 'test@example.com',
        role: 'user',
      });

      expect(result).toEqual({
        id: 'uuid-1',
        email: 'test@example.com',
        alias: 'Test User',
        bio: null,
        avatarUrl: null,
        role: 'user',
        preferredLanguage: 'no',
        favoriteSpotIds: [],
        createdAt: mockUser.createdAt,
      });
    });

    it('should throw NotFoundException when user not found', async () => {
      usersService.findById.mockResolvedValue(null);

      await expect(
        controller.getMe({
          userId: 'nonexistent',
          externalId: 'ext-1',
          role: 'user',
        }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('getMyStats', () => {
    it('should return activity stats for current user', async () => {
      usersService.getMyStats.mockResolvedValue({
        totalReports: 6,
        uniqueSpotsDived: 3,
        favoritesCount: 4,
        memberSince: mockUser.createdAt,
      });

      const result = await controller.getMyStats({
        userId: 'uuid-1',
        externalId: 'ext-1',
        role: 'user',
      });

      expect(usersService.getMyStats).toHaveBeenCalledWith('uuid-1');
      expect(result).toEqual({
        totalReports: 6,
        uniqueSpotsDived: 3,
        favoritesCount: 4,
        memberSince: mockUser.createdAt,
      });
    });
  });

  describe('favorite endpoints', () => {
    it('should add favorite spot for current user', async () => {
      usersService.addFavoriteSpot.mockResolvedValue(['spot-1']);

      const result = await controller.addFavoriteSpot(
        {
          userId: 'uuid-1',
          externalId: 'ext-1',
          role: 'user',
        },
        '00000000-0000-0000-0000-000000000001',
      );

      expect(usersService.addFavoriteSpot).toHaveBeenCalledWith(
        'uuid-1',
        '00000000-0000-0000-0000-000000000001',
      );
      expect(result).toEqual({ favoriteSpotIds: ['spot-1'] });
    });

    it('should remove favorite spot for current user', async () => {
      usersService.removeFavoriteSpot.mockResolvedValue([]);

      const result = await controller.removeFavoriteSpot(
        {
          userId: 'uuid-1',
          externalId: 'ext-1',
          role: 'user',
        },
        '00000000-0000-0000-0000-000000000001',
      );

      expect(usersService.removeFavoriteSpot).toHaveBeenCalledWith(
        'uuid-1',
        '00000000-0000-0000-0000-000000000001',
      );
      expect(result).toEqual({ favoriteSpotIds: [] });
    });
  });

  describe('getMyActivity', () => {
    it('should return activity lists for current user', async () => {
      usersService.getMyActivity.mockResolvedValue({
        diveReports: [
          {
            id: 'log-1',
            spotId: 'spot-1',
            spotName: 'Oslofjord Wall',
            date: mockUser.createdAt,
            visibilityMeters: 11,
            currentStrength: 2,
            notesPreview: 'Great line and calm conditions.',
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
            latestVisibilityMeters: 9,
            latestReportDate: mockUser.createdAt,
          },
        ],
      });

      const result = await controller.getMyActivity({
        userId: 'uuid-1',
        externalId: 'ext-1',
        role: 'user',
      });

      expect(usersService.getMyActivity).toHaveBeenCalledWith('uuid-1');
      expect(result).toEqual({
        diveReports: [
          {
            id: 'log-1',
            spotId: 'spot-1',
            spotName: 'Oslofjord Wall',
            date: mockUser.createdAt,
            visibilityMeters: 11,
            currentStrength: 2,
            notesPreview: 'Great line and calm conditions.',
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
            latestVisibilityMeters: 9,
            latestReportDate: mockUser.createdAt,
          },
        ],
      });
    });
  });
});
