import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from './users.service';
import { UsersRepository } from './users.repository';

describe('UsersService', () => {
  let service: UsersService;
  let repository: jest.Mocked<UsersRepository>;

  const mockUser = {
    id: 'uuid-1',
    externalId: 'ext-1',
    email: 'test@example.com',
    displayName: null,
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
          },
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    repository = module.get(UsersRepository);
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
});
