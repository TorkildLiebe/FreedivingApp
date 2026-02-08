# NestJS (with Fastify)

## What is it?

NestJS is a **backend framework** - it gives you a structured way to build a server that receives requests and sends responses (an API).

Without a framework, you'd have to manually handle routing, validation, error handling, authentication, and a hundred other things. NestJS gives you all of that out of the box, with a clear structure so your code doesn't become spaghetti.

**Fastify** is the HTTP engine underneath. NestJS can use either Express or Fastify to handle the actual HTTP requests. We use Fastify because it's ~2x faster than Express. You rarely interact with Fastify directly - NestJS wraps it.

## Why NestJS?

- **Structure**: Forces you to organize code well (modules, controllers, services)
- **TypeScript-first**: Built for TypeScript from day one
- **Dependency injection**: Automatically connects your classes together (explained below)
- **Batteries included**: Auth, validation, database, caching, testing - all built in
- **Similar to Angular**: If you know Angular, NestJS feels familiar

## Core Concepts

### 1. The Request Lifecycle

When someone (the mobile app) sends a request to your API, here's what happens:

```
Mobile App sends: GET /api/dive-spots/abc-123
                          |
                          v
                    [Middleware]        (logging, CORS)
                          |
                          v
                      [Guards]         (is the user logged in?)
                          |
                          v
                   [Interceptors]      (transform request/response)
                          |
                          v
                      [Pipes]          (validate & transform input)
                          |
                          v
                   [Controller]        (receives the request, calls service)
                          |
                          v
                    [Service]          (business logic)
                          |
                          v
                   [Repository]        (talks to database)
                          |
                          v
                    Response sent back to mobile app
```

Don't worry about memorizing all layers. The main three are **Controller -> Service -> Repository**.

### 2. Modules

A module is a **container** that groups related code together. Each feature gets its own module.

```typescript
// dive-spot.module.ts
import { Module } from "@nestjs/common";
import { DiveSpotController } from "./dive-spot.controller";
import { DiveSpotService } from "./dive-spot.service";
import { DiveSpotRepository } from "./dive-spot.repository";

@Module({
  controllers: [DiveSpotController],   // Handles HTTP requests
  providers: [DiveSpotService, DiveSpotRepository], // Business logic + data access
  exports: [DiveSpotService],          // Makes service available to other modules
})
export class DiveSpotModule {}
```

The main `AppModule` imports all feature modules:
```typescript
@Module({
  imports: [DiveSpotModule, AuthModule, UserModule, ReportModule],
})
export class AppModule {}
```

### 3. Controllers (Handle Requests)

Controllers define your API endpoints. They receive HTTP requests and return responses. They should be **thin** - just call the service and return the result.

```typescript
// dive-spot.controller.ts
import { Controller, Get, Post, Param, Body } from "@nestjs/common";

@Controller("dive-spots") // All routes start with /dive-spots
export class DiveSpotController {
  // NestJS automatically injects the service (dependency injection)
  constructor(private readonly diveSpotService: DiveSpotService) {}

  // GET /dive-spots
  @Get()
  async findAll() {
    return this.diveSpotService.findAll();
  }

  // GET /dive-spots/:id
  @Get(":id")
  async findOne(@Param("id") id: string) {
    return this.diveSpotService.findOne(id);
  }

  // POST /dive-spots
  @Post()
  async create(@Body() createDto: CreateDiveSpotDto) {
    return this.diveSpotService.create(createDto);
  }
}
```

### 4. Services (Business Logic)

Services contain the actual **logic** of your app. "Is this dive spot too close to another one?" "Can this user edit this report?" - that's all in services.

```typescript
// dive-spot.service.ts
import { Injectable, NotFoundException } from "@nestjs/common";

@Injectable() // This decorator tells NestJS it can be injected into other classes
export class DiveSpotService {
  constructor(private readonly diveSpotRepo: DiveSpotRepository) {}

  async findOne(id: string): Promise<DiveSpot> {
    const spot = await this.diveSpotRepo.findById(id);

    if (!spot) {
      throw new NotFoundException(`Dive spot ${id} not found`);
      // NestJS automatically turns this into a 404 HTTP response
    }

    return spot;
  }

  async create(dto: CreateDiveSpotDto): Promise<DiveSpot> {
    // Business logic: check proximity constraint
    const tooClose = await this.diveSpotRepo.findNearby(dto.lat, dto.lng, 1000);
    if (tooClose.length > 0) {
      throw new BadRequestException("Too close to existing spot (min 1000m)");
    }

    return this.diveSpotRepo.create(dto);
  }
}
```

### 5. Dependency Injection (DI)

This is the "magic" of NestJS. Instead of creating objects yourself, you declare what you need in the constructor, and NestJS creates and provides them automatically.

