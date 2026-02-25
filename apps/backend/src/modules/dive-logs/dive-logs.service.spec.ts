import { Test, TestingModule } from '@nestjs/testing';
import {
  InvalidDiveLogError,
  SpotNotFoundOrDeletedError,
} from '../../common/errors';
import type { AuthenticatedUser } from '../../common/auth';
import { DiveLogPhotoStorageService } from './dive-log-photo-storage.service';
import { DiveLogsRepository } from './dive-logs.repository';
import { DiveLogsService } from './dive-logs.service';

describe('DiveLogsService', () => {
  let service: DiveLogsService;
  let repository: jest.Mocked<DiveLogsRepository>;
  let photoStorage: jest.Mocked<DiveLogPhotoStorageService>;

  const actor: AuthenticatedUser = {
    userId: 'user-1',
    externalId: 'ext-1',
    role: 'user',
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DiveLogsService,
        {
          provide: DiveLogsRepository,
          useValue: {
            findActiveSpotById: jest.fn(),
            hasExistingRating: jest.fn(),
            createDiveLog: jest.fn(),
          },
        },
        {
          provide: DiveLogPhotoStorageService,
          useValue: {
            createUploadUrl: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<DiveLogsService>(DiveLogsService);
    repository = module.get(DiveLogsRepository);
    photoStorage = module.get(DiveLogPhotoStorageService);
  });

  it('creates dive log and sets shouldPromptRating=true when user has no rating', async () => {
    const now = new Date('2026-02-25T11:00:00.000Z');

    repository.findActiveSpotById.mockResolvedValue({ id: 'spot-1' });
    repository.hasExistingRating.mockResolvedValue(false);
    repository.createDiveLog.mockResolvedValue({
      id: 'log-1',
      spotId: 'spot-1',
      authorId: actor.userId,
      visibilityMeters: 9,
      currentStrength: 2,
      notes: 'Clear water',
      photoUrls: ['https://example.com/photo-1.jpg'],
      divedAt: now,
      isDeleted: false,
      deletedAt: null,
      createdAt: now,
      updatedAt: now,
      author: {
        alias: 'Diver',
        avatarUrl: null,
      },
    });

    const result = await service.create(
      {
        spotId: 'spot-1',
        visibilityMeters: 9,
        currentStrength: 2,
        divedAt: now.toISOString(),
        notes: ' Clear water ',
        photoUrls: ['https://example.com/photo-1.jpg'],
      },
      actor,
    );

    expect(repository.createDiveLog).toHaveBeenCalledWith(
      expect.objectContaining({
        spotId: 'spot-1',
        authorId: 'user-1',
        notes: 'Clear water',
      }),
    );
    expect(result.shouldPromptRating).toBe(true);
    expect(result.diveLog.id).toBe('log-1');
  });

  it('throws SpotNotFoundOrDeletedError when target spot is missing', async () => {
    repository.findActiveSpotById.mockResolvedValue(null);

    await expect(
      service.create(
        {
          spotId: 'missing-spot',
          visibilityMeters: 8,
          currentStrength: 3,
        },
        actor,
      ),
    ).rejects.toThrow(SpotNotFoundOrDeletedError);
  });

  it('throws InvalidDiveLogError when dive date is in the future', async () => {
    repository.findActiveSpotById.mockResolvedValue({ id: 'spot-1' });

    const futureDate = new Date(Date.now() + 60 * 60 * 1000).toISOString();

    await expect(
      service.create(
        {
          spotId: 'spot-1',
          visibilityMeters: 8,
          currentStrength: 3,
          divedAt: futureDate,
        },
        actor,
      ),
    ).rejects.toThrow(InvalidDiveLogError);
  });

  it('normalizes blank notes to null', async () => {
    const now = new Date();

    repository.findActiveSpotById.mockResolvedValue({ id: 'spot-1' });
    repository.hasExistingRating.mockResolvedValue(true);
    repository.createDiveLog.mockResolvedValue({
      id: 'log-1',
      spotId: 'spot-1',
      authorId: actor.userId,
      visibilityMeters: 8,
      currentStrength: 3,
      notes: null,
      photoUrls: [],
      divedAt: now,
      isDeleted: false,
      deletedAt: null,
      createdAt: now,
      updatedAt: now,
      author: {
        alias: null,
        avatarUrl: null,
      },
    });

    await service.create(
      {
        spotId: 'spot-1',
        visibilityMeters: 8,
        currentStrength: 3,
        notes: '    ',
      },
      actor,
    );

    expect(repository.createDiveLog).toHaveBeenCalledWith(
      expect.objectContaining({ notes: null }),
    );
  });

  it('creates signed upload URL for dive-log photos', async () => {
    repository.findActiveSpotById.mockResolvedValue({ id: 'spot-1' });
    photoStorage.createUploadUrl.mockResolvedValue({
      uploadUrl: 'https://storage.example.com/upload',
      publicUrl: 'https://storage.example.com/public/photo.jpg',
      expiresAt: '2026-02-25T12:00:00.000Z',
    });

    const result = await service.createPhotoUploadUrl({
      spotId: 'spot-1',
      mimeType: 'image/jpeg',
    });

    expect(photoStorage.createUploadUrl).toHaveBeenCalledWith(
      'spot-1',
      'image/jpeg',
    );
    expect(result.publicUrl).toContain('photo.jpg');
  });
});
