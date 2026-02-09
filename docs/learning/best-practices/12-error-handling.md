# Error Handling Best Practices

## 1. Error Handling Philosophy

Errors are not exceptional - they're expected parts of the application flow. Handle them deliberately, not as an afterthought.

### Three categories of errors

| Category | Example | How to handle |
|----------|---------|---------------|
| **Domain errors** | Spot not found, too close, edit window expired | Throw domain error, map to HTTP response |
| **Validation errors** | Invalid email, missing required field | class-validator handles automatically |
| **System errors** | DB connection lost, disk full, OOM | Log, return 500, alert ops |

## 2. Domain Error Pattern

### Base error class

```typescript
// common/errors/domain-error.ts
export abstract class DomainError extends Error {
  abstract readonly code: string;
  abstract readonly httpStatus: number;

  constructor(message: string) {
    super(message);
    this.name = this.constructor.name;
  }
}
```

### Specific error classes

```typescript
// common/errors/not-found.error.ts
export class EntityNotFoundError extends DomainError {
  readonly code = 'NOT_FOUND';
  readonly httpStatus = 404;

  constructor(entity: string, id: string) {
    super(`${entity} with id ${id} not found`);
  }
}

// common/errors/forbidden.error.ts
export class ForbiddenError extends DomainError {
  readonly code = 'FORBIDDEN';
  readonly httpStatus = 403;

  constructor(message: string) {
    super(message);
  }
}

// common/errors/conflict.error.ts
export class ConflictError extends DomainError {
  readonly code = 'CONFLICT';
  readonly httpStatus = 409;

  constructor(message: string) {
    super(message);
  }
}

// common/errors/validation.error.ts
export class InvalidInputError extends DomainError {
  readonly code = 'INVALID_INPUT';
  readonly httpStatus = 400;

  constructor(message: string) {
    super(message);
  }
}
```

### Feature-specific errors

```typescript
// modules/dive-spot/domain/errors.ts
import { EntityNotFoundError, InvalidInputError, ConflictError } from '@common/errors';

export class SpotNotFoundError extends EntityNotFoundError {
  constructor(id: string) {
    super('DiveSpot', id);
  }
}

export class SpotTooCloseError extends InvalidInputError {
  constructor(distanceMeters: number) {
    super(`Spot must be at least 1000m from existing spots (distance: ${Math.round(distanceMeters)}m)`);
  }
}

export class TooManyPhotosError extends InvalidInputError {
  constructor() {
    super('Maximum 5 photos per spot');
  }
}

// modules/report/domain/errors.ts
export class ReportNotFoundError extends EntityNotFoundError {
  constructor(id: string) {
    super('Report', id);
  }
}

export class EditWindowExpiredError extends ForbiddenError {
  constructor() {
    super('Reports can only be edited within 48 hours of creation');
  }
}
```

## 3. Throwing Errors in Services

Services throw domain errors. They never construct HTTP responses.

```typescript
@Injectable()
export class DiveSpotService {
  async findOne(id: string): Promise<DiveSpot> {
    const spot = await this.repo.findById(id);
    if (!spot) {
      throw new SpotNotFoundError(id);
    }
    return spot;
  }

  async create(dto: CreateDiveSpotDto, userId: string): Promise<DiveSpot> {
    // Business rule: proximity check
    const nearby = await this.repo.findNearby(dto.latitude, dto.longitude, 1000);
    if (nearby.length > 0) {
      const closest = nearby[0];
      throw new SpotTooCloseError(closest.distance);
    }

    // Business rule: photo limit
    if (dto.photos && dto.photos.length > 5) {
      throw new TooManyPhotosError();
    }

    return this.repo.create({ ...dto, createdById: userId });
  }
}

@Injectable()
export class ReportService {
  async update(id: string, dto: UpdateReportDto, userId: string): Promise<Report> {
    const report = await this.repo.findById(id);
    if (!report) throw new ReportNotFoundError(id);

    // Ownership check
    if (report.createdById !== userId) {
      throw new ForbiddenError('You can only edit your own reports');
    }

    // 48-hour edit window
    const hoursElapsed = (Date.now() - report.createdAt.getTime()) / (1000 * 60 * 60);
    if (hoursElapsed > 48) {
      throw new EditWindowExpiredError();
    }

    return this.repo.update(id, dto);
  }
}
```

