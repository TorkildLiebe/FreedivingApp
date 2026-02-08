# Prisma

## What is it?

Prisma is an **ORM** (Object-Relational Mapper). It's the bridge between your TypeScript code and the PostgreSQL database.

Without Prisma, you'd write raw SQL:
```sql
SELECT * FROM dive_spots WHERE id = 'abc-123' AND is_deleted = false;
```

With Prisma, you write TypeScript:
```typescript
const spot = await prisma.diveSpot.findUnique({
  where: { id: "abc-123", isDeleted: false },
});
```

Both do the same thing, but Prisma gives you:
- **Type safety**: Your editor knows what fields exist and their types
- **Autocomplete**: Hit Ctrl+Space and see all available fields and methods
- **Migration management**: Changes to the database structure are tracked in code
- **No SQL injection risk**: Prisma handles escaping automatically

## Core Concepts

### 1. The Schema File (schema.prisma)

This is the **single source of truth** for your database structure. It defines your tables, their columns, and relationships.

```prisma
// prisma/schema.prisma

// Database connection
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")  // Reads from .env file
}

// Code generator
generator client {
  provider = "prisma-client-js"
}

// A "model" = a database table
model DiveSpot {
  id          String   @id @default(uuid())  // Primary key, auto-generated UUID
  name        String                          // Required string
  description String?                         // Optional string (? = nullable)
  latitude    Float
  longitude   Float
  depth       Float?
  createdAt   DateTime @default(now())        // Auto-set on creation
  updatedAt   DateTime @updatedAt             // Auto-updated on changes
  isDeleted   Boolean  @default(false)        // Soft delete flag

  // Relationships
  createdBy   User     @relation(fields: [createdById], references: [id])
  createdById String
  reports     Report[]                        // One spot has many reports
  photos      Photo[]                         // One spot has many photos

  @@map("dive_spots")                         // Actual table name in database
}

model Report {
  id        String   @id @default(uuid())
  title     String
  content   String
  spotId    String
  spot      DiveSpot @relation(fields: [spotId], references: [id])

  @@map("reports")
}
```

Key syntax:
- `@id` = primary key
- `@default(uuid())` = auto-generate a UUID
- `@default(now())` = auto-set to current timestamp
- `@updatedAt` = auto-update on every change
- `?` after type = optional/nullable
- `@relation` = foreign key relationship
- `@@map("table_name")` = the actual table name in Postgres (models are PascalCase, tables are snake_case)

### 2. Prisma Client (Querying Data)

After defining your schema, Prisma generates a **client** - a TypeScript library tailored to YOUR schema. This is what you use in your code.

```bash
# Regenerate the client after schema changes
pnpm prisma generate
```

#### CRUD Operations

```typescript
// CREATE - Insert a new record
const spot = await prisma.diveSpot.create({
  data: {
    name: "Blue Hole",
    latitude: 27.45,
    longitude: 33.95,
    createdById: userId,
  },
});

// READ - Find one by ID
const spot = await prisma.diveSpot.findUnique({
  where: { id: "abc-123" },
});

// READ - Find one or throw (returns 404-like error)
const spot = await prisma.diveSpot.findUniqueOrThrow({
  where: { id: "abc-123" },
});

// READ - Find many with filters
const spots = await prisma.diveSpot.findMany({
  where: {
    isDeleted: false,           // Only non-deleted
    name: { contains: "blue" }, // Name contains "blue"
  },
  orderBy: { createdAt: "desc" }, // Newest first
  take: 10,                       // Limit to 10 results
  skip: 0,                        // Offset (for pagination)
});

// UPDATE - Modify a record
const updated = await prisma.diveSpot.update({
  where: { id: "abc-123" },
  data: { name: "Updated Blue Hole" },
});

// SOFT DELETE - We never actually delete, just mark as deleted
const deleted = await prisma.diveSpot.update({
  where: { id: "abc-123" },
  data: { isDeleted: true },
});
```

#### Including Relations

```typescript
// Get a dive spot WITH its reports and photos
const spot = await prisma.diveSpot.findUnique({
  where: { id: "abc-123" },
  include: {
    reports: true,  // Include all related reports
    photos: true,   // Include all related photos
    createdBy: {    // Include creator, but only certain fields
      select: {
        id: true,
        displayName: true,
      },
    },
  },
});
// spot.reports is now an array of Report objects
// spot.photos is now an array of Photo objects
// spot.createdBy is { id: "...", displayName: "..." }
```

