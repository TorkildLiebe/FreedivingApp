# Backend Testing Patterns

Complete testing guide for NestJS backend with Jest.

## Test Structure

```
apps/backend/src/modules/spots/
├── spots.controller.spec.ts
├── spots.service.spec.ts
├── spots.repository.spec.ts
└── __tests__/
    ├── integration/
    │   └── spots.integration.spec.ts
    └── fixtures/
        └── spots.fixtures.ts
```

## Service Tests

### Basic Service Test

```typescript
// apps/backend/src/modules/spots/spots.service.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { SpotsService } from './spots.service';
import { SpotsRepository } from './spots.repository';
import { SpotNotFoundError, SpotTooCloseError } from '@/src/common/errors/domain-errors';

describe('SpotsService', () => {
  let service: SpotsService;
  let repository: jest.Mocked<SpotsRepository>;

  beforeEach(async () => {
    const mockRepository = {
      findById: jest.fn(),
      findAll: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      softDelete: jest.fn(),
      findNearbySpots: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SpotsService,
        {
          provide: SpotsRepository,
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<SpotsService>(SpotsService);
    repository = module.get(SpotsRepository);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('findById', () => {
    it('should return spot when found', async () => {
      const mockSpot = {
        id: 'spot-123',
        title: 'Test Spot',
        isDeleted: false,
      };
      repository.findById.mockResolvedValue(mockSpot);

      const result = await service.findById('spot-123');

      expect(result).toEqual(mockSpot);
      expect(repository.findById).toHaveBeenCalledWith('spot-123');
    });

    it('should throw SpotNotFoundError when spot not found', async () => {
      repository.findById.mockResolvedValue(null);

      await expect(service.findById('invalid-id'))
        .rejects.toThrow(SpotNotFoundError);
    });

    it('should throw SpotNotFoundError when spot is deleted', async () => {
      repository.findById.mockResolvedValue({
        id: 'spot-123',
        isDeleted: true,
      });

      await expect(service.findById('spot-123'))
        .rejects.toThrow(SpotNotFoundError);
    });
  });

  describe('create', () => {
    it('should create spot when no nearby spots exist', async () => {
      const dto = {
        title: 'New Spot',
        latitude: 60.0,
        longitude: 10.0,
      };
      const userId = 'user-123';

      repository.findNearbySpots.mockResolvedValue([]);
      repository.create.mockResolvedValue({
        id: 'spot-456',
        ...dto,
        createdBy: userId,
      });

      const result = await service.create(dto, userId);

      expect(repository.findNearbySpots).toHaveBeenCalledWith(60.0, 10.0, 1000);
      expect(repository.create).toHaveBeenCalledWith({
        ...dto,
        createdBy: userId,
      });
      expect(result.id).toBe('spot-456');
    });

    it('should throw SpotTooCloseError when spot is too close', async () => {
      const dto = {
        title: 'New Spot',
        latitude: 60.0,
        longitude: 10.0,
      };

      repository.findNearbySpots.mockResolvedValue([
        { id: 'existing-spot', distance: 500 },
      ]);

      await expect(service.create(dto, 'user-123'))
        .rejects.toThrow(SpotTooCloseError);
    });
  });

  describe('update', () => {
    it('should update spot when user is owner', async () => {
      const spotId = 'spot-123';
      const dto = { title: 'Updated Title' };
      const userId = 'user-123';

      repository.findById.mockResolvedValue({
        id: spotId,
        createdBy: userId,
        isDeleted: false,
      });
      repository.update.mockResolvedValue({
        id: spotId,
        ...dto,
      });

      const result = await service.update(spotId, dto, userId, 'user');

      expect(repository.update).toHaveBeenCalledWith(spotId, dto);
      expect(result.title).toBe('Updated Title');
    });

    it('should update spot when user is moderator', async () => {
      const spotId = 'spot-123';
      const dto = { title: 'Updated by Mod' };

      repository.findById.mockResolvedValue({
        id: spotId,
        createdBy: 'other-user',
        isDeleted: false,
      });
      repository.update.mockResolvedValue({ id: spotId, ...dto });

      const result = await service.update(spotId, dto, 'mod-456', 'moderator');

      expect(repository.update).toHaveBeenCalled();
    });

    it('should throw UnauthorizedError when user is not owner', async () => {
      repository.findById.mockResolvedValue({
        id: 'spot-123',
        createdBy: 'other-user',
        isDeleted: false,
      });

      await expect(
        service.update('spot-123', { title: 'Hack' }, 'hacker-789', 'user'),
      ).rejects.toThrow(UnauthorizedError);
    });
  });
});
```

