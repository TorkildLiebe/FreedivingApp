# Testing Best Practices

## 1. Testing Pyramid

```
         /  E2E Tests  \         Few, slow, high confidence
        / Integration   \       Some, medium speed
       /   Unit Tests    \     Many, fast, focused
      /__________________\
```

| Type | What it tests | Speed | Count | In our project |
|------|--------------|-------|-------|----------------|
| Unit | Single function/class in isolation | Fast (<10ms) | Many | `*.spec.ts` colocated with source |
| Integration | Multiple components working together | Medium | Some | `test/*.e2e-spec.ts` |
| E2E | Full API request through all layers | Slow | Few | `test/*.e2e-spec.ts` with DB |

### Our target: 80% coverage
Focus on services and repositories (where business logic lives). Controllers and modules are lower priority.

## 2. Unit Tests

### What to unit test
- **Services**: Business logic, validation rules, edge cases
- **Repositories**: Query logic (with mocked PrismaService)
- **Guards**: Auth logic
- **Utility functions**: Helpers, formatters

### Structure: Arrange-Act-Assert

```typescript
describe('DiveSpotService', () => {
  describe('create', () => {
    it('should throw when spot is too close to existing spot', async () => {
      // Arrange - set up test data and mocks
      const dto: CreateDiveSpotDto = {
        name: 'Test Spot',
        latitude: 60.39,
        longitude: 5.32,
      };
      repository.findNearby.mockResolvedValue([existingSpot]);

      // Act & Assert - call the method and verify result
      await expect(service.create(dto, userId)).rejects.toThrow(SpotTooCloseError);
    });

    it('should create spot when no nearby spots exist', async () => {
      // Arrange
      const dto: CreateDiveSpotDto = {
        name: 'Test Spot',
        latitude: 60.39,
        longitude: 5.32,
      };
      repository.findNearby.mockResolvedValue([]);
      repository.create.mockResolvedValue(createdSpot);

      // Act
      const result = await service.create(dto, userId);

      // Assert
      expect(result).toEqual(createdSpot);
      expect(repository.create).toHaveBeenCalledWith(
        expect.objectContaining({ name: 'Test Spot' }),
      );
    });
  });
});
```

### Naming conventions

```typescript
// Pattern: "should [expected behavior] when [condition]"
it('should throw NotFoundException when spot does not exist', ...);
it('should return empty array when no spots match filter', ...);
it('should soft-delete spot and set deletedAt', ...);

// Group by method
describe('DiveSpotService', () => {
  describe('findOne', () => {
    it('should return spot when found', ...);
    it('should throw when not found', ...);
  });

  describe('create', () => {
    it('should create when valid', ...);
    it('should throw when too close', ...);
    it('should throw when too many photos', ...);
  });
});
```

## 3. Mocking

### Mock dependencies, not the thing you're testing

```typescript
// Testing DiveSpotService -> mock DiveSpotRepository
// Testing DiveSpotController -> mock DiveSpotService
// Testing DiveSpotRepository -> mock PrismaService

describe('DiveSpotService', () => {
  let service: DiveSpotService;
  let repository: jest.Mocked<DiveSpotRepository>;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        DiveSpotService,
        {
          provide: DiveSpotRepository,
          useValue: {
            findById: jest.fn(),
            findAll: jest.fn(),
            create: jest.fn(),
            findNearby: jest.fn(),
            softDelete: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get(DiveSpotService);
    repository = module.get(DiveSpotRepository);
  });
});
```

### Mock patterns

```typescript
// Return a value
mockRepo.findById.mockResolvedValue(mockSpot);

// Return null (not found)
mockRepo.findById.mockResolvedValue(null);

// Throw an error
mockRepo.findById.mockRejectedValue(new Error('DB connection failed'));

// Return different values on consecutive calls
mockRepo.findById
  .mockResolvedValueOnce(spot1)
  .mockResolvedValueOnce(spot2);

// Verify a mock was called correctly
expect(mockRepo.create).toHaveBeenCalledWith(
  expect.objectContaining({
    name: 'Test Spot',
    createdById: userId,
  }),
);

// Verify a mock was called exactly once
expect(mockRepo.create).toHaveBeenCalledTimes(1);

// Verify a mock was NOT called
expect(mockRepo.softDelete).not.toHaveBeenCalled();
```

