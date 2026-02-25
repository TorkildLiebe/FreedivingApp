import { Test, TestingModule } from '@nestjs/testing';
import { AuthGuard, type AuthenticatedUser } from '../../common/auth';
import { JwtVerifyService } from '../../common/auth/jwt-verify.service';
import { UsersService } from '../users/users.service';
import { DiveLogsController } from './dive-logs.controller';
import { DiveLogsService } from './dive-logs.service';

describe('DiveLogsController', () => {
  let controller: DiveLogsController;
  let diveLogsService: jest.Mocked<DiveLogsService>;

  const mockUser: AuthenticatedUser = {
    userId: 'user-1',
    externalId: 'ext-1',
    role: 'user',
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [DiveLogsController],
      providers: [
        {
          provide: DiveLogsService,
          useValue: {
            create: jest.fn(),
            createPhotoUploadUrl: jest.fn(),
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

    controller = module.get<DiveLogsController>(DiveLogsController);
    diveLogsService = module.get(DiveLogsService);
  });

  it('submits dive log creation through service', async () => {
    const response = {
      diveLog: {
        id: 'log-1',
        spotId: 'spot-1',
        authorId: mockUser.userId,
        authorAlias: 'Diver',
        authorAvatarUrl: null,
        visibilityMeters: 8,
        currentStrength: 3,
        notes: null,
        photoUrls: [],
        divedAt: new Date('2026-02-25T11:00:00.000Z'),
        createdAt: new Date('2026-02-25T11:00:00.000Z'),
        updatedAt: new Date('2026-02-25T11:00:00.000Z'),
      },
      shouldPromptRating: true,
    };
    diveLogsService.create.mockResolvedValue(response);

    const dto = {
      spotId: 'spot-1',
      visibilityMeters: 8,
      currentStrength: 3,
      notes: 'Nice dive',
      photoUrls: [],
    };

    const result = await controller.create(dto, mockUser);

    expect(diveLogsService.create).toHaveBeenCalledWith(dto, mockUser);
    expect(result).toEqual(response);
  });

  it('creates signed upload URL through service', async () => {
    const uploadResponse = {
      uploadUrl: 'https://storage.example.com/upload',
      publicUrl: 'https://storage.example.com/public/photo.jpg',
      expiresAt: '2026-02-25T12:00:00.000Z',
    };
    diveLogsService.createPhotoUploadUrl.mockResolvedValue(uploadResponse);

    const result = await controller.createPhotoUploadUrl({
      spotId: 'spot-1',
      mimeType: 'image/jpeg',
    });

    expect(diveLogsService.createPhotoUploadUrl).toHaveBeenCalledWith({
      spotId: 'spot-1',
      mimeType: 'image/jpeg',
    });
    expect(result).toEqual(uploadResponse);
  });
});