## Controller Tests

### Basic Controller Test

```typescript
// apps/backend/src/modules/spots/spots.controller.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { SpotsController } from './spots.controller';
import { SpotsService } from './spots.service';
import { AuthGuard } from '@/src/common/auth/auth.guard';
import { CreateSpotDto } from './dto/create-spot.dto';

describe('SpotsController', () => {
  let controller: SpotsController;
  let service: jest.Mocked<SpotsService>;

  beforeEach(async () => {
    const mockService = {
      findAll: jest.fn(),
      findById: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [SpotsController],
      providers: [
        {
          provide: SpotsService,
          useValue: mockService,
        },
      ],
    })
      .overrideGuard(AuthGuard)
      .useValue({ canActivate: jest.fn(() => true) })
      .compile();

    controller = module.get<SpotsController>(SpotsController);
    service = module.get(SpotsService);
  });

  describe('findAll', () => {
    it('should return array of spots', async () => {
      const mockSpots = [{ id: '1', title: 'Spot 1' }];
      service.findAll.mockResolvedValue(mockSpots);

      const result = await controller.findAll({ page: 0, limit: 20 });

      expect(result).toEqual(mockSpots);
      expect(service.findAll).toHaveBeenCalledWith({ page: 0, limit: 20 });
    });
  });

  describe('create', () => {
    it('should create spot with user id', async () => {
      const dto: CreateSpotDto = {
        title: 'New Spot',
        latitude: 60.0,
        longitude: 10.0,
      };
      const user = {
        sub: 'user-123',
        email: 'test@example.com',
        role: 'user',
      };
      const createdSpot = { id: 'spot-456', ...dto };

      service.create.mockResolvedValue(createdSpot);

      const result = await controller.create(dto, user);

      expect(service.create).toHaveBeenCalledWith(dto, 'user-123');
      expect(result).toEqual(createdSpot);
    });
  });

  describe('update', () => {
    it('should update spot with user id and role', async () => {
      const spotId = 'spot-123';
      const dto = { title: 'Updated' };
      const user = { sub: 'user-123', email: 'test@example.com', role: 'user' };

      service.update.mockResolvedValue({ id: spotId, ...dto });

      const result = await controller.update(spotId, dto, user);

      expect(service.update).toHaveBeenCalledWith(spotId, dto, 'user-123', 'user');
      expect(result.title).toBe('Updated');
    });
  });
});
```

## Repository Tests

### With Test Database

```typescript
// apps/backend/src/modules/spots/spots.repository.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { SpotsRepository } from './spots.repository';
import { PrismaService } from '@/src/common/prisma/prisma.service';

describe('SpotsRepository (integration)', () => {
  let repository: SpotsRepository;
  let prisma: PrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [SpotsRepository, PrismaService],
    }).compile();

    repository = module.get<SpotsRepository>(SpotsRepository);
    prisma = module.get<PrismaService>(PrismaService);
  });

  afterEach(async () => {
    // Clean up test data
    await prisma.diveSpot.deleteMany({});
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  describe('findById', () => {
    it('should return spot with parking locations', async () => {
      // Create test data
      const spot = await prisma.diveSpot.create({
        data: {
          title: 'Test Spot',
          latitude: 60.0,
          longitude: 10.0,
          createdBy: 'user-123',
        },
      });

      await prisma.parkingLocation.create({
        data: {
          label: 'Parking 1',
          latitude: 60.001,
          longitude: 10.001,
          spotId: spot.id,
          createdBy: 'user-123',
        },
      });

      // Test
      const result = await repository.findById(spot.id);

      expect(result).toBeDefined();
      expect(result.id).toBe(spot.id);
      expect(result.parkingLocations).toHaveLength(1);
      expect(result.parkingLocations[0].label).toBe('Parking 1');
    });
  });

  describe('findNearbySpots', () => {
    it('should find spots within radius', async () => {
      // Create test spots
      await prisma.diveSpot.createMany({
        data: [
          { title: 'Near', latitude: 60.0, longitude: 10.0, createdBy: 'user-123' },
          { title: 'Far', latitude: 61.0, longitude: 11.0, createdBy: 'user-123' },
        ],
      });

      // Test
      const results = await repository.findNearbySpots(60.0, 10.0, 1000);

      expect(results).toHaveLength(1);
      expect(results[0].title).toBe('Near');
      expect(results[0].distance).toBeLessThan(1000);
    });
  });
});
```