## 4. Test Data

### Use factory functions for test data

```typescript
// test/factories.ts
export function createMockDiveSpot(overrides: Partial<DiveSpot> = {}): DiveSpot {
  return {
    id: 'spot-123',
    name: 'Test Spot',
    latitude: 60.39,
    longitude: 5.32,
    description: null,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    isDeleted: false,
    deletedAt: null,
    createdById: 'user-123',
    ...overrides, // Allow overriding any field
  };
}

export function createMockUser(overrides: Partial<User> = {}): User {
  return {
    id: 'user-123',
    externalId: 'supabase-123',
    email: 'test@example.com',
    displayName: 'Test User',
    role: 'user',
    ...overrides,
  };
}

// Usage in tests
const spot = createMockDiveSpot({ name: 'Custom Name' });
const admin = createMockUser({ role: 'admin' });
```

### Don't share mutable test data between tests

```typescript
// BAD - shared state between tests
const mockSpot = { id: '1', name: 'Test' };

it('test 1', () => {
  mockSpot.name = 'Changed'; // mutates shared data
});

it('test 2', () => {
  // mockSpot.name is now 'Changed' - test pollution!
});

// GOOD - fresh data per test
beforeEach(() => {
  mockSpot = createMockDiveSpot();
});
```

## 5. E2E / Integration Tests

### Test the full request flow

```typescript
describe('DiveSpot API (e2e)', () => {
  let app: NestFastifyApplication;

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = module.createNestApplication(new FastifyAdapter());
    app.useGlobalPipes(new ValidationPipe({ whitelist: true }));
    await app.init();
    await app.getHttpAdapter().getInstance().ready();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('POST /dive-spots', () => {
    it('should return 401 without auth token', () => {
      return request(app.getHttpServer())
        .post('/dive-spots')
        .send({ name: 'Test', latitude: 60, longitude: 5 })
        .expect(401);
    });

    it('should return 400 with invalid data', () => {
      return request(app.getHttpServer())
        .post('/dive-spots')
        .set('Authorization', `Bearer ${testToken}`)
        .send({ name: '' }) // missing required fields
        .expect(400);
    });

    it('should return 201 with valid data', () => {
      return request(app.getHttpServer())
        .post('/dive-spots')
        .set('Authorization', `Bearer ${testToken}`)
        .send({ name: 'New Spot', latitude: 60.39, longitude: 5.32 })
        .expect(201)
        .expect((res) => {
          expect(res.body.id).toBeDefined();
          expect(res.body.name).toBe('New Spot');
        });
    });
  });
});
```

### E2E test with dev auth bypass

```typescript
// Use the dev auth bypass header for E2E tests
const DEV_AUTH_HEADERS = {
  'x-dev-user-id': 'test-user-id',
  'x-dev-role': 'user',
};

it('should create a spot', () => {
  return request(app.getHttpServer())
    .post('/dive-spots')
    .set(DEV_AUTH_HEADERS)
    .send(validDto)
    .expect(201);
});
```

## 6. What to Test

### High priority (test these thoroughly)

| What | Why | Example |
|------|-----|---------|
| Business rules | Core value | Proximity check, edit window, photo limits |
| Error paths | Prevent crashes | Not found, unauthorized, invalid input |
| Auth/authorization | Security | Guards, role checks |
| Data transformations | Correctness | DTO mapping, response formatting |

### Medium priority

| What | Why |
|------|-----|
| Repository queries | Verify correct filters, includes |
| Validation rules | DTO decorators work as expected |
| Edge cases | Empty arrays, null values, boundaries |

### Low priority (don't over-test)

| What | Why |
|------|-----|
| Module wiring | NestJS handles this |
| Constructor assignment | Trivial code |
| Getter/setter methods | No logic to test |
| Third-party libraries | They have their own tests |