```typescript
// WITHOUT dependency injection (manual, messy):
class DiveSpotController {
  private service: DiveSpotService;

  constructor() {
    const prisma = new PrismaService();           // You create everything manually
    const repo = new DiveSpotRepository(prisma);   // And wire them together
    this.service = new DiveSpotService(repo);       // Painful and hard to test
  }
}

// WITH dependency injection (NestJS way):
@Controller("dive-spots")
class DiveSpotController {
  constructor(private readonly service: DiveSpotService) {}
  // NestJS creates the service (and its dependencies) automatically!
}
```

Why this matters:
- **Easier testing**: You can swap real services with mock versions
- **Less boilerplate**: No manual wiring
- **Singleton by default**: Only one instance of each service exists (efficient)

### 6. DTOs and Validation

DTOs (Data Transfer Objects) define the *shape* of incoming data and validate it automatically.

```typescript
// create-dive-spot.dto.ts
import { IsString, IsNumber, IsOptional, Min, Max } from "class-validator";

export class CreateDiveSpotDto {
  @IsString()
  name: string;

  @IsNumber()
  @Min(-90)
  @Max(90)
  latitude: number;

  @IsNumber()
  @Min(-180)
  @Max(180)
  longitude: number;

  @IsOptional()
  @IsString()
  description?: string;
}
```

If someone sends invalid data, NestJS automatically returns a 400 error with details. You don't write any validation code in your controller or service.

### 7. Decorators (The @ Things)

Those `@Get()`, `@Injectable()`, `@Body()` things are **decorators**. They're TypeScript's way of adding metadata/behavior to classes and methods.

Think of them as "labels" that tell NestJS how to treat something:
- `@Controller("path")` - "This class handles HTTP requests at /path"
- `@Get()` / `@Post()` / `@Put()` / `@Delete()` - "This method handles this HTTP verb"
- `@Injectable()` - "This class can be injected into other classes"
- `@Body()` - "Give me the request body"
- `@Param("id")` - "Give me the `id` URL parameter"
- `@Query("page")` - "Give me the `page` query parameter"

## Project Structure

Our project follows **vertical slices** - each feature is self-contained:

```
src/
  modules/
    dive-spot/
      dive-spot.module.ts          # Wires everything together
      dive-spot.controller.ts      # HTTP endpoints
      dive-spot.service.ts         # Business logic
      dive-spot.repository.ts      # Database queries
      dto/
        create-dive-spot.dto.ts    # Input validation
        update-dive-spot.dto.ts
      domain/
        dive-spot.entity.ts        # Type definition
    auth/
      auth.module.ts
      auth.controller.ts
      auth.service.ts
      ...
  common/
    errors/                        # Shared error classes
    guards/                        # Auth guards
    filters/                       # Exception filters
  app.module.ts                    # Root module
  main.ts                          # Entry point
```

## Essential Commands

```bash
# Start dev server (auto-restarts on file changes)
pnpm start:dev

# Build for production
pnpm build

# Run tests
pnpm test

# Run a specific test file
pnpm test -- dive-spot.service.spec.ts

# Generate a new module (scaffolding)
pnpm nest generate module dive-spot
pnpm nest generate controller dive-spot
pnpm nest generate service dive-spot
```

## The main.ts File

This is where the app boots up:

```typescript
// main.ts
import { NestFactory } from "@nestjs/core";
import { FastifyAdapter } from "@nestjs/platform-fastify";
import { AppModule } from "./app.module";
import { ValidationPipe } from "@nestjs/common";

async function bootstrap() {
  // Create the app using Fastify (instead of default Express)
  const app = await NestFactory.create(
    AppModule,
    new FastifyAdapter(),
  );

  // Enable automatic DTO validation
  app.useGlobalPipes(
    new ValidationPipe({ whitelist: true, transform: true }),
  );

  // Start listening on port 3000
  await app.listen(3000, "0.0.0.0");
  console.log("Server running on http://localhost:3000");
}
bootstrap();
```

## Common Gotchas

| Gotcha | Fix |
|--------|-----|
| `Nest can't resolve dependencies` | You forgot to add the provider to the module's `providers` array, or forgot to import/export the module |
| `Cannot GET /route` | Check the controller path and HTTP method decorator |
| `404 on everything` | Make sure the module is imported in `AppModule` |
| Validation not working | Make sure `ValidationPipe` is set up globally and DTO has decorators |
| `Circular dependency` | Two modules depend on each other. Use `forwardRef()` |

## Learn More

- [NestJS Docs](https://docs.nestjs.com) - Excellent official docs with examples
- [NestJS Course (free)](https://www.youtube.com/watch?v=GHTA143_b-s) - Video walkthrough
