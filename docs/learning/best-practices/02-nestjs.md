# NestJS Best Practices

## 1. Module Design

### Keep modules small and focused
Each module should own one domain concept. A "DiveSpotModule" should only handle dive spot logic.

```typescript
// GOOD - focused module
@Module({
  controllers: [DiveSpotController],
  providers: [DiveSpotService, DiveSpotRepository],
  exports: [DiveSpotService], // only export what other modules need
})
export class DiveSpotModule {}

// BAD - god module
@Module({
  controllers: [DiveSpotController, ReportController, PhotoController],
  providers: [DiveSpotService, ReportService, PhotoService, /* ... */],
})
export class EverythingModule {}
```

### Module dependency rules
- Modules should depend **downward** (feature -> common -> prisma)
- Never create circular module dependencies
- If two modules need each other, extract shared logic into a third module
- Use `exports` deliberately - only export providers that other modules actually need

```
AppModule
├── UsersModule          (imports: PrismaModule)
├── DiveSpotModule       (imports: PrismaModule, UsersModule)
├── ReportModule         (imports: PrismaModule, DiveSpotModule)
└── Common
    ├── AuthModule       (imports: UsersModule)
    ├── PrismaModule     (Global)
    └── Filters/Guards   (Global)
```

## 2. Controller Best Practices

### Controllers should be thin
Controllers receive HTTP requests and delegate to services. No business logic.

```typescript
// GOOD - thin controller
@Get(':id')
async findOne(@Param('id') id: string) {
  return this.diveSpotService.findOne(id);
}

// BAD - business logic in controller
@Get(':id')
async findOne(@Param('id') id: string) {
  const spot = await this.prisma.diveSpot.findUnique({ where: { id } });
  if (!spot) throw new NotFoundException();
  if (spot.isDeleted) throw new NotFoundException();
  const photos = await this.prisma.photo.findMany({ where: { spotId: id } });
  return { ...spot, photos };
}
```

### Use proper HTTP methods and status codes

```typescript
@Controller('dive-spots')
export class DiveSpotController {
  @Get()              // 200 OK - list resources
  findAll() {}

  @Get(':id')         // 200 OK - single resource
  findOne() {}

  @Post()
  @HttpCode(201)      // 201 Created - new resource created
  create() {}

  @Put(':id')         // 200 OK - full replacement
  update() {}

  @Patch(':id')       // 200 OK - partial update
  partialUpdate() {}

  @Delete(':id')
  @HttpCode(204)      // 204 No Content - successful delete
  remove() {}
}
```

### Always use DTOs for input

```typescript
// GOOD - validated input
@Post()
create(@Body() dto: CreateDiveSpotDto) {
  return this.service.create(dto);
}

// BAD - unvalidated, untyped input
@Post()
create(@Body() body: any) {
  return this.service.create(body.name, body.lat, body.lng);
}
```

## 3. Service Layer Best Practices

### Services own business logic
All validation, business rules, and orchestration happen here.

```typescript
@Injectable()
export class DiveSpotService {
  constructor(
    private readonly spotRepo: DiveSpotRepository,
    private readonly photoRepo: PhotoRepository,
  ) {}

  async create(dto: CreateDiveSpotDto, userId: string): Promise<DiveSpot> {
    // Business rule: proximity check
    const nearby = await this.spotRepo.findNearby(dto.latitude, dto.longitude, 1000);
    if (nearby.length > 0) {
      throw new SpotTooCloseError();
    }

    // Business rule: photo limit
    if (dto.photos && dto.photos.length > 5) {
      throw new TooManyPhotosError();
    }

    return this.spotRepo.create({ ...dto, createdById: userId });
  }
}
```

### Throw domain errors, not HTTP errors
Services should throw domain-specific errors. Exception filters map them to HTTP responses.

```typescript
// GOOD - domain error (service doesn't know about HTTP)
throw new SpotNotFoundError(id);
throw new SpotTooCloseError(distance);
throw new EditWindowExpiredError();

// ACCEPTABLE for simple cases - NestJS built-in exceptions
throw new NotFoundException(`Spot ${id} not found`);
throw new ForbiddenException('Cannot edit after 48h');

// BAD - raw HTTP concepts in business logic
throw new HttpException('Not found', 404);
```

### Single responsibility
Each method should do one thing. If a method has multiple responsibilities, split it.

```typescript
// BAD - method does too much
async createSpotWithPhotosAndNotify(dto, userId) {
  // validates, creates spot, uploads photos, sends notification, updates cache...
}

// GOOD - separate concerns
async createSpot(dto, userId) { /* ... */ }
async addPhotos(spotId, photos) { /* ... */ }
// Notifications can be event-driven (not in MVP)
```

## 4. Dependency Injection Patterns

### Inject interfaces, not implementations (when it matters)

```typescript
// For most cases, injecting the class directly is fine
constructor(private readonly spotRepo: DiveSpotRepository) {}

// For swappable implementations, use injection tokens
// Example: different storage backends
constructor(
  @Inject('STORAGE_SERVICE') private readonly storage: StorageService,
) {}
```

### Scope: stick with default singleton

```typescript
// DEFAULT (singleton) - one instance shared by all requests - use this
@Injectable()
export class DiveSpotService {}

// REQUEST scope - new instance per request - avoid unless needed
// Creates performance overhead because every dependency must also be request-scoped
@Injectable({ scope: Scope.REQUEST })
export class DiveSpotService {}
```

Only use REQUEST scope when you genuinely need per-request state (rare).

## 5. Guards

### Use guards for authentication and authorization