### With Mocked Prisma

```typescript
describe('SpotsRepository (unit)', () => {
  let repository: SpotsRepository;
  let prisma: jest.Mocked<PrismaService>;

  beforeEach(async () => {
    const mockPrisma = {
      diveSpot: {
        findUnique: jest.fn(),
        findMany: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
      $queryRaw: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SpotsRepository,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    repository = module.get<SpotsRepository>(SpotsRepository);
    prisma = module.get(PrismaService);
  });

  it('should find spot by id', async () => {
    const mockSpot = { id: 'spot-123', title: 'Test' };
    prisma.diveSpot.findUnique.mockResolvedValue(mockSpot);

    const result = await repository.findById('spot-123');

    expect(result).toEqual(mockSpot);
    expect(prisma.diveSpot.findUnique).toHaveBeenCalledWith({
      where: { id: 'spot-123' },
      include: { parkingLocations: { where: { isDeleted: false } } },
    });
  });
});
```

## Testing Auth Guard

```typescript
// apps/backend/src/common/auth/auth.guard.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { ExecutionContext } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AuthGuard } from './auth.guard';
import { UnauthorizedError } from '../errors/domain-errors';

describe('AuthGuard', () => {
  let guard: AuthGuard;
  let configService: jest.Mocked<ConfigService>;

  beforeEach(async () => {
    const mockConfigService = {
      get: jest.fn((key: string) => {
        const config = {
          AUTH_DEV_BYPASS: 'true',
          SUPABASE_JWKS_URL: 'https://example.com/jwks',
          SUPABASE_JWT_ISSUER: 'https://example.com',
        };
        return config[key];
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthGuard,
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    guard = module.get<AuthGuard>(AuthGuard);
    configService = module.get(ConfigService);
  });

  function createMockExecutionContext(headers: Record<string, string>): ExecutionContext {
    return {
      switchToHttp: () => ({
        getRequest: () => ({ headers }),
      }),
    } as ExecutionContext;
  }

  describe('dev bypass mode', () => {
    it('should allow request with valid dev headers', async () => {
      const context = createMockExecutionContext({
        'x-dev-user-id': 'user-123',
        'x-dev-role': 'user',
      });

      const result = await guard.canActivate(context);

      expect(result).toBe(true);
      const request = context.switchToHttp().getRequest();
      expect(request.user).toEqual({
        sub: 'user-123',
        email: 'user-123@dev.local',
        role: 'user',
      });
    });

    it('should reject request without user id', async () => {
      const context = createMockExecutionContext({});

      await expect(guard.canActivate(context))
        .rejects.toThrow(UnauthorizedError);
    });

    it('should default to user role when not specified', async () => {
      const context = createMockExecutionContext({
        'x-dev-user-id': 'user-123',
      });

      await guard.canActivate(context);

      const request = context.switchToHttp().getRequest();
      expect(request.user.role).toBe('user');
    });
  });

  describe('JWT verification', () => {
    beforeEach(() => {
      configService.get.mockImplementation((key: string) => {
        if (key === 'AUTH_DEV_BYPASS') return 'false';
        return 'mock-value';
      });
    });

    it('should reject request without authorization header', async () => {
      const context = createMockExecutionContext({});

      await expect(guard.canActivate(context))
        .rejects.toThrow(UnauthorizedError);
    });

    it('should reject malformed authorization header', async () => {
      const context = createMockExecutionContext({
        authorization: 'InvalidFormat',
      });

      await expect(guard.canActivate(context))
        .rejects.toThrow(UnauthorizedError);
    });
  });
});
```