#### Select (Pick Specific Fields)

```typescript
// Only get id and name (more efficient)
const spots = await prisma.diveSpot.findMany({
  select: {
    id: true,
    name: true,
  },
});
// Result: [{ id: "abc", name: "Blue Hole" }, ...]
```

### 3. Transactions

When you need multiple operations to succeed or fail *together*:

```typescript
// Either BOTH happen, or NEITHER happens
const result = await prisma.$transaction(async (tx) => {
  const spot = await tx.diveSpot.create({
    data: { name: "New Spot", /* ... */ },
  });

  await tx.photo.create({
    data: { spotId: spot.id, url: "https://..." },
  });

  return spot;
});
```

If the photo creation fails, the spot creation is automatically rolled back.

### 4. Raw Queries (for PostGIS)

Prisma doesn't understand PostGIS functions, so we use raw SQL for spatial queries:

```typescript
// Find spots within 10km
const nearby = await prisma.$queryRaw<DiveSpot[]>`
  SELECT id, name, latitude, longitude
  FROM dive_spots
  WHERE ST_DWithin(
    location,
    ST_MakePoint(${lng}, ${lat})::geography,
    ${radiusMeters}
  )
  AND is_deleted = false
`;
```

The `${}` syntax safely escapes values (prevents SQL injection).

### 5. Migrations

Migrations track changes to your database structure over time.

```bash
# 1. Edit schema.prisma (add/change models)

# 2. Create a migration (generates SQL and applies it)
pnpm prisma migrate dev --name describe-your-change

# This:
#   - Compares your schema to the database
#   - Generates a SQL migration file
#   - Applies it to your local database
#   - Regenerates Prisma Client

# 3. In production, migrations are applied with:
pnpm prisma migrate deploy
```

Migration files live in `prisma/migrations/` and are **committed to git**. They look like:
```
prisma/migrations/
  20240101_init/
    migration.sql
  20240115_add_dive_spots/
    migration.sql
  20240120_add_reports/
    migration.sql
```

Each migration is applied exactly once, in order.

## Essential Commands

```bash
# Generate/regenerate the Prisma Client
pnpm prisma generate

# Create a migration (development)
pnpm prisma migrate dev --name your-migration-name

# Apply migrations (production)
pnpm prisma migrate deploy

# Reset database (delete everything, re-run all migrations)
pnpm prisma migrate reset

# Open Prisma Studio (web UI to browse data)
pnpm prisma studio

# Format the schema file
pnpm prisma format

# Validate the schema
pnpm prisma validate

# Pull schema from existing database (reverse-engineer)
pnpm prisma db pull

# Push schema to database without creating migration (prototyping only)
pnpm prisma db push
```

## Common Patterns in Our Project

### Repository Pattern

We wrap Prisma calls in repository classes (one per entity):

```typescript
// dive-spot.repository.ts
@Injectable()
export class DiveSpotRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string): Promise<DiveSpot | null> {
    return this.prisma.diveSpot.findUnique({
      where: { id, isDeleted: false }, // Always filter soft deletes!
    });
  }

  async findAll(): Promise<DiveSpot[]> {
    return this.prisma.diveSpot.findMany({
      where: { isDeleted: false }, // Always filter soft deletes!
      orderBy: { createdAt: "desc" },
    });
  }
}
```

### PrismaService

A NestJS wrapper around Prisma Client:

```typescript
// prisma.service.ts
@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  async onModuleInit() {
    await this.$connect(); // Connect to database when the app starts
  }
}
```

## Common Gotchas

| Gotcha | Fix |
|--------|-----|
| `The table does not exist in the current database` | Run `pnpm prisma migrate dev` |
| Types are wrong/missing after schema change | Run `pnpm prisma generate` |
| `Unique constraint violation` | You're trying to create a duplicate. Check unique fields. |
| Forgot to filter `isDeleted` | Always add `isDeleted: false` to `where` clauses |
| `prisma.x is undefined` | Table name is wrong. Check your `@@map()` or model name. |
| `Cannot find module '.prisma/client'` | Run `pnpm prisma generate` |

## Learn More

- [Prisma Docs](https://www.prisma.io/docs) - Very well-written docs
- [Prisma with NestJS](https://docs.nestjs.com/recipes/prisma) - Official NestJS recipe
- [Prisma Playground](https://playground.prisma.io) - Try queries in the browser
