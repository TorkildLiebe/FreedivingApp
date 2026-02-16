---
name: test-backend
description: Generates unit and integration tests for NestJS services, controllers, repositories, guards, and filters in the DiveFreely backend
---

# Backend Test Writer Skill

Generates unit and integration tests for NestJS modules in the DiveFreely backend.

## When to Use This Skill

Use this skill to:
- Write tests for new services, controllers, repositories
- Test domain error throwing
- Test authorization and auth guard logic
- Achieve ≥80% test coverage

## Test Types

### Service Tests (Unit)

Mock repositories, test business logic:

```typescript
import { Test } from '@nestjs/testing';

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

  it('throws SpotNotFoundError when spot not found', async () => {
    repository.findById.mockResolvedValue(null);

    await expect(service.findById('invalid'))
      .rejects.toThrow(SpotNotFoundError);
  });
});
```

### Controller Tests (Unit)

Mock services, test parameter passing and guards:

```typescript
describe('SpotsController', () => {
  let controller: SpotsController;
  let service: jest.Mocked<SpotsService>;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      controllers: [SpotsController],
      providers: [
        { provide: SpotsService, useValue: createMockService() },
      ],
    })
      .overrideGuard(AuthGuard)
      .useValue({ canActivate: jest.fn(() => true) })
      .compile();

    controller = module.get(SpotsController);
    service = module.get(SpotsService);
  });

  it('calls service with user id', async () => {
    const dto = { title: 'Test' };
    const user = { sub: 'user-123', email: 'test@example.com', role: 'user' };

    await controller.create(dto, user);

    expect(service.create).toHaveBeenCalledWith(dto, 'user-123');
  });
});
```

### Repository Tests (Integration)

Use test database or mock Prisma:

```typescript
describe('SpotsRepository', () => {
  let repository: SpotsRepository;
  let prisma: PrismaService;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [SpotsRepository, PrismaService],
    }).compile();

    repository = module.get(SpotsRepository);
    prisma = module.get(PrismaService);
  });

  afterEach(async () => {
    await prisma.diveSpot.deleteMany({});
  });

  it('finds spot by id with parking', async () => {
    const spot = await prisma.diveSpot.create({ data: { ... } });

    const result = await repository.findById(spot.id);

    expect(result).toBeDefined();
    expect(result.id).toBe(spot.id);
  });
});
```

### Guard Tests

Test auth guard logic:

```typescript
describe('AuthGuard', () => {
  let guard: AuthGuard;

  it('allows request with valid dev headers', async () => {
    const context = createMockExecutionContext({
      headers: { 'x-dev-user-id': 'user-123' },
    });

    const result = await guard.canActivate(context);

    expect(result).toBe(true);
  });
});
```

## Common Mocks

### Mock Repository

```typescript
function createMockRepository() {
  return {
    findById: jest.fn(),
    findAll: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    softDelete: jest.fn(),
    findNearbySpots: jest.fn(),
  };
}
```

### Mock Service

```typescript
function createMockService() {
  return {
    findAll: jest.fn(),
    findById: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  };
}
```

### Mock Prisma

```typescript
const mockPrisma = {
  diveSpot: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  },
  $queryRaw: jest.fn(),
  $transaction: jest.fn(),
};
```

## Integration Tests

E2E tests with supertest:

```typescript
import * as request from 'supertest';

describe('Spots (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  it('POST /spots creates spot', () => {
    return request(app.getHttpServer())
      .post('/spots')
      .set('x-dev-user-id', 'user-123')
      .send({ title: 'Test', latitude: 60.0, longitude: 10.0 })
      .expect(201)
      .expect((res) => {
        expect(res.body.id).toBeDefined();
      });
  });
});
```

## Coverage Target

Aim for ≥80% coverage:

```bash
pnpm test:backend --coverage

# View HTML report
open apps/backend/coverage/lcov-report/index.html
```

Focus on:
- Business logic in services (≥90%)
- Domain error throwing
- Authorization checks
- Validation logic

## Quick Tips

1. **Mock dependencies** to isolate unit under test
2. **Test error cases** not just happy path
3. **Use fixtures** for consistent test data
4. **Clean up** test data in afterEach
5. **Override guards** in controller tests

## Reference Files

For detailed patterns and examples:
- `../backend-dev/testing-backend.md` - Complete test patterns

## Related Skills

- `/backend-dev` - Backend development patterns
- `/test-mobile` - Mobile testing patterns

---

*Skill for backend testing (Issue #53)*