## 7. Testing Async Code

```typescript
// Testing promises
it('should resolve with data', async () => {
  const result = await service.findAll();
  expect(result).toHaveLength(3);
});

// Testing rejected promises
it('should reject when not found', async () => {
  await expect(service.findOne('bad-id')).rejects.toThrow(NotFoundException);
});

// Testing that a side effect happened
it('should call repository with correct args', async () => {
  await service.create(dto, userId);

  expect(repository.create).toHaveBeenCalledWith(
    expect.objectContaining({ createdById: userId }),
  );
});
```

## 8. Coverage

### Running coverage

```bash
# Run tests with coverage
pnpm test:backend -- --coverage

# Coverage report shows:
# - Statements: % of code statements executed
# - Branches: % of if/else/switch branches taken
# - Functions: % of functions called
# - Lines: % of lines executed
```

### Coverage exclusions (already configured)

```json
// In backend package.json jest config
"coveragePathIgnorePatterns": [
  "main.ts",           // Bootstrap, no logic
  ".*\\.module\\.ts",  // Module wiring
  ".*/dto/.*",         // DTO classes (just decorators)
  ".*/index\\.ts"      // Barrel exports
]
```

### Don't chase 100%
- 80% is our target
- Focus on meaningful coverage (business logic, error paths)
- Don't write tests just to hit a number
- Untested code should be code that's trivial or delegating

## 9. Test Organization Tips

```
src/
  modules/
    dive-spot/
      dive-spot.service.ts
      dive-spot.service.spec.ts      # Unit test next to source
      dive-spot.repository.ts
      dive-spot.repository.spec.ts
test/
  dive-spot.e2e-spec.ts              # E2E tests in separate folder
  factories/                          # Shared test data factories
    dive-spot.factory.ts
    user.factory.ts
```

### One assertion per test (when practical)

```typescript
// GOOD - clear what failed
it('should set createdAt to now', () => { ... });
it('should set isDeleted to false', () => { ... });
it('should generate a UUID id', () => { ... });

// ACCEPTABLE - related assertions grouped
it('should create spot with correct defaults', () => {
  expect(result.isDeleted).toBe(false);
  expect(result.createdAt).toBeDefined();
  expect(result.id).toMatch(/^[0-9a-f-]{36}$/);
});

// BAD - unrelated assertions in one test
it('should work', () => {
  expect(result.name).toBe('Test');
  expect(otherResult.count).toBe(5);
  expect(thirdThing).toBeNull();
});
```

## Quick Reference: Jest Matchers

```typescript
// Equality
expect(a).toBe(b);              // Strict equality (===)
expect(a).toEqual(b);           // Deep equality (objects/arrays)
expect(a).toStrictEqual(b);     // Deep equality + checks undefined properties

// Truthiness
expect(a).toBeDefined();
expect(a).toBeNull();
expect(a).toBeTruthy();
expect(a).toBeFalsy();

// Numbers
expect(a).toBeGreaterThan(3);
expect(a).toBeLessThanOrEqual(5);
expect(a).toBeCloseTo(0.3, 5);  // Float comparison

// Strings
expect(str).toMatch(/regex/);
expect(str).toContain('substring');

// Arrays
expect(arr).toHaveLength(3);
expect(arr).toContain(item);
expect(arr).toEqual(expect.arrayContaining([item1, item2]));

// Objects
expect(obj).toHaveProperty('key');
expect(obj).toEqual(expect.objectContaining({ key: 'value' }));

// Errors
expect(() => fn()).toThrow(ErrorClass);
await expect(asyncFn()).rejects.toThrow(ErrorClass);

// Mocks
expect(mock).toHaveBeenCalled();
expect(mock).toHaveBeenCalledTimes(2);
expect(mock).toHaveBeenCalledWith(arg1, arg2);
```

## Learn More

- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [NestJS Testing](https://docs.nestjs.com/fundamentals/testing)
- [Testing Best Practices (Goldbergyoni)](https://github.com/goldbergyoni/javascript-testing-best-practices)