## Integration Tests

```typescript
// apps/backend/src/modules/spots/__tests__/integration/spots.integration.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { AppModule } from '@/src/app.module';
import { PrismaService } from '@/src/common/prisma/prisma.service';
import * as request from 'supertest';

describe('Spots (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    prisma = moduleFixture.get<PrismaService>(PrismaService);

    await app.init();
  });

  afterAll(async () => {
    await prisma.$disconnect();
    await app.close();
  });

  afterEach(async () => {
    await prisma.diveSpot.deleteMany({});
  });

  describe('POST /spots', () => {
    it('should create spot with valid data', () => {
      return request(app.getHttpServer())
        .post('/spots')
        .set('x-dev-user-id', 'user-123')
        .set('x-dev-role', 'user')
        .send({
          title: 'Test Spot',
          latitude: 60.0,
          longitude: 10.0,
        })
        .expect(201)
        .expect((res) => {
          expect(res.body.id).toBeDefined();
          expect(res.body.title).toBe('Test Spot');
        });
    });

    it('should reject spot too close to existing', async () => {
      // Create first spot
      await prisma.diveSpot.create({
        data: {
          title: 'Existing',
          latitude: 60.0,
          longitude: 10.0,
          createdBy: 'user-123',
        },
      });

      // Try to create nearby spot
      return request(app.getHttpServer())
        .post('/spots')
        .set('x-dev-user-id', 'user-123')
        .set('x-dev-role', 'user')
        .send({
          title: 'Too Close',
          latitude: 60.001, // ~111m away
          longitude: 10.0,
        })
        .expect(400)
        .expect((res) => {
          expect(res.body.message).toContain('Minimum distance: 1000m');
        });
    });
  });

  describe('GET /spots/:id', () => {
    it('should return spot with parking', async () => {
      const spot = await prisma.diveSpot.create({
        data: {
          title: 'Test',
          latitude: 60.0,
          longitude: 10.0,
          createdBy: 'user-123',
        },
      });

      await prisma.parkingLocation.create({
        data: {
          label: 'Parking',
          latitude: 60.001,
          longitude: 10.001,
          spotId: spot.id,
          createdBy: 'user-123',
        },
      });

      return request(app.getHttpServer())
        .get(`/spots/${spot.id}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.title).toBe('Test');
          expect(res.body.parkingLocations).toHaveLength(1);
        });
    });

    it('should return 404 for non-existent spot', () => {
      return request(app.getHttpServer())
        .get('/spots/non-existent')
        .expect(404);
    });
  });
});
```

## Test Fixtures

```typescript
// apps/backend/src/modules/spots/__tests__/fixtures/spots.fixtures.ts

export const mockSpot = {
  id: 'spot-123',
  title: 'Test Spot',
  description: 'A test dive spot',
  latitude: 60.0,
  longitude: 10.0,
  difficulty: 'moderate',
  accessInfo: 'Easy access from road',
  createdBy: 'user-123',
  isDeleted: false,
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
};

export const mockParking = {
  id: 'parking-456',
  label: 'Main Parking',
  latitude: 60.001,
  longitude: 10.001,
  spotId: 'spot-123',
  createdBy: 'user-123',
  isDeleted: false,
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
};

export const mockUser = {
  sub: 'user-123',
  email: 'test@example.com',
  role: 'user' as const,
};

export const mockModerator = {
  sub: 'mod-456',
  email: 'mod@example.com',
  role: 'moderator' as const,
};

export function createMockRepository() {
  return {
    findById: jest.fn(),
    findAll: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    softDelete: jest.fn(),
    findNearbySpots: jest.fn(),
  };
}

export function createMockService() {
  return {
    findAll: jest.fn(),
    findById: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  };
}
```

## Coverage Target

Aim for ≥80% coverage:

```bash
pnpm test:cov

# View HTML report
open coverage/lcov-report/index.html
```

Focus coverage on:
- Business logic in services (aim for 90%+)
- Domain error throwing
- Authorization checks
- Validation logic

Lower priority:
- DTOs (validated by class-validator)
- Simple pass-through methods
- Prisma query builders

---

*Reference file for backend-dev skill*
