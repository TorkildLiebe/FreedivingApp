# Architecture & Design Best Practices

## 1. Vertical Slices

Our backend uses **vertical slices**: each feature is a self-contained module with all its own layers.

```
src/modules/dive-spot/
├── dive-spot.module.ts          # Wires everything together
├── dive-spot.controller.ts      # HTTP layer
├── dive-spot.service.ts         # Business logic
├── dive-spot.repository.ts      # Data access
├── dto/
│   ├── create-dive-spot.dto.ts  # Input validation
│   └── update-dive-spot.dto.ts
└── domain/
    └── errors.ts                # Domain-specific errors
```

### Why vertical slices?
- **Feature independence**: Adding "dive spots" doesn't touch "reports" code
- **Easy to understand**: Everything about a feature is in one folder
- **Easy to delete**: Remove a feature by deleting its folder
- **Team scalability**: Different developers can work on different features

### Contrast with horizontal layers (which we DON'T use)

```
# BAD - horizontal layers (all controllers together, all services together)
src/
  controllers/
    dive-spot.controller.ts
    report.controller.ts
    user.controller.ts
  services/
    dive-spot.service.ts
    report.service.ts
    user.service.ts
  repositories/
    dive-spot.repository.ts
    report.repository.ts
    user.repository.ts
```

Problem: To understand "dive spots," you'd need to look in 4+ different folders.

## 2. The Dependency Rule

Dependencies flow **inward** (from outer layers to inner layers):

```
Controller (HTTP) → Service (Business Logic) → Repository (Data Access)
                                                        ↓
                                                  PrismaService (Infrastructure)
```

### Rules
- **Controllers** can depend on **services** (never on repositories or Prisma)
- **Services** can depend on **repositories** (never on controllers or Prisma directly)
- **Repositories** can depend on **PrismaService** (the infrastructure boundary)
- **Nothing** depends on controllers

### Why?
- Services contain business logic. They shouldn't know about HTTP.
- Repositories abstract the database. Services don't care if it's Postgres, MongoDB, or a file.
- Controllers are thin HTTP adapters. They just translate HTTP to service calls.

```typescript
// GOOD - service doesn't know about HTTP
@Injectable()
export class DiveSpotService {
  constructor(private readonly repo: DiveSpotRepository) {}

  async findOne(id: string): Promise<DiveSpot> {
    const spot = await this.repo.findById(id);
    if (!spot) throw new SpotNotFoundError(id); // Domain error, not HttpException
    return spot;
  }
}

// BAD - service knows about HTTP
@Injectable()
export class DiveSpotService {
  constructor(private readonly prisma: PrismaService) {} // Direct Prisma access

  async findOne(id: string, res: Response) { // HTTP response object in service?!
    const spot = await this.prisma.diveSpot.findUnique({ where: { id } });
    if (!spot) res.status(404).send('Not found'); // HTTP in business logic
  }
}
```

## 3. Shared Code (Common Module)

Code that's used across multiple features lives in `src/common/`:

```
src/common/
├── auth/
│   ├── auth.guard.ts            # JWT verification guard
│   ├── auth.module.ts
│   ├── current-user.decorator.ts
│   └── jwt-verify.service.ts
├── errors/
│   ├── domain-error.ts          # Base domain error class
│   ├── not-found.error.ts
│   └── forbidden.error.ts
├── filters/
│   └── domain-exception.filter.ts
└── utils/
    └── geo.utils.ts             # Distance calculations, etc.
```

### What belongs in common?
- Auth (guards, decorators, JWT service)
- Domain error base classes
- Exception filters
- Shared utilities (geo calculations, date helpers)
- Shared DTOs (pagination, sorting)

### What does NOT belong in common?
- Feature-specific logic
- Feature-specific types/interfaces
- Anything only used by one module

## 4. SOLID Principles (Practical)

### S - Single Responsibility

Each class does one thing.

```typescript
// GOOD - each class has one job
class DiveSpotController {}  // Handles HTTP for dive spots
class DiveSpotService {}     // Business logic for dive spots
class DiveSpotRepository {}  // Database queries for dive spots

// BAD - one class does everything
class DiveSpotManager {
  handleRequest() {}       // HTTP handling
  validateSpot() {}        // Validation
  calculateDistance() {}   // Business logic
  saveToDatabase() {}      // Data access
  sendNotification() {}   // Side effects
}
```

### O - Open/Closed

Open for extension, closed for modification. In practice: use interfaces and dependency injection.

```typescript
// If we need different storage backends:
interface PhotoStorage {
  upload(file: Buffer, path: string): Promise<string>;
  delete(path: string): Promise<void>;
}

// We can swap implementations without changing the service
class SupabaseStorage implements PhotoStorage { /* ... */ }
class S3Storage implements PhotoStorage { /* ... */ }
class LocalStorage implements PhotoStorage { /* ... */ }

// Service doesn't change when we switch storage
@Injectable()
class PhotoService {
  constructor(@Inject('PHOTO_STORAGE') private storage: PhotoStorage) {}
}
```

### L - Liskov Substitution