```typescript
// Auth guard - verifies JWT, attaches user to request
@Injectable()
export class AuthGuard implements CanActivate {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const token = this.extractToken(request);
    if (!token) return false;

    const user = await this.jwtService.verify(token);
    request.user = user;
    return true;
  }
}

// Role guard - checks user has required role
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.get<string[]>('roles', context.getHandler());
    if (!requiredRoles) return true; // no roles required

    const { user } = context.switchToHttp().getRequest();
    return requiredRoles.includes(user.role);
  }
}

// Usage with custom decorator
@Roles('admin', 'moderator')
@UseGuards(AuthGuard, RolesGuard)
@Delete(':id')
async hardDelete(@Param('id') id: string) {}
```

### Guard ordering matters
Guards execute in the order they appear. Put auth guard first.

```typescript
// AuthGuard runs first (sets req.user), then RolesGuard checks roles
@UseGuards(AuthGuard, RolesGuard)
```

## 6. Pipes for Validation

### Global ValidationPipe configuration (already set up in main.ts)

```typescript
app.useGlobalPipes(
  new ValidationPipe({
    whitelist: true,       // Strip unknown properties
    transform: true,       // Auto-transform types (string "1" -> number 1)
    forbidNonWhitelisted: true, // Throw error if unknown properties sent
  }),
);
```

### DTO validation decorators

```typescript
export class CreateDiveSpotDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name: string;

  @IsNumber()
  @Min(-90)
  @Max(90)
  latitude: number;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string;

  // Nested validation
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => CreateParkingDto)
  @ArrayMaxSize(5)
  parkingSpots?: CreateParkingDto[];
}
```

### Custom validation decorators for domain rules

```typescript
// Custom decorator for "no emoji in text" rule
function NoEmoji(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: 'noEmoji',
      target: object.constructor,
      propertyName,
      options: validationOptions,
      validator: {
        validate(value: string) {
          const emojiRegex = /[\u{1F600}-\u{1F64F}]/u;
          return !emojiRegex.test(value);
        },
        defaultMessage() {
          return 'Text must not contain emoji';
        },
      },
    });
  };
}

// Usage
export class CreateDiveSpotDto {
  @IsString()
  @NoEmoji()
  name: string;
}
```

## 7. Exception Filters

### Map domain errors to HTTP responses

```typescript
@Catch()
export class DomainExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();

    if (exception instanceof SpotNotFoundError) {
      return response.status(404).send({
        statusCode: 404,
        message: exception.message,
        error: 'Not Found',
      });
    }

    if (exception instanceof SpotTooCloseError) {
      return response.status(400).send({
        statusCode: 400,
        message: exception.message,
        error: 'Bad Request',
      });
    }

    // Fallback for unhandled errors
    return response.status(500).send({
      statusCode: 500,
      message: 'Internal server error',
      error: 'Internal Server Error',
    });
  }
}
```

### Never expose stack traces or internal details

```typescript
// BAD - leaks implementation details
catch(error) {
  return response.status(500).send({
    message: error.message,
    stack: error.stack,
    query: 'SELECT * FROM users WHERE...',
  });
}

// GOOD - generic message, log the details server-side
catch(error) {
  this.logger.error('Unhandled error', error.stack);
  return response.status(500).send({
    statusCode: 500,
    message: 'Internal server error',
  });
}
```

## 8. Testing NestJS

### Use Test.createTestingModule for unit tests

```typescript
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
          },
        },
      ],
    }).compile();

    service = module.get(DiveSpotService);
    repository = module.get(DiveSpotRepository);
  });

  it('should throw when spot not found', async () => {
    repository.findById.mockResolvedValue(null);
    await expect(service.findOne('nonexistent')).rejects.toThrow(NotFoundException);
  });
});
```

### E2E tests with supertest

```typescript
describe('DiveSpotController (e2e)', () => {
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

  it('GET /dive-spots returns array', () => {
    return request(app.getHttpServer())
      .get('/dive-spots')
      .expect(200)
      .expect((res) => {
        expect(Array.isArray(res.body)).toBe(true);
      });
  });
});
```

## 9. Logging

```typescript
// Use NestJS built-in Logger, not console.log
import { Logger } from '@nestjs/common';

@Injectable()
export class DiveSpotService {
  private readonly logger = new Logger(DiveSpotService.name);

  async create(dto: CreateDiveSpotDto) {
    this.logger.log(`Creating dive spot: ${dto.name}`);
    // ...
    this.logger.warn(`Spot created near existing spot at ${distance}m`);
    this.logger.error(`Failed to create spot`, error.stack);
  }
}
```

## Quick Reference: File Conventions

| Layer | File | Class | Purpose |
|-------|------|-------|---------|
| Module | `dive-spot.module.ts` | `DiveSpotModule` | Wires components |
| Controller | `dive-spot.controller.ts` | `DiveSpotController` | HTTP endpoints |
| Service | `dive-spot.service.ts` | `DiveSpotService` | Business logic |
| Repository | `dive-spot.repository.ts` | `DiveSpotRepository` | Database queries |
| DTO | `dto/create-dive-spot.dto.ts` | `CreateDiveSpotDto` | Input validation |
| Test | `dive-spot.service.spec.ts` | - | Unit test |
| E2E Test | `test/dive-spot.e2e-spec.ts` | - | Integration test |

## Learn More

- [NestJS Docs - Fundamentals](https://docs.nestjs.com/fundamentals/custom-providers)
- [NestJS Docs - Techniques](https://docs.nestjs.com/techniques/configuration)
- [NestJS Docs - Security](https://docs.nestjs.com/security/authentication)