## 4. Exception Filter (Error → HTTP Response)

The exception filter catches all errors and converts them to consistent HTTP responses.

```typescript
// common/filters/domain-exception.filter.ts
import { Catch, ExceptionFilter, ArgumentsHost, HttpException, Logger } from '@nestjs/common';
import { DomainError } from '../errors/domain-error';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();
    const request = ctx.getRequest();

    // Domain errors - expected, map to HTTP status
    if (exception instanceof DomainError) {
      return response.status(exception.httpStatus).send({
        statusCode: exception.httpStatus,
        message: exception.message,
        error: exception.code,
        timestamp: new Date().toISOString(),
      });
    }

    // NestJS built-in exceptions (ValidationPipe errors, etc.)
    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const exceptionResponse = exception.getResponse();
      return response.status(status).send(
        typeof exceptionResponse === 'object'
          ? { ...exceptionResponse, timestamp: new Date().toISOString() }
          : { statusCode: status, message: exceptionResponse, timestamp: new Date().toISOString() },
      );
    }

    // Unexpected errors - log full details, return generic message
    this.logger.error(
      `Unhandled exception on ${request.method} ${request.url}`,
      exception instanceof Error ? exception.stack : String(exception),
    );

    return response.status(500).send({
      statusCode: 500,
      message: 'Internal server error',
      error: 'INTERNAL_ERROR',
      timestamp: new Date().toISOString(),
    });
  }
}
```

### Register globally

```typescript
// main.ts
app.useGlobalFilters(new AllExceptionsFilter());
```

## 5. Error Response Format

### Consistent shape for all errors

```json
{
  "statusCode": 404,
  "message": "DiveSpot with id abc-123 not found",
  "error": "NOT_FOUND",
  "timestamp": "2024-01-15T12:00:00.000Z"
}
```

### Validation errors (multiple fields)

```json
{
  "statusCode": 400,
  "message": [
    "name should not be empty",
    "latitude must not be greater than 90"
  ],
  "error": "Bad Request",
  "timestamp": "2024-01-15T12:00:00.000Z"
}
```

### What the mobile app sees

```typescript
// Mobile error handling
try {
  const spot = await api.createDiveSpot(formData);
  router.push(`/spots/${spot.id}`);
} catch (error) {
  if (error instanceof ApiError) {
    switch (error.statusCode) {
      case 400:
        // Show validation error to user
        Alert.alert('Invalid Input', error.message);
        break;
      case 401:
        // Redirect to login
        router.replace('/login');
        break;
      case 403:
        Alert.alert('Not Allowed', error.message);
        break;
      case 409:
        Alert.alert('Conflict', error.message);
        break;
      default:
        Alert.alert('Error', 'Something went wrong. Please try again.');
    }
  }
}
```

## 6. Error Mapping Reference

### Domain → HTTP status mapping

```
Error Class                 HTTP    When
──────────────────────────────────────────────────────────────
EntityNotFoundError         404     Resource doesn't exist
SpotNotFoundError           404     Dive spot not found
ReportNotFoundError         404     Report not found
UserNotFoundError           404     User not found

InvalidInputError           400     Input fails business rule
SpotTooCloseError           400     Proximity constraint violated
TooManyPhotosError          400     Photo limit exceeded
InvalidCoordinatesError     400     Lat/lng out of range

ForbiddenError              403     User lacks permission
EditWindowExpiredError       403     48h edit window passed
NotOwnerError               403     User doesn't own resource

ConflictError               409     Duplicate or state conflict
DuplicateSpotError          409     Spot already exists at location
DuplicateParkingError       409     Parking spot < 2m from existing

UnauthorizedError           401     Not authenticated
InvalidTokenError           401     JWT expired or malformed
```

## 7. Error Handling Anti-Patterns

### Don't swallow errors

```typescript
// BAD - error silently disappears
try {
  await service.create(dto);
} catch (error) {
  // nothing here - bug goes unnoticed
}

// BAD - logs but doesn't propagate
try {
  await service.create(dto);
} catch (error) {
  console.log(error); // logged but caller thinks it succeeded
}

// GOOD - handle or re-throw
try {
  await service.create(dto);
} catch (error) {
  if (error instanceof SpotTooCloseError) {
    // Handle specifically
    return { warning: error.message };
  }
  throw error; // Re-throw unexpected errors
}
```