Subtypes must be substitutable for their base types. In practice: don't override methods to throw "not supported."

### I - Interface Segregation

Don't force classes to implement methods they don't use.

```typescript
// BAD - one huge interface
interface Repository<T> {
  findById(id: string): Promise<T>;
  findAll(): Promise<T[]>;
  create(data: Partial<T>): Promise<T>;
  update(id: string, data: Partial<T>): Promise<T>;
  delete(id: string): Promise<void>;
  findNearby(lat: number, lng: number, radius: number): Promise<T[]>;
  fullTextSearch(query: string): Promise<T[]>;
}
// Not every entity needs findNearby or fullTextSearch!

// GOOD - smaller, focused interfaces
interface ReadRepository<T> {
  findById(id: string): Promise<T | null>;
  findAll(): Promise<T[]>;
}

interface WriteRepository<T> {
  create(data: CreateData<T>): Promise<T>;
  update(id: string, data: UpdateData<T>): Promise<T>;
  softDelete(id: string): Promise<void>;
}

// Only DiveSpotRepository implements spatial queries
interface SpatialRepository {
  findNearby(lat: number, lng: number, radius: number): Promise<DiveSpot[]>;
}
```

### D - Dependency Inversion

High-level modules shouldn't depend on low-level modules. Both should depend on abstractions.

NestJS DI handles this naturally:

```typescript
// Service depends on repository abstraction (injected)
@Injectable()
class DiveSpotService {
  constructor(private readonly repo: DiveSpotRepository) {}
  // Doesn't know or care about Prisma
}
```

## 5. When to Abstract

### Don't abstract prematurely

```typescript
// BAD - creating abstractions for one implementation
interface IDiveSpotService { /* ... */ }
class DiveSpotServiceImpl implements IDiveSpotService { /* ... */ }
// There's only ever going to be one DiveSpotService. The interface adds noise.

// GOOD - just use the class directly
@Injectable()
class DiveSpotService { /* ... */ }
```

### When abstractions ARE worth it
- **Multiple implementations exist** (storage backends, payment providers)
- **Testing requires it** (mocking external services)
- **The boundary is important** (infrastructure vs domain)

### Rule of three
Wait until you have three similar cases before creating an abstraction. Two could be a coincidence; three is a pattern.

```typescript
// First time: just write the code
// Second time: notice the similarity, but leave it
// Third time: now extract the pattern

// BAD - premature abstraction after one use
class BaseEntityService<T> {
  async findOrThrow(id: string): Promise<T> { /* ... */ }
}

// GOOD - extract after three modules need the same pattern
// (and only extract what's actually shared)
```

## 6. Error Design

### Domain error hierarchy

```typescript
// common/errors/domain-error.ts
export abstract class DomainError extends Error {
  abstract readonly code: string;

  constructor(message: string) {
    super(message);
    this.name = this.constructor.name;
  }
}

// common/errors/not-found.error.ts
export class NotFoundError extends DomainError {
  readonly code = 'NOT_FOUND';

  constructor(entity: string, id: string) {
    super(`${entity} with id ${id} not found`);
  }
}

// modules/dive-spot/domain/errors.ts
export class SpotNotFoundError extends NotFoundError {
  constructor(id: string) {
    super('DiveSpot', id);
  }
}

export class SpotTooCloseError extends DomainError {
  readonly code = 'SPOT_TOO_CLOSE';

  constructor(distanceMeters: number) {
    super(`Spot must be at least 1000m from existing spots (${distanceMeters}m)`);
  }
}
```

### Error to HTTP mapping

| Domain Error Pattern | HTTP Status |
|---------------------|-------------|
| `*NotFoundError` | 404 |
| `Invalid*Error` | 400 |
| `Forbidden*Error` | 403 |
| `*ConflictError` | 409 |
| `Unauthorized*Error` | 401 |

## 7. Decision Framework

When facing an architectural decision, ask:

1. **Does it solve a real problem now?** (not hypothetical future needs)
2. **Is it the simplest solution?** (complexity must be justified)
3. **Can I remove it easily?** (prefer reversible decisions)
4. **Does it follow our existing patterns?** (consistency > cleverness)
5. **Would a new team member understand it?** (clarity > elegance)

### Common traps to avoid

| Trap | Better Approach |
|------|----------------|
| "We might need this later" | Build it when you need it |
| "Let's make it configurable" | Hard-code for now, extract later |
| "Let's add a base class" | Duplicate the code, extract if pattern emerges |
| "Let's use an event bus" | Direct method calls until proven insufficient |
| "Let's add caching everywhere" | Profile first, cache hot spots only |

## Learn More

- [Clean Architecture (Robert C. Martin)](https://blog.cleancoder.com/uncle-bob/2012/08/13/the-clean-architecture.html)
- [Vertical Slice Architecture](https://www.jimmybogard.com/vertical-slice-architecture/)
- [SOLID Principles in TypeScript](https://www.typescriptlang.org/docs/handbook/2/classes.html)
- [YAGNI (You Aren't Gonna Need It)](https://martinfowler.com/bliki/Yagni.html)
