---
name: backend-dev
description: Guides NestJS backend development using vertical slice architecture, auth patterns, domain errors, and Prisma repositories for DiveFreely API endpoints
---

# Backend Developer Skill

Guide for developing backend features in the DiveFreely NestJS API following vertical slice architecture.

## When to Use This Skill

Use this skill when:
- Creating new API endpoints or modules
- Implementing business logic in services
- Working with Prisma repositories
- Handling authentication and authorization
- Implementing domain error handling
- Writing backend tests

## Vertical Slice Architecture

Each feature module follows this structure:

```
apps/backend/src/modules/<feature>/
├── <feature>.controller.ts    # HTTP layer
├── <feature>.service.ts       # Business logic
├── <feature>.repository.ts    # Data access
├── dto/
│   ├── create-<feature>.dto.ts
│   ├── update-<feature>.dto.ts
│   └── <feature>-response.dto.ts
└── domain/
    └── <feature>.entity.ts    # Domain model (optional)
```

### Layer Responsibilities

**Controller:**
- HTTP request/response handling
- Route definitions with `@Controller()`, `@Get()`, `@Post()`, etc.
- Parameter extraction with `@Param()`, `@Query()`, `@Body()`
- Guard attachment with `@UseGuards(AuthGuard)`
- NO business logic - delegate to service

**Service:**
- Business logic and use case orchestration
- Domain validation and invariant enforcement
- Throw `DomainError` subclasses for violations
- Call repository methods for persistence
- Use `prisma.$transaction` for multi-step writes

**Repository:**
- Data access with Prisma Client
- Raw SQL for complex spatial queries (PostGIS)
- Transform Prisma models to domain entities
- NO business logic

**DTOs:**
- Use `class-validator` decorators
- Validate input at HTTP boundary
- Match domain invariants (see `audit-rules` skill)

## Authentication Patterns

### Protected Routes

```typescript
import { Controller, Get, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@/src/common/auth/auth.guard';
import { CurrentUser } from '@/src/common/auth/current-user.decorator';
import { JWTPayload } from '@/src/common/auth/types';

@Controller('spots')
@UseGuards(AuthGuard)
export class SpotsController {
  @Post()
  async create(
    @CurrentUser() user: JWTPayload,
    @Body() dto: CreateSpotDto,
  ) {
    return this.service.create(dto, user.sub);
  }
}
```

### Public Routes

Omit `@UseGuards(AuthGuard)` for public endpoints:

```typescript
@Controller('health')
export class HealthController {
  @Get()
  check() {
    return { status: 'ok' };
  }
}
```

### Dev Bypass Mode

For local development without real JWTs:

```bash
# .env.development
AUTH_DEV_BYPASS=true
```

Send headers:
```
x-dev-user-id: user_123
x-dev-role: user
```

**NEVER enable in production.**

## Error Handling

### Domain Errors

All business rule violations throw `DomainError` subclasses:

```typescript
// apps/backend/src/common/errors/domain-errors.ts
export class SpotNotFoundError extends DomainError {
  constructor(id: string) {
    super(`Spot with id ${id} not found`);
  }
}

export class SpotTooCloseError extends DomainError {
  constructor(distance: number) {
    super(`Spot is ${distance}m from existing spot. Minimum distance: 1000m`);
  }
}
```

### Throwing Errors in Services

```typescript
async findById(id: string): Promise<DiveSpot> {
  const spot = await this.repository.findById(id);
  if (!spot || spot.isDeleted) {
    throw new SpotNotFoundError(id);
  }
  return spot;
}
```

### Exception Filter

`DomainExceptionFilter` maps domain errors to HTTP responses:

```typescript
// Registered globally in main.ts
app.useGlobalFilters(new DomainExceptionFilter());
```

- `NotFoundError` → 404
- `ValidationError` → 400
- `UnauthorizedError` → 401
- `ForbiddenError` → 403
- Other `DomainError` → 400

## DTO Validation

Use `class-validator` with domain-aligned constraints:

```typescript
import { IsString, IsLatitude, IsLongitude, MaxLength, IsOptional } from 'class-validator';

export class CreateSpotDto {
  @IsString()
  @MaxLength(80)
  title: string;

  @IsString()
  @MaxLength(2000)
  @IsOptional()
  description?: string;

  @IsLatitude()
  latitude: number;

  @IsLongitude()
  longitude: number;

  // Custom validator for emoji detection
  @ValidateNoEmoji({ message: 'Title cannot contain emoji' })
  title: string;
}
```

## Prisma Patterns

### Basic CRUD

```typescript
async findById(id: string): Promise<DiveSpot | null> {
  return this.prisma.diveSpot.findUnique({
    where: { id, isDeleted: false },
    include: { parkingLocations: true },
  });
}

async create(data: CreateSpotData): Promise<DiveSpot> {
  return this.prisma.diveSpot.create({
    data: {
      ...data,
      createdBy: userId,
    },
  });
}
```

### Transactions

For multi-step writes:

```typescript
async createSpotWithParking(
  spotData: CreateSpotData,
  parkingData: CreateParkingData[],
): Promise<DiveSpot> {
  return this.prisma.$transaction(async (tx) => {
    const spot = await tx.diveSpot.create({ data: spotData });

    await tx.parkingLocation.createMany({
      data: parkingData.map(p => ({ ...p, spotId: spot.id })),
    });

    return spot;
  });
}
```

### PostGIS Spatial Queries

Use raw SQL for spatial operations:

```typescript
async findNearbySpots(lat: number, lon: number, radiusMeters: number) {
  return this.prisma.$queryRaw`
    SELECT id, title,
           ST_Distance(
             location::geography,
             ST_SetSRID(ST_MakePoint(${lon}, ${lat}), 4326)::geography
           ) as distance
    FROM dive_spots
    WHERE is_deleted = false
      AND ST_DWithin(
            location::geography,
            ST_SetSRID(ST_MakePoint(${lon}, ${lat}), 4326)::geography,
            ${radiusMeters}
          )
    ORDER BY distance;
  `;
}
```

## Testing Backend Code

See the `test-backend` skill for detailed test patterns.

Quick example:

```typescript
describe('SpotsService', () => {
  let service: SpotsService;
  let repository: jest.Mocked<SpotsRepository>;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        SpotsService,
        { provide: SpotsRepository, useValue: createMockRepository() },
      ],
    }).compile();

    service = module.get(SpotsService);
    repository = module.get(SpotsRepository);
  });

  it('should throw SpotNotFoundError when spot does not exist', async () => {
    repository.findById.mockResolvedValue(null);

    await expect(service.findById('invalid-id'))
      .rejects.toThrow(SpotNotFoundError);
  });
});
```

## Common Module Setup

### Module Registration

```typescript
import { Module } from '@nestjs/common';
import { SpotsController } from './spots.controller';
import { SpotsService } from './spots.service';
import { SpotsRepository } from './spots.repository';
import { PrismaService } from '@/src/common/prisma/prisma.service';

@Module({
  controllers: [SpotsController],
  providers: [SpotsService, SpotsRepository, PrismaService],
  exports: [SpotsService], // Export if used by other modules
})
export class SpotsModule {}
```

### Registering in App Module

```typescript
// apps/backend/src/app.module.ts
import { Module } from '@nestjs/common';
import { SpotsModule } from './modules/spots/spots.module';

@Module({
  imports: [SpotsModule],
})
export class AppModule {}
```

## Critical Rules

1. **No domain logic in controllers** - Controllers only handle HTTP, delegate to services
2. **Throw domain errors only** - Never throw HTTP exceptions from services
3. **Validate at boundaries** - Use DTOs with `class-validator` at HTTP layer
4. **Use transactions** - Multi-step writes must use `prisma.$transaction`
5. **Check authorization** - Verify ownership/role before mutations
6. **Soft deletes** - Set `isDeleted = true`, never hard delete user content
7. **Test coverage ≥80%** - Write tests for all business logic

## Reference Files

For detailed patterns and examples:

- `backend-patterns.md` - Code examples for each layer
- `auth-flow.md` - JWT verification, getOrCreate user, dev bypass
- `testing-backend.md` - Test patterns with mocking

## Related Skills

- `/test-backend` - Writing backend tests
- `/audit-rules` - Validating domain invariants
- `/security` - Security best practices

---

*Skill for DiveFreely backend development (Issue #53)*