### Don't use exceptions for control flow

```typescript
// BAD - using try/catch as an if/else
try {
  const spot = await repo.findByIdOrThrow(id);
  return spot;
} catch {
  return createDefaultSpot();
}

// GOOD - check explicitly
const spot = await repo.findById(id);
if (!spot) {
  return createDefaultSpot();
}
return spot;
```

### Don't catch and wrap without adding value

```typescript
// BAD - catches and re-throws with less info
try {
  return await repo.findById(id);
} catch (error) {
  throw new Error('Something went wrong');
}

// GOOD - add context when wrapping
try {
  return await repo.findById(id);
} catch (error) {
  throw new DatabaseError(`Failed to fetch spot ${id}`, { cause: error });
}

// BEST - just let it propagate (the exception filter handles it)
return await repo.findById(id);
```

### Don't expose internal details

```typescript
// BAD
throw new HttpException(
  `Prisma query failed: ${error.message}\nStack: ${error.stack}`,
  500,
);

// GOOD
this.logger.error('Prisma query failed', error.stack);
throw new InternalServerErrorException('An unexpected error occurred');
```

## 8. Logging Errors

### What to log

```typescript
// Log enough context to debug, but not sensitive data
this.logger.error('Failed to create dive spot', {
  userId,           // Who was affected
  spotName: dto.name, // What they tried to do
  error: error.message, // What went wrong
  stack: error.stack,   // Where in the code
});

// DON'T log:
// - Passwords or tokens
// - Full request bodies with sensitive data
// - PII (email, phone) unless necessary for debugging
```

### Log levels

| Level | When | Example |
|-------|------|---------|
| `error` | Something broke, needs attention | DB connection failed, unhandled exception |
| `warn` | Something unexpected but handled | Rate limit hit, deprecated API used |
| `log` | Normal operation worth noting | User created, spot deleted |
| `debug` | Detailed info for debugging | Query timing, cache hit/miss |

## 9. Testing Error Handling

```typescript
describe('DiveSpotService', () => {
  describe('findOne', () => {
    it('should throw SpotNotFoundError when spot does not exist', async () => {
      repository.findById.mockResolvedValue(null);

      await expect(service.findOne('nonexistent'))
        .rejects
        .toThrow(SpotNotFoundError);
    });

    it('should throw SpotNotFoundError with correct message', async () => {
      repository.findById.mockResolvedValue(null);

      await expect(service.findOne('abc-123'))
        .rejects
        .toThrow('DiveSpot with id abc-123 not found');
    });
  });

  describe('create', () => {
    it('should throw SpotTooCloseError when nearby spot exists', async () => {
      repository.findNearby.mockResolvedValue([{ distance: 500 }]);

      await expect(service.create(dto, userId))
        .rejects
        .toThrow(SpotTooCloseError);
    });

    it('should throw TooManyPhotosError when more than 5 photos', async () => {
      const dtoWithPhotos = { ...dto, photos: Array(6).fill(mockPhoto) };

      await expect(service.create(dtoWithPhotos, userId))
        .rejects
        .toThrow(TooManyPhotosError);
    });
  });
});
```

## Quick Reference: Error Decision Tree

```
Is the user authenticated?
├── No → throw UnauthorizedError (401)
└── Yes
    └── Does the resource exist?
        ├── No → throw EntityNotFoundError (404)
        └── Yes
            └── Does the user have permission?
                ├── No → throw ForbiddenError (403)
                └── Yes
                    └── Is the input valid?
                        ├── No → throw InvalidInputError (400)
                        └── Yes
                            └── Does it conflict with existing data?
                                ├── Yes → throw ConflictError (409)
                                └── No → proceed with operation
```

## Learn More

- [NestJS Exception Filters](https://docs.nestjs.com/exception-filters)
- [Error Handling in Node.js](https://nodejs.org/en/docs/guides/error-handling)
- [Problem Details for HTTP APIs (RFC 7807)](https://www.rfc-editor.org/rfc/rfc7807)
